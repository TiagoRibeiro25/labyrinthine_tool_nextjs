"use client";

import { useCallback, useState } from "react";
import { PUZZLE_SCORE_API_PATH, type PuzzleType } from "../constants/puzzles";
import {
	formatDuration,
	getPuzzleLabel,
	type PuzzleSaveState,
	type PuzzleScore,
	type PuzzleScoresResponse,
} from "../lib/puzzles";
import { useToast } from "./useToast";

interface SavePuzzleScoreResponse {
	personalBest: boolean;
	saved?: boolean;
}

export function usePuzzleScore(puzzleType: PuzzleType) {
	const [bestScore, setBestScore] = useState<PuzzleScore | null>(null);
	const [signedIn, setSignedIn] = useState<boolean>(true);
	const [saveState, setSaveState] = useState<PuzzleSaveState>("idle");
	const toast = useToast();

	const loadBestScore = useCallback(async () => {
		try {
			const response = await fetch(`${PUZZLE_SCORE_API_PATH}?puzzleType=${puzzleType}`);

			if (!response.ok) {
				return;
			}

			const payload = (await response.json()) as PuzzleScoresResponse;
			setSignedIn(payload.signedIn);

			const best = payload.bestByPuzzle?.[puzzleType];
			if (best) {
				setBestScore(best);
			}
		} catch {
			// Ignore load failures for non-essential UI.
		}
	}, [puzzleType]);

	const saveScore = useCallback(
		async (finalMoves: number, finalDurationMs: number) => {
			setSaveState("saving");

			try {
				const response = await fetch(PUZZLE_SCORE_API_PATH, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						puzzleType,
						moves: finalMoves,
						durationMs: finalDurationMs,
					}),
				});

				if (response.status === 401) {
					setSignedIn(false);
					setSaveState("signin");
					return;
				}

				if (!response.ok) {
					setSaveState("error");
					return;
				}

				const payload = (await response.json()) as SavePuzzleScoreResponse;

				if (payload.personalBest) {
					setSaveState("saved");
					setBestScore({
						puzzleType,
						moves: finalMoves,
						durationMs: finalDurationMs,
					});
					toast.success(
						"New personal best",
						`${getPuzzleLabel(puzzleType)} solved in ${finalMoves} moves (${formatDuration(finalDurationMs)}).`
					);
					return;
				}

				setSaveState("not-best");
			} catch {
				setSaveState("error");
			}
		},
		[puzzleType, toast]
	);

	const resetSaveState = useCallback(() => {
		setSaveState("idle");
	}, []);

	return {
		bestScore,
		signedIn,
		saveState,
		loadBestScore,
		saveScore,
		resetSaveState,
	};
}
