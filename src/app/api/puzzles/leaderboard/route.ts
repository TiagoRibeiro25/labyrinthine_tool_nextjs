import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "../../../../db";
import {
	getFirstZodErrorMessage,
	puzzleLeaderboardQuerySchema,
} from "../../../../lib/validation";

type LeaderboardRow = {
	id: string;
	username: string;
	profilePictureId: string | null;
	steamAvatarUrl: string | null;
	useSteamAvatar: boolean;
	discordAvatarUrl: string | null;
	useDiscordAvatar: boolean;
	moves: number;
	durationMs: number;
	rank: number;
};

export async function GET(req: Request) {
	try {
		const url = new URL(req.url);
		const parsedQuery = puzzleLeaderboardQuerySchema.safeParse({
			puzzleType: url.searchParams.get("puzzleType") ?? undefined,
			page: url.searchParams.get("page") ?? undefined,
			limit: url.searchParams.get("limit") ?? undefined,
		});

		if (!parsedQuery.success) {
			return NextResponse.json(
				{ message: getFirstZodErrorMessage(parsedQuery.error) },
				{ status: 400 }
			);
		}

		const { puzzleType, page, limit } = parsedQuery.data;

		const totalResult = await db.execute(sql<{ count: number }>`
			select count(*)::int as count
			from (
				select distinct user_id
				from puzzle_scores
				where puzzle_type = ${puzzleType}
			) as participants
		`);

		const totalItems = Number(totalResult[0]?.count ?? 0);
		const totalPages = Math.max(1, Math.ceil(totalItems / limit));
		const safePage = Math.min(page, totalPages);
		const offset = (safePage - 1) * limit;

		const rows = await db.execute<LeaderboardRow>(sql`
			with ranked as (
				select
					ps.user_id,
					ps.moves,
					ps.duration_ms,
					ps.created_at,
					row_number() over (
						partition by ps.user_id
						order by ps.duration_ms asc, ps.moves asc, ps.created_at asc
					) as rn
				from puzzle_scores ps
				where ps.puzzle_type = ${puzzleType}
			)
			select
				u.id,
				u.username,
				u.profile_picture_id as "profilePictureId",
				u.steam_avatar_url as "steamAvatarUrl",
				u.use_steam_avatar as "useSteamAvatar",
				u.discord_avatar_url as "discordAvatarUrl",
				u.use_discord_avatar as "useDiscordAvatar",
				r.moves,
				r.duration_ms as "durationMs",
				row_number() over (order by r.duration_ms asc, r.moves asc, u.username asc)::int as rank
			from ranked r
			inner join users u on u.id = r.user_id
			where r.rn = 1
			order by r.duration_ms asc, r.moves asc, u.username asc
			limit ${limit}
			offset ${offset}
		`);

		return NextResponse.json({
			data: rows.map((row) => ({
				id: row.id,
				username: row.username,
				profilePictureId: row.profilePictureId,
				steamAvatarUrl: row.steamAvatarUrl,
				useSteamAvatar: row.useSteamAvatar,
				discordAvatarUrl: row.discordAvatarUrl,
				useDiscordAvatar: row.useDiscordAvatar,
				moves: Number(row.moves),
				durationMs: Number(row.durationMs),
				rank: Number(row.rank),
			})),
			pagination: {
				page: safePage,
				limit,
				totalItems,
				totalPages,
				hasNextPage: safePage < totalPages,
				hasPreviousPage: safePage > 1,
			},
			puzzleType,
		});
	} catch (error) {
		console.error("Error fetching puzzle leaderboard:", error);
		return NextResponse.json(
			{ message: "An internal server error occurred." },
			{ status: 500 }
		);
	}
}
