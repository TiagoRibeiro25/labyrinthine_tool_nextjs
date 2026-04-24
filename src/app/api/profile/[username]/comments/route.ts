import { and, desc, eq, or, sql } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import {
	PROFILE_COMMENT_COOLDOWN_MS as COMMENT_COOLDOWN_MS,
	PROFILE_COMMENT_DUPLICATE_WINDOW_MS as DUPLICATE_WINDOW_MS,
	PROFILE_COMMENT_MIN_ACCOUNT_AGE_MS as MIN_ACCOUNT_AGE_MS,
} from "../../../../../constants/profile-comments";
import { db } from "../../../../../db";
import {
	profileCommentReactions,
	profileComments,
	users,
} from "../../../../../db/schema";
import { authOptions } from "../../../../../lib/auth";
import {
	canUserCommentOnProfile,
	containsDisallowedCommentText,
	normalizeCommentContent,
} from "../../../../../lib/profile-comments";
import { rateLimit, toRateLimitHeaders } from "../../../../../lib/rate-limit";
import { getClientIpFromHeaders } from "../../../../../lib/request";
import { createNotifications } from "../../../../../lib/social";
import {
	getFirstZodErrorMessage,
	profileCommentCreateBodySchema,
	profileCommentsQuerySchema,
} from "../../../../../lib/validation";

export async function GET(
	req: Request,
	context: { params: Promise<{ username: string }> }
) {
	try {
		const { username } = await context.params;
		const session = await getServerSession(authOptions);
		const sessionUser = session?.user as { id?: string } | undefined;
		const currentUserId = sessionUser?.id ?? null;

		const profileRows = await db
			.select({
				id: users.id,
				username: users.username,
				visibility: users.profileCommentVisibility,
			})
			.from(users)
			.where(eq(users.username, username))
			.limit(1);

		const targetProfile = profileRows[0];
		if (!targetProfile) {
			return NextResponse.json({ message: "Profile not found." }, { status: 404 });
		}

		const url = new URL(req.url);
		const parsed = profileCommentsQuerySchema.safeParse({
			page: url.searchParams.get("page") ?? undefined,
			limit: url.searchParams.get("limit") ?? undefined,
			sort: url.searchParams.get("sort") ?? undefined,
		});

		if (!parsed.success) {
			return NextResponse.json(
				{ message: getFirstZodErrorMessage(parsed.error) },
				{ status: 400 }
			);
		}

		const { page, limit, sort } = parsed.data;
		const isOwner = currentUserId === targetProfile.id;

		const visibilityFilter = isOwner
			? eq(profileComments.profileUserId, targetProfile.id)
			: currentUserId
				? and(
						eq(profileComments.profileUserId, targetProfile.id),
						or(
							eq(profileComments.isHidden, false),
							eq(profileComments.authorUserId, currentUserId)
						)
					)
				: and(
						eq(profileComments.profileUserId, targetProfile.id),
						eq(profileComments.isHidden, false)
					);

		const totalItemsResult = await db
			.select({ count: sql<number>`count(*)`.mapWith(Number) })
			.from(profileComments)
			.where(visibilityFilter);

		const totalItems = totalItemsResult[0]?.count ?? 0;
		const totalPages = Math.max(1, Math.ceil(totalItems / limit));
		const safePage = Math.min(page, totalPages);
		const offset = (safePage - 1) * limit;

		const likeCountSql = sql<number>`(
			select count(*)::int
			from ${profileCommentReactions}
			where ${profileCommentReactions.commentId} = ${profileComments.id}
		)`.mapWith(Number);

		const currentUserLikedSql = currentUserId
			? sql<boolean>`exists(
				select 1
				from ${profileCommentReactions}
				where ${profileCommentReactions.commentId} = ${profileComments.id}
				and ${profileCommentReactions.userId} = ${currentUserId}
			)`
			: sql<boolean>`false`;

		const rows = await db
			.select({
				id: profileComments.id,
				profileUserId: profileComments.profileUserId,
				authorUserId: profileComments.authorUserId,
				content: profileComments.content,
				isPinned: profileComments.isPinned,
				isEdited: profileComments.isEdited,
				isHidden: profileComments.isHidden,
				createdAt: profileComments.createdAt,
				updatedAt: profileComments.updatedAt,
				likeCount: likeCountSql,
				currentUserLiked: currentUserLikedSql,
				authorUsername: users.username,
				authorProfilePictureId: users.profilePictureId,
				authorSteamAvatarUrl: users.steamAvatarUrl,
				authorUseSteamAvatar: users.useSteamAvatar,
				authorDiscordAvatarUrl: users.discordAvatarUrl,
				authorUseDiscordAvatar: users.useDiscordAvatar,
			})
			.from(profileComments)
			.innerJoin(users, eq(users.id, profileComments.authorUserId))
			.where(visibilityFilter)
			.orderBy(
				desc(profileComments.isPinned),
				sort === "top" ? desc(likeCountSql) : desc(profileComments.createdAt),
				desc(profileComments.createdAt)
			)
			.limit(limit)
			.offset(offset);

		const canCurrentUserComment = currentUserId
			? await canUserCommentOnProfile({
					profileUserId: targetProfile.id,
					authorUserId: currentUserId,
					visibility: targetProfile.visibility,
				})
			: false;

		return NextResponse.json(
			{
				comments: rows.map((row) => ({
					id: row.id,
					content: row.content,
					isPinned: row.isPinned,
					isEdited: row.isEdited,
					isHidden: row.isHidden,
					likeCount: row.likeCount,
					currentUserLiked: row.currentUserLiked,
					createdAt: row.createdAt,
					updatedAt: row.updatedAt,
					author: {
						id: row.authorUserId,
						username: row.authorUsername,
						profilePictureId: row.authorProfilePictureId,
						steamAvatarUrl: row.authorSteamAvatarUrl,
						useSteamAvatar: row.authorUseSteamAvatar,
						discordAvatarUrl: row.authorDiscordAvatarUrl,
						useDiscordAvatar: row.authorUseDiscordAvatar,
					},
					permissions: {
						canEdit: currentUserId === row.authorUserId,
						canDelete:
							currentUserId === row.authorUserId || currentUserId === targetProfile.id,
						canHide: currentUserId === targetProfile.id,
						canPin: currentUserId === targetProfile.id,
						canReport:
							Boolean(currentUserId) &&
							currentUserId !== row.authorUserId &&
							currentUserId !== targetProfile.id,
					},
				})),
				policy: {
					visibility: targetProfile.visibility,
					canCurrentUserComment,
				},
				pagination: {
					page: safePage,
					limit,
					totalItems,
					totalPages,
					hasNextPage: safePage < totalPages,
					hasPreviousPage: safePage > 1,
				},
			},
			{ status: 200 }
		);
	} catch (error) {
		console.error("Error fetching profile comments:", error);
		return NextResponse.json(
			{ message: "An internal server error occurred." },
			{ status: 500 }
		);
	}
}

