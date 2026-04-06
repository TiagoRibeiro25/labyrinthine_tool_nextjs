import { desc, eq, inArray } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { db } from "../../../db";
import { activityEvents, users } from "../../../db/schema";
import { authOptions } from "../../../lib/auth";
import { getCosmeticById } from "../../../lib/cosmetics";
import { getAcceptedFriendIds } from "../../../lib/social";
import {
    activityFeedQuerySchema,
    getFirstZodErrorMessage,
} from "../../../lib/validation";

function getEventSummary(event: {
	eventType: string;
	cosmeticId: number | null;
	puzzleType: string | null;
	scoreValue: number | null;
	metadata: string | null;
}) {
	switch (event.eventType) {
		case "cosmetic_unlocked": {
			const cosmeticName = event.cosmeticId
				? getCosmeticById(event.cosmeticId)?.name
				: null;
			return {
				title: "Unlocked a cosmetic",
				description: cosmeticName
					? `Unlocked ${cosmeticName}.`
					: "Unlocked a cosmetic item.",
			};
		}
		case "cosmetic_bulk_unlocked":
			return {
				title: "Bulk unlock completed",
				description: event.scoreValue
					? `Unlocked ${event.scoreValue} cosmetics at once.`
					: "Unlocked multiple cosmetics.",
			};
		case "puzzle_completed": {
			const puzzleLabel =
				event.puzzleType === "lights-out"
					? "Lights Out"
					: event.puzzleType === "slider-puzzle"
						? "Slider Puzzle"
						: "Puzzle";
			return {
				title: "Puzzle completed",
				description: event.scoreValue
					? `Finished ${puzzleLabel} in ${event.scoreValue} moves.`
					: `Finished ${puzzleLabel}.`,
			};
		}
		default:
			return {
				title: "Activity update",
				description: event.metadata || "A new activity was recorded.",
			};
	}
}

export async function GET(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		const sessionUser = session?.user as { id?: string } | undefined;

		if (!sessionUser?.id) {
			return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
		}

		const url = new URL(req.url);
		const parsed = activityFeedQuerySchema.safeParse({
			limit: url.searchParams.get("limit") ?? undefined,
		});

		if (!parsed.success) {
			return NextResponse.json(
				{ message: getFirstZodErrorMessage(parsed.error) },
				{ status: 400 },
			);
		}

		const { limit } = parsed.data;
		const friendIds = await getAcceptedFriendIds(sessionUser.id);

		if (friendIds.length === 0) {
			return NextResponse.json({ data: [] }, { status: 200 });
		}

		const rows = await db
			.select({
				id: activityEvents.id,
				actorUserId: activityEvents.actorUserId,
				actorUsername: users.username,
				actorProfilePictureId: users.profilePictureId,
				eventType: activityEvents.eventType,
				cosmeticId: activityEvents.cosmeticId,
				puzzleType: activityEvents.puzzleType,
				scoreValue: activityEvents.scoreValue,
				metadata: activityEvents.metadata,
				createdAt: activityEvents.createdAt,
			})
			.from(activityEvents)
			.innerJoin(users, eq(users.id, activityEvents.actorUserId))
			.where(inArray(activityEvents.actorUserId, friendIds))
			.orderBy(desc(activityEvents.createdAt))
			.limit(limit);

		return NextResponse.json(
			{
				data: rows.map((row) => ({
					id: row.id,
					actor: {
						id: row.actorUserId,
						username: row.actorUsername,
						profilePictureId: row.actorProfilePictureId,
					},
					eventType: row.eventType,
					cosmeticId: row.cosmeticId,
					puzzleType: row.puzzleType,
					scoreValue: row.scoreValue,
					metadata: row.metadata,
					createdAt: row.createdAt,
					...getEventSummary(row),
				})),
			},
			{ status: 200 },
		);
	} catch (error) {
		console.error("Error fetching activity feed:", error);
		return NextResponse.json(
			{ message: "An internal server error occurred." },
			{ status: 500 },
		);
	}
}
