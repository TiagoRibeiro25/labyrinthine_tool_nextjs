import { desc, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "../../../db";
import { userCosmetics, users } from "../../../db/schema";
import {
	getFirstZodErrorMessage,
	leaderboardPaginationQuerySchema,
} from "../../../lib/validation";

export async function GET(req: Request) {
	try {
		const { searchParams } = new URL(req.url);

		const parsedQuery = leaderboardPaginationQuerySchema.safeParse({
			page: searchParams.get("page") ?? undefined,
			limit: searchParams.get("limit") ?? undefined,
		});

		if (!parsedQuery.success) {
			return NextResponse.json(
				{ message: getFirstZodErrorMessage(parsedQuery.error) },
				{ status: 400 }
			);
		}

		const { page, limit } = parsedQuery.data;

		const totalUsersResult = await db
			.select({
				count: sql<number>`count(*)`.mapWith(Number),
			})
			.from(users);

		const totalItems = totalUsersResult[0]?.count ?? 0;
		const totalPages = Math.max(1, Math.ceil(totalItems / limit));
		const safePage = Math.min(page, totalPages);
		const offset = (safePage - 1) * limit;

		const cosmeticsCountExpr = sql<number>`count(${userCosmetics.cosmeticId})`;

		const leaderboard = await db
			.select({
				id: users.id,
				username: users.username,
				profilePictureId: users.profilePictureId,
				discordAvatarUrl: users.discordAvatarUrl,
				useDiscordAvatar: users.useDiscordAvatar,
				cosmeticsCount: cosmeticsCountExpr.mapWith(Number),
			})
			.from(users)
			.leftJoin(userCosmetics, eq(users.id, userCosmetics.userId))
			.groupBy(users.id)
			.orderBy(desc(cosmeticsCountExpr), users.username)
			.limit(limit)
			.offset(offset);

		return NextResponse.json({
			data: leaderboard,
			pagination: {
				page: safePage,
				limit,
				totalItems,
				totalPages,
				hasNextPage: safePage < totalPages,
				hasPreviousPage: safePage > 1,
			},
		});
	} catch (error) {
		console.error("Error fetching leaderboard:", error);
		return NextResponse.json(
			{ message: "An internal server error occurred." },
			{ status: 500 }
		);
	}
}
