import { and, eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { db } from "../../../../../db";
import { profileCommentReactions, profileComments } from "../../../../../db/schema";
import { authOptions } from "../../../../../lib/auth";
import {
	containsDisallowedCommentText,
	normalizeCommentContent,
} from "../../../../../lib/profile-comments";
import { rateLimit, toRateLimitHeaders } from "../../../../../lib/rate-limit";
import {
	getFirstZodErrorMessage,
	profileCommentUpdateBodySchema,
} from "../../../../../lib/validation";

export async function PATCH(
	req: Request,
	context: { params: Promise<{ commentId: string }> }
) {
	try {
		const session = await getServerSession(authOptions);
		const sessionUser = session?.user as { id?: string } | undefined;

		if (!sessionUser?.id) {
			return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
		}

		const userId = sessionUser.id;
		const { commentId } = await context.params;

		const userRateLimit = rateLimit({
			key: `profile-comments:mutate:${userId}`,
			limit: 80,
			windowMs: 10 * 60 * 1000,
		});

		if (!userRateLimit.success) {
			return NextResponse.json(
				{ message: "Too many comment actions. Please try again shortly." },
				{ status: 429, headers: toRateLimitHeaders(userRateLimit) }
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

		const parsed = profileCommentUpdateBodySchema.safeParse(body);
		if (!parsed.success) {
			return NextResponse.json(
				{ message: getFirstZodErrorMessage(parsed.error) },
				{ status: 400, headers: toRateLimitHeaders(userRateLimit) }
			);
		}

		const commentRows = await db
			.select({
				id: profileComments.id,
				authorUserId: profileComments.authorUserId,
				profileUserId: profileComments.profileUserId,
				isPinned: profileComments.isPinned,
			})
			.from(profileComments)
			.where(eq(profileComments.id, commentId))
			.limit(1);

		const comment = commentRows[0];
		if (!comment) {
			return NextResponse.json(
				{ message: "Comment not found." },
				{ status: 404, headers: toRateLimitHeaders(userRateLimit) }
			);
		}

		const isAuthor = comment.authorUserId === userId;
		const isProfileOwner = comment.profileUserId === userId;
		const { action } = parsed.data;

		if (action === "edit") {
			if (!isAuthor) {
				return NextResponse.json(
					{ message: "You can only edit your own comments." },
					{ status: 403, headers: toRateLimitHeaders(userRateLimit) }
				);
			}

			const normalizedContent = normalizeCommentContent(parsed.data.content || "");
			if (containsDisallowedCommentText(normalizedContent)) {
				return NextResponse.json(
					{
						message: "Comment contains blocked terms. Please rephrase and try again.",
					},
					{ status: 400, headers: toRateLimitHeaders(userRateLimit) }
				);
			}

			await db
				.update(profileComments)
				.set({
					content: normalizedContent,
					isEdited: true,
					updatedAt: new Date(),
				})
				.where(
					and(eq(profileComments.id, commentId), eq(profileComments.authorUserId, userId))
				);

			return NextResponse.json(
				{ message: "Comment updated." },
				{ status: 200, headers: toRateLimitHeaders(userRateLimit) }
			);
		}

		if (action === "delete") {
			if (!isAuthor && !isProfileOwner) {
				return NextResponse.json(
					{ message: "You cannot delete this comment." },
					{ status: 403, headers: toRateLimitHeaders(userRateLimit) }
				);
			}

			await db.delete(profileComments).where(eq(profileComments.id, commentId));

			return NextResponse.json(
				{ message: "Comment deleted." },
				{ status: 200, headers: toRateLimitHeaders(userRateLimit) }
			);
		}

		if (action === "pin") {
			if (!isProfileOwner) {
				return NextResponse.json(
					{ message: "Only the profile owner can pin comments." },
					{ status: 403, headers: toRateLimitHeaders(userRateLimit) }
				);
			}

			if (comment.isPinned) {
				await db
					.update(profileComments)
					.set({ isPinned: false, updatedAt: new Date() })
					.where(eq(profileComments.id, commentId));
			} else {
				await db
					.update(profileComments)
					.set({ isPinned: false, updatedAt: new Date() })
					.where(eq(profileComments.profileUserId, comment.profileUserId));

				await db
					.update(profileComments)
					.set({ isPinned: true, updatedAt: new Date() })
					.where(eq(profileComments.id, commentId));
			}

			return NextResponse.json(
				{ message: "Comment pin state updated." },
				{ status: 200, headers: toRateLimitHeaders(userRateLimit) }
			);
		}

		if (action === "hide" || action === "unhide") {
			if (!isProfileOwner) {
				return NextResponse.json(
					{ message: "Only the profile owner can moderate wall comments." },
					{ status: 403, headers: toRateLimitHeaders(userRateLimit) }
				);
			}

			await db
				.update(profileComments)
				.set({ isHidden: action === "hide", updatedAt: new Date() })
				.where(eq(profileComments.id, commentId));

			return NextResponse.json(
				{
					message: action === "hide" ? "Comment hidden." : "Comment is visible again.",
				},
				{ status: 200, headers: toRateLimitHeaders(userRateLimit) }
			);
		}

		if (action === "like" || action === "unlike") {
			if (action === "like") {
				await db
					.insert(profileCommentReactions)
					.values({ commentId, userId })
					.onConflictDoNothing();
			} else {
				await db
					.delete(profileCommentReactions)
					.where(
						and(
							eq(profileCommentReactions.commentId, commentId),
							eq(profileCommentReactions.userId, userId)
						)
					);
			}

			return NextResponse.json(
				{ message: action === "like" ? "Comment liked." : "Comment unliked." },
				{ status: 200, headers: toRateLimitHeaders(userRateLimit) }
			);
		}

		return NextResponse.json(
			{ message: "Invalid action." },
			{ status: 400, headers: toRateLimitHeaders(userRateLimit) }
		);
	} catch (error) {
		console.error("Error updating profile comment:", error);
		return NextResponse.json(
			{ message: "An internal server error occurred." },
			{ status: 500 }
		);
	}
}
