import { NextResponse } from "next/server";
import { db } from "../../../db";
import { userCosmetics, users } from "../../../db/schema";
import { eq, sql, desc } from "drizzle-orm";

export async function GET() {
    try {
        const leaderboard = await db
            .select({
                id: users.id,
                username: users.username,
                profilePictureId: users.profilePictureId,
                cosmeticsCount: sql<number>`count(${userCosmetics.cosmeticId})`.mapWith(Number),
            })
            .from(users)
            .leftJoin(userCosmetics, eq(users.id, userCosmetics.userId))
            .groupBy(users.id)
            .orderBy(desc(sql`count(${userCosmetics.cosmeticId})`))
            .limit(100);

        return NextResponse.json(leaderboard);
    } catch (error) {
        console.error("Error fetching leaderboard:", error);
        return NextResponse.json(
            { message: "An internal server error occurred." },
            { status: 500 },
        );
    }
}
