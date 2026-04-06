import { and, eq, or } from "drizzle-orm";
import { db } from "../db";
import { activityEvents, friendRequests, notifications } from "../db/schema";

export async function getAcceptedFriendIds(userId: string): Promise<string[]> {
	const rows = await db
		.select({ senderId: friendRequests.senderId, receiverId: friendRequests.receiverId })
		.from(friendRequests)
		.where(
			and(
				eq(friendRequests.status, "accepted"),
				or(eq(friendRequests.senderId, userId), eq(friendRequests.receiverId, userId)),
			),
		);

	return rows.map((row) => (row.senderId === userId ? row.receiverId : row.senderId));
}

interface ActivityEventInput {
	actorUserId: string;
	eventType: string;
	cosmeticId?: number;
	puzzleType?: string;
	scoreValue?: number;
	metadata?: string;
}

export async function recordActivityEvent(input: ActivityEventInput) {
	await db.insert(activityEvents).values({
		actorUserId: input.actorUserId,
		eventType: input.eventType,
		cosmeticId: input.cosmeticId,
		puzzleType: input.puzzleType,
		scoreValue: input.scoreValue,
		metadata: input.metadata,
	});
}

interface NotificationInput {
	userId: string;
	actorUserId?: string | null;
	type: string;
	title: string;
	message: string;
	href?: string | null;
}

export async function createNotifications(items: NotificationInput[]) {
	if (items.length === 0) {
		return;
	}

	await db.insert(notifications).values(
		items.map((item) => ({
			userId: item.userId,
			actorUserId: item.actorUserId ?? null,
			type: item.type,
			title: item.title,
			message: item.message,
			href: item.href ?? null,
		})),
	);
}
