import { and, asc, desc, eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { db } from "../../../../db";
import { puzzleScores } from "../../../../db/schema";
import { authOptions } from "../../../../lib/auth";
import { createNotifications, recordActivityEvent } from "../../../../lib/social";
import {
    getFirstZodErrorMessage,
    puzzleScoreBodySchema,
    puzzleScoreQuerySchema,
} from "../../../../lib/validation";

function puzzleLabel(puzzleType: string) {
	return puzzleType === "lights-out" ? "Lights Out" : "Slider Puzzle";
}

function isBetterScore(
	previous: { moves: number; durationMs: number } | undefined,
	current: { moves: number; durationMs: number },
) {
	if (!previous) {
		return true;
	}

	if (current.moves < previous.moves) {
		return true;
	}

	if (current.moves === previous.moves && current.durationMs < previous.durationMs) {
		return true;
	}

	return false;
}

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
				{ status: 200 },
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
				{ status: 400 },
			);
		}

		const selectedPuzzle = parsed.data.puzzleType;
		const puzzleTypes = selectedPuzzle
			? [selectedPuzzle]
			: (["lights-out", "slider-puzzle"] as const);

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
						and(eq(puzzleScores.userId, userId), eq(puzzleScores.puzzleType, puzzleType)),
					)
					.orderBy(
						asc(puzzleScores.moves),
						asc(puzzleScores.durationMs),
						desc(puzzleScores.createdAt),
					)
					.limit(1);

				return rows[0] ?? null;
			}),
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
							eq(puzzleScores.puzzleType, selectedPuzzle),
						)
					: eq(puzzleScores.userId, userId),
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
			{ status: 200 },
		);
	} catch (error) {
		console.error("Error fetching puzzle scores:", error);
		return NextResponse.json(
			{ message: "An internal server error occurred." },
			{ status: 500 },
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
				{ status: 400 },
			);
		}

		const { puzzleType, moves, durationMs } = parsed.data;

		const previousBestRows = await db
			.select({ moves: puzzleScores.moves, durationMs: puzzleScores.durationMs })
			.from(puzzleScores)
			.where(
				and(eq(puzzleScores.userId, userId), eq(puzzleScores.puzzleType, puzzleType)),
			)
			.orderBy(asc(puzzleScores.moves), asc(puzzleScores.durationMs))
			.limit(1);

		const previousBest = previousBestRows[0];
		const personalBest = isBetterScore(previousBest, { moves, durationMs });

		await db.insert(puzzleScores).values({
			userId,
			puzzleType,
			moves,
			durationMs,
		});

		if (personalBest) {
			await recordActivityEvent({
				actorUserId: userId,
				eventType: "puzzle_completed",
				puzzleType,
				scoreValue: moves,
				metadata: `${puzzleLabel(puzzleType)} personal best: ${moves} moves in ${Math.round(durationMs / 1000)}s.`,
			});

			await createNotifications([
				{
					userId,
					actorUserId: userId,
					type: "puzzle_personal_best",
					title: `New ${puzzleLabel(puzzleType)} personal best`,
					message: `${moves} moves in ${Math.round(durationMs / 1000)}s.`,
					href: `/puzzles/${puzzleType}`,
				},
			]);
		}

		return NextResponse.json(
			{
				message: "Puzzle score saved.",
				personalBest,
			},
			{ status: 201 },
		);
	} catch (error) {
		console.error("Error saving puzzle score:", error);
		return NextResponse.json(
			{ message: "An internal server error occurred." },
			{ status: 500 },
		);
	}
}