export async function POST(
	req: Request,
	context: { params: Promise<{ username: string }> }
) {
	try {
		const session = await getServerSession(authOptions);
		const sessionUser = session?.user as { id?: string } | undefined;

		if (!sessionUser?.id) {
			return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
		}

		const { username } = await context.params;
		const authorUserId = sessionUser.id;
		const clientIp = getClientIpFromHeaders(req.headers);

		const userRateLimit = rateLimit({
			key: `profile-comments:user:${authorUserId}`,
			limit: 40,
			windowMs: 10 * 60 * 1000,
		});

		if (!userRateLimit.success) {
			return NextResponse.json(
				{ message: "Too many comment actions. Please try again shortly." },
				{ status: 429, headers: toRateLimitHeaders(userRateLimit) }
			);
		}

		const postRateLimit = rateLimit({
			key: `profile-comments:create:${authorUserId}:${clientIp}`,
			limit: 20,
			windowMs: 10 * 60 * 1000,
		});

		if (!postRateLimit.success) {
			return NextResponse.json(
				{ message: "Too many comments posted. Please try again later." },
				{ status: 429, headers: toRateLimitHeaders(postRateLimit) }
			);
		}

		let body: unknown;
		try {
			body = await req.json();
		} catch {
			return NextResponse.json(
				{ message: "Invalid JSON body." },
				{ status: 400, headers: toRateLimitHeaders(userRateLimit) }
			);
		}

		const parsed = profileCommentCreateBodySchema.safeParse(body);
		if (!parsed.success) {
			return NextResponse.json(
				{ message: getFirstZodErrorMessage(parsed.error) },
				{ status: 400, headers: toRateLimitHeaders(userRateLimit) }
			);
		}

		const normalizedContent = normalizeCommentContent(parsed.data.content);
		if (containsDisallowedCommentText(normalizedContent)) {
			return NextResponse.json(
				{
					message: "Comment contains blocked terms. Please rephrase and try again.",
				},
				{ status: 400, headers: toRateLimitHeaders(userRateLimit) }
			);
		}

		const [targetProfile] = await db
			.select({
				id: users.id,
				username: users.username,
				visibility: users.profileCommentVisibility,
			})
			.from(users)
			.where(eq(users.username, username))
			.limit(1);

		if (!targetProfile) {
			return NextResponse.json(
				{ message: "Profile not found." },
				{ status: 404, headers: toRateLimitHeaders(userRateLimit) }
			);
		}

		const [author] = await db
			.select({
				id: users.id,
				username: users.username,
				createdAt: users.createdAt,
			})
			.from(users)
			.where(eq(users.id, authorUserId))
			.limit(1);

		if (!author) {
			return NextResponse.json(
				{ message: "Unauthorized." },
				{ status: 401, headers: toRateLimitHeaders(userRateLimit) }
			);
		}

		if (Date.now() - author.createdAt.getTime() < MIN_ACCOUNT_AGE_MS) {
			return NextResponse.json(
				{
					message:
						"Your account is too new to post profile comments. Please try again shortly.",
				},
				{ status: 403, headers: toRateLimitHeaders(userRateLimit) }
			);
		}

		const allowed = await canUserCommentOnProfile({
			profileUserId: targetProfile.id,
			authorUserId,
			visibility: targetProfile.visibility,
		});

		if (!allowed) {
			return NextResponse.json(
				{
					message:
						"You cannot comment on this profile due to the owner's privacy settings.",
				},
				{ status: 403, headers: toRateLimitHeaders(userRateLimit) }
			);
		}

		const sinceCooldownIso = new Date(Date.now() - COMMENT_COOLDOWN_MS).toISOString();
		const recentCommentRows = await db
			.select({
				id: profileComments.id,
				createdAt: profileComments.createdAt,
				content: profileComments.content,
			})
			.from(profileComments)
			.where(
				and(
					eq(profileComments.profileUserId, targetProfile.id),
					eq(profileComments.authorUserId, authorUserId),
					sql`${profileComments.createdAt} >= ${sinceCooldownIso}`
				)
			)
			.orderBy(desc(profileComments.createdAt))
			.limit(1);

		if (recentCommentRows.length > 0) {
			return NextResponse.json(
				{
					message: "You are posting too fast. Please wait before commenting again.",
				},
				{ status: 429, headers: toRateLimitHeaders(userRateLimit) }
			);
		}

		const duplicateSinceIso = new Date(Date.now() - DUPLICATE_WINDOW_MS).toISOString();
		const duplicateRows = await db
			.select({ id: profileComments.id })
			.from(profileComments)
			.where(
				and(
					eq(profileComments.profileUserId, targetProfile.id),
					eq(profileComments.authorUserId, authorUserId),
					eq(profileComments.content, normalizedContent),
					sql`${profileComments.createdAt} >= ${duplicateSinceIso}`
				)
			)
			.limit(1);

		if (duplicateRows.length > 0) {
			return NextResponse.json(
				{
					message: "Duplicate comment detected. Please avoid repeating the same message.",
				},
				{ status: 400, headers: toRateLimitHeaders(userRateLimit) }
			);
		}

		const inserted = await db
			.insert(profileComments)
			.values({
				profileUserId: targetProfile.id,
				authorUserId,
				content: normalizedContent,
			})
			.returning({ id: profileComments.id });

		if (targetProfile.id !== authorUserId) {
			await createNotifications([
				{
					userId: targetProfile.id,
					actorUserId: authorUserId,
					type: "profile_comment",
					title: "New profile comment",
					message: `${author.username} commented on your profile.`,
					href: `/profile/${targetProfile.username}`,
				},
			]);
		}

		return NextResponse.json(
			{ message: "Comment posted.", id: inserted[0]?.id ?? null },
			{ status: 201, headers: toRateLimitHeaders(userRateLimit) }
		);
	} catch (error) {
		console.error("Error posting profile comment:", error);
		return NextResponse.json(
			{ message: "An internal server error occurred." },
			{ status: 500 }
		);
	}
}
