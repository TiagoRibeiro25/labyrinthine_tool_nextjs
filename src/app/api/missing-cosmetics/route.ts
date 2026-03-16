import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { db } from "../../../db";
import { friendRequests, userCosmetics, users } from "../../../db/schema";
import { and, eq, or, inArray } from "drizzle-orm";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        const sessionUser = session?.user as { id?: string } | undefined;

        if (!session || !sessionUser || !sessionUser.id) {
            return NextResponse.json(
                { message: "Unauthorized." },
                { status: 401 },
            );
        }

        const url = new URL(req.url);
        const cosmeticIdParam = url.searchParams.get("cosmeticId");

        if (!cosmeticIdParam) {
            return NextResponse.json(
                { message: "Cosmetic ID is required." },
                { status: 400 },
            );
        }

        const cosmeticId = parseInt(cosmeticIdParam, 10);
        if (isNaN(cosmeticId)) {
            return NextResponse.json(
                { message: "Invalid Cosmetic ID." },
                { status: 400 },
            );
        }

        const userId = sessionUser.id;

        // 1. Get all accepted friends of the current user
        const friendsList = await db
            .select()
            .from(friendRequests)
            .where(
                and(
                    eq(friendRequests.status, "accepted"),
                    or(
                        eq(friendRequests.senderId, userId),
                        eq(friendRequests.receiverId, userId),
                    ),
                ),
            );

        const friendIds = friendsList.map((f) =>
            f.senderId === userId ? f.receiverId : f.senderId,
        );

        if (friendIds.length === 0) {
            return NextResponse.json([]); // No friends
        }

        // 2. Find which of these friends HAVE the cosmetic
        const friendsWithCosmetic = await db
            .select({ userId: userCosmetics.userId })
            .from(userCosmetics)
            .where(
                and(
                    eq(userCosmetics.cosmeticId, cosmeticId),
                    inArray(userCosmetics.userId, friendIds),
                ),
            );

        const friendIdsWithCosmetic = new Set(
            friendsWithCosmetic.map((f) => f.userId),
        );

        // 3. Filter out the friends who have it, leaving only those who don't
        const missingFriendIds = friendIds.filter(
            (id) => !friendIdsWithCosmetic.has(id),
        );

        if (missingFriendIds.length === 0) {
            return NextResponse.json([]); // All friends have it
        }

        // 4. Fetch the details of the friends who are missing the cosmetic
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
            { status: 500 },
        );
    }
}
