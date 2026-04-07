import { and, asc, desc, eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { PUZZLE_TYPE_VALUES } from "../../../../constants/puzzles";
import { db } from "../../../../db";
import { puzzleScores } from "../../../../db/schema";
import { authOptions } from "../../../../lib/auth";
import { getPuzzleLabel, isBetterPuzzleScore } from "../../../../lib/puzzles";
import { createNotifications, recordActivityEvent } from "../../../../lib/social";
import {
	getFirstZodErrorMessage,
	puzzleScoreBodySchema,
	puzzleScoreQuerySchema,
} from "../../../../lib/validation";

export async function GET(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		const sessionUser = session?.user as { id?: string } | undefined;

		if (!sessionUser?.id) {
			return NextResponse.json(
				{
					signedIn: false,
					bestByPuzzle: {},
					recentScores: [],
				},
				{ status: 200 }
			);
		}

		const userId = sessionUser.id;

		const url = new URL(req.url);
		const parsed = puzzleScoreQuerySchema.safeParse({
			puzzleType: url.searchParams.get("puzzleType") ?? undefined,
		});

		if (!parsed.success) {
			return NextResponse.json(
				{ message: getFirstZodErrorMessage(parsed.error) },
				{ status: 400 }
			);
		}

		const selectedPuzzle = parsed.data.puzzleType;
		const puzzleTypes = selectedPuzzle ? [selectedPuzzle] : PUZZLE_TYPE_VALUES;

		const bestEntries = await Promise.all(
			puzzleTypes.map(async (puzzleType) => {
				const rows = await db
					.select({
						id: puzzleScores.id,
						puzzleType: puzzleScores.puzzleType,
						moves: puzzleScores.moves,
						durationMs: puzzleScores.durationMs,
						createdAt: puzzleScores.createdAt,
					})
					.from(puzzleScores)
					.where(
						and(eq(puzzleScores.userId, userId), eq(puzzleScores.puzzleType, puzzleType))
					)
					.orderBy(
						asc(puzzleScores.moves),
						asc(puzzleScores.durationMs),
						desc(puzzleScores.createdAt)
					)
					.limit(1);

				return rows[0] ?? null;
			})
		);

		const recentScores = await db
			.select({
				id: puzzleScores.id,
				puzzleType: puzzleScores.puzzleType,
				moves: puzzleScores.moves,
				durationMs: puzzleScores.durationMs,
				createdAt: puzzleScores.createdAt,
			})
			.from(puzzleScores)
			.where(
				selectedPuzzle
					? and(
							eq(puzzleScores.userId, userId),
							eq(puzzleScores.puzzleType, selectedPuzzle)
						)
					: eq(puzzleScores.userId, userId)
			)
			.orderBy(desc(puzzleScores.createdAt))
			.limit(10);

		return NextResponse.json(
			{
				signedIn: true,
				bestByPuzzle: bestEntries.reduce<Record<string, unknown>>((acc, item) => {
					if (item) {
						acc[item.puzzleType] = item;
					}
					return acc;
				}, {}),
				recentScores,
			},
			{ status: 200 }
		);
	} catch (error) {
		console.error("Error fetching puzzle scores:", error);
		return NextResponse.json(
			{ message: "An internal server error occurred." },
			{ status: 500 }
		);
	}
}

export async function POST(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		const sessionUser = session?.user as
			| { id?: string; name?: string | null }
			| undefined;

		if (!sessionUser?.id) {
			return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
		}

		const userId = sessionUser.id;

		let body: unknown;
		try {
			body = await req.json();
		} catch {
			return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
		}

		const parsed = puzzleScoreBodySchema.safeParse(body);

		if (!parsed.success) {
			return NextResponse.json(
				{ message: getFirstZodErrorMessage(parsed.error) },
				{ status: 400 }
			);
		}

		const { puzzleType, moves, durationMs } = parsed.data;

		const previousBestRows = await db
			.select({ moves: puzzleScores.moves, durationMs: puzzleScores.durationMs })
			.from(puzzleScores)
			.where(
				and(eq(puzzleScores.userId, userId), eq(puzzleScores.puzzleType, puzzleType))
			)
			.orderBy(asc(puzzleScores.moves), asc(puzzleScores.durationMs))
			.limit(1);

		const previousBest = previousBestRows[0];
		const personalBest = isBetterPuzzleScore(previousBest, { moves, durationMs });

		if (!personalBest) {
			return NextResponse.json(
				{
					message: "Run completed, but it did not beat your personal best.",
					personalBest: false,
					saved: false,
				},
				{ status: 200 }
			);
		}

		await db.insert(puzzleScores).values({
			userId,
			puzzleType,
			moves,
			durationMs,
		});

		await recordActivityEvent({
			actorUserId: userId,
			eventType: "puzzle_completed",
			puzzleType,
			scoreValue: moves,
			metadata: `${getPuzzleLabel(puzzleType)} personal best: ${moves} moves in ${Math.round(durationMs / 1000)}s.`,
		});

		await createNotifications([
			{
				userId,
				actorUserId: userId,
				type: "puzzle_personal_best",
				title: `New ${getPuzzleLabel(puzzleType)} personal best`,
				message: `${moves} moves in ${Math.round(durationMs / 1000)}s.`,
				href: `/puzzles/${puzzleType}`,
			},
		]);

		return NextResponse.json(
			{
				message: "Puzzle personal best saved.",
				personalBest: true,
				saved: true,
			},
			{ status: 201 }
		);
	} catch (error) {
		console.error("Error saving puzzle score:", error);
		return NextResponse.json(
			{ message: "An internal server error occurred." },
			{ status: 500 }
		);
	}
}
