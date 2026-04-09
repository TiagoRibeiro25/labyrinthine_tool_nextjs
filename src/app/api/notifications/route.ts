import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { REALTIME_TOPICS } from "../../../constants/realtime";
import { db } from "../../../db";
import { notifications, users } from "../../../db/schema";
import { authOptions } from "../../../lib/auth";
import { emitRealtimeHint } from "../../../lib/realtime";
import {
	getFirstZodErrorMessage,
	notificationsMarkReadBodySchema,
	notificationsQuerySchema,
} from "../../../lib/validation";

export async function GET(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		const sessionUser = session?.user as { id?: string } | undefined;

		if (!sessionUser?.id) {
			return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
		}

		const url = new URL(req.url);
		const parsed = notificationsQuerySchema.safeParse({
			page: url.searchParams.get("page") ?? undefined,
			limit: url.searchParams.get("limit") ?? undefined,
			unreadOnly: url.searchParams.get("unreadOnly") ?? undefined,
		});

		if (!parsed.success) {
			return NextResponse.json(
				{ message: getFirstZodErrorMessage(parsed.error) },
				{ status: 400 }
			);
		}

		const { page, limit, unreadOnly } = parsed.data;

		const baseWhere = unreadOnly
			? and(eq(notifications.userId, sessionUser.id), eq(notifications.isRead, false))
			: eq(notifications.userId, sessionUser.id);

		const totalItemsResult = await db
			.select({ count: sql<number>`count(*)`.mapWith(Number) })
			.from(notifications)
			.where(baseWhere);

		const totalItems = totalItemsResult[0]?.count ?? 0;
		const totalPages = Math.max(1, Math.ceil(totalItems / limit));
		const safePage = Math.min(page, totalPages);
		const offset = (safePage - 1) * limit;

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
				sessionUser.id,
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
						discordAvatarUrl: users.discordAvatarUrl,
						useDiscordAvatar: users.useDiscordAvatar,
					})
					.from(users)
					.where(inArray(users.id, userIds))
			: [];

		const userMap = new Map(userRows.map((row) => [row.id, row]));
		const recipientUser = userMap.get(sessionUser.id) ?? null;

		const unreadCountResult = await db
			.select({ count: sql<number>`count(*)`.mapWith(Number) })
			.from(notifications)
			.where(
				and(eq(notifications.userId, sessionUser.id), eq(notifications.isRead, false))
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
									discordAvatarUrl: displayUser.discordAvatarUrl,
									useDiscordAvatar: displayUser.useDiscordAvatar,
								}
							: null,
					};
				}),
				unreadCount: unreadCountResult[0]?.count ?? 0,
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
		console.error("Error fetching notifications:", error);
		return NextResponse.json(
			{ message: "An internal server error occurred." },
			{ status: 500 }
		);
	}
}

export async function PATCH(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		const sessionUser = session?.user as { id?: string } | undefined;

		if (!sessionUser?.id) {
			return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
		}

		let body: unknown;
		try {
			body = await req.json();
		} catch {
			return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
		}

		const parsed = notificationsMarkReadBodySchema.safeParse(body);

		if (!parsed.success) {
			return NextResponse.json(
				{ message: getFirstZodErrorMessage(parsed.error) },
				{ status: 400 }
			);
		}

		const { notificationId, markAll } = parsed.data;

		if (markAll) {
			await db
				.update(notifications)
				.set({ isRead: true, readAt: new Date() })
				.where(
					and(eq(notifications.userId, sessionUser.id), eq(notifications.isRead, false))
				);

			emitRealtimeHint({
				topic: REALTIME_TOPICS.NOTIFICATIONS,
				userIds: [sessionUser.id],
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
					eq(notifications.userId, sessionUser.id)
				)
			);

		emitRealtimeHint({
			topic: REALTIME_TOPICS.NOTIFICATIONS,
			userIds: [sessionUser.id],
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
