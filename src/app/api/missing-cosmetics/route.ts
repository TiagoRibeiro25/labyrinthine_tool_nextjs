import { and, eq, inArray, or } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { db } from "../../../db";
import { friendRequests, userCosmetics, users } from "../../../db/schema";
import { authOptions } from "../../../lib/auth";
import {
	getFirstZodErrorMessage,
	missingCosmeticsQuerySchema,
} from "../../../lib/validation";

export async function GET(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		const sessionUser = session?.user as { id?: string } | undefined;

		if (!session || !sessionUser || !sessionUser.id) {
			return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
		}

		const url = new URL(req.url);
		const parsedQuery = missingCosmeticsQuerySchema.safeParse({
			cosmeticId: url.searchParams.get("cosmeticId"),
		});

		if (!parsedQuery.success) {
			return NextResponse.json(
				{ message: getFirstZodErrorMessage(parsedQuery.error) },
				{ status: 400 }
			);
		}

		const cosmeticId = parsedQuery.data.cosmeticId;
		const userId = sessionUser.id;

		// Get all accepted friends of the current user
		const friendsList = await db
			.select()
			.from(friendRequests)
			.where(
				and(
					eq(friendRequests.status, "accepted"),
					or(eq(friendRequests.senderId, userId), eq(friendRequests.receiverId, userId))
				)
			);

		const friendIds = friendsList.map((f) =>
			f.senderId === userId ? f.receiverId : f.senderId
		);

		if (friendIds.length === 0) {
			return NextResponse.json([]); // No friends
		}

		// Find which of these friends HAVE the cosmetic
		const friendsWithCosmetic = await db
			.select({ userId: userCosmetics.userId })
			.from(userCosmetics)
			.where(
				and(
					eq(userCosmetics.cosmeticId, cosmeticId),
					inArray(userCosmetics.userId, friendIds)
				)
			);

		const friendIdsWithCosmetic = new Set(friendsWithCosmetic.map((f) => f.userId));

		// Filter out the friends who have it, leaving only those who don't
		const missingFriendIds = friendIds.filter((id) => !friendIdsWithCosmetic.has(id));

		if (missingFriendIds.length === 0) {
			return NextResponse.json([]); // All friends have it
		}

		// Fetch the details of the friends who are missing the cosmetic
		const missingFriends = await db
			.select({
				id: users.id,
				username: users.username,
				profilePictureId: users.profilePictureId,
			})
			.from(users)
			.where(inArray(users.id, missingFriendIds));

		return NextResponse.json(missingFriends);
	} catch (error) {
		console.error("Error fetching missing cosmetics for friends:", error);
		return NextResponse.json(
			{ message: "An internal server error occurred." },
			{ status: 500 }
		);
	}
}
