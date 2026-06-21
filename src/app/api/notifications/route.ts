import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { REALTIME_TOPICS } from "../../../constants/realtime";
import { db } from "../../../db";
import { notifications, users } from "../../../db/schema";
import { requireSession, computePagination, computeOffset, parseBody } from "../../../lib/api-helpers";
import { emitRealtimeHint } from "../../../lib/realtime";
import {
	notificationsMarkReadBodySchema,
	notificationsQuerySchema,
} from "../../../lib/validation";

export async function GET(req: Request) {
	try {
		const auth = await requireSession();
		if ("error" in auth) return auth.error;

		const url = new URL(req.url);
		const parsed = notificationsQuerySchema.safeParse({
			page: url.searchParams.get("page") ?? undefined,
			limit: url.searchParams.get("limit") ?? undefined,
			unreadOnly: url.searchParams.get("unreadOnly") ?? undefined,
		});

		if (!parsed.success) {
			return NextResponse.json(
				{ message: "Invalid query parameters." },
				{ status: 400 }
			);
		}

		const { page, limit, unreadOnly } = parsed.data;

		const baseWhere = unreadOnly
			? and(eq(notifications.userId, auth.userId), eq(notifications.isRead, false))
			: eq(notifications.userId, auth.userId);

		const totalItemsResult = await db
			.select({ count: sql<number>`count(*)`.mapWith(Number) })
			.from(notifications)
			.where(baseWhere);

		const totalItems = totalItemsResult[0]?.count ?? 0;
		const pagination = computePagination(totalItems, page, limit);
		const offset = computeOffset(pagination.page, limit);

		const rows = await db
			.select({
				id: notifications.id,
				type: notifications.type,
				title: notifications.title,
				message: notifications.message,
				href: notifications.href,
				isRead: notifications.isRead,
				createdAt: notifications.createdAt,
				actorUserId: notifications.actorUserId,
			})
			.from(notifications)
			.where(baseWhere)
			.orderBy(desc(notifications.createdAt))
			.limit(limit)
			.offset(offset);

		const userIds = Array.from(
			new Set([
				auth.userId,
				...rows
					.map((row) => row.actorUserId)
					.filter((value): value is string => Boolean(value)),
			])
		);

		const userRows = userIds.length
			? await db
					.select({
						id: users.id,
						username: users.username,
						profilePictureId: users.profilePictureId,
						steamAvatarUrl: users.steamAvatarUrl,
						useSteamAvatar: users.useSteamAvatar,
						discordAvatarUrl: users.discordAvatarUrl,
						useDiscordAvatar: users.useDiscordAvatar,
					})
					.from(users)
					.where(inArray(users.id, userIds))
			: [];

		const userMap = new Map(userRows.map((row) => [row.id, row]));
		const recipientUser = userMap.get(auth.userId) ?? null;

		const unreadCountResult = await db
			.select({ count: sql<number>`count(*)`.mapWith(Number) })
			.from(notifications)
			.where(
				and(eq(notifications.userId, auth.userId), eq(notifications.isRead, false))
			);

		return NextResponse.json(
			{
				data: rows.map((row) => {
					const actorUser = row.actorUserId
						? (userMap.get(row.actorUserId) ?? null)
						: null;
					const displayUser = actorUser ?? recipientUser;

					return {
						id: row.id,
						type: row.type,
						title: row.title,
						message: row.message,
						href: row.href,
						isRead: row.isRead,
						createdAt: row.createdAt,
						actor: displayUser
							? {
									id: displayUser.id,
									username: displayUser.username,
									profilePictureId: displayUser.profilePictureId,
									steamAvatarUrl: displayUser.steamAvatarUrl,
									useSteamAvatar: displayUser.useSteamAvatar,
									discordAvatarUrl: displayUser.discordAvatarUrl,
									useDiscordAvatar: displayUser.useDiscordAvatar,
								}
							: null,
					};
				}),
				unreadCount: unreadCountResult[0]?.count ?? 0,
				pagination,
			},
			{ status: 200 }
		);
	} catch (error) {
		console.error("Error fetching notifications:", error);
		return NextResponse.json(
			{ message: "An internal server error occurred." },
			{ status: 500 }
		);
	}
}

export async function PATCH(req: Request) {
	try {
		const auth = await requireSession();
		if ("error" in auth) return auth.error;

		const parsed = await parseBody(req, notificationsMarkReadBodySchema);
		if ("error" in parsed) return parsed.error;

		const { notificationId, markAll } = parsed.data;

		if (markAll) {
			await db
				.update(notifications)
				.set({ isRead: true, readAt: new Date() })
				.where(
					and(eq(notifications.userId, auth.userId), eq(notifications.isRead, false))
				);

			emitRealtimeHint({
				topic: REALTIME_TOPICS.NOTIFICATIONS,
				userIds: [auth.userId],
			});

			return NextResponse.json(
				{ message: "All notifications marked as read." },
				{ status: 200 }
			);
		}

		if (!notificationId) {
			return NextResponse.json(
				{ message: "Notification ID is required." },
				{ status: 400 }
			);
		}

		await db
			.update(notifications)
			.set({ isRead: true, readAt: new Date() })
			.where(
				and(
					eq(notifications.id, notificationId),
					eq(notifications.userId, auth.userId)
				)
			);

		emitRealtimeHint({
			topic: REALTIME_TOPICS.NOTIFICATIONS,
			userIds: [auth.userId],
		});

		return NextResponse.json(
			{ message: "Notification marked as read." },
			{ status: 200 }
		);
	} catch (error) {
		console.error("Error updating notifications:", error);
		return NextResponse.json(
			{ message: "An internal server error occurred." },
			{ status: 500 }
		);
	}
}
