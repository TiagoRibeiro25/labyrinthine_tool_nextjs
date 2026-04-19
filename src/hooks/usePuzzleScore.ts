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
import { ApiError, useApi } from "./useApi";
import { useToast } from "./useToast";

interface SavePuzzleScoreResponse {
	personalBest: boolean;
	saved?: boolean;
}

export function usePuzzleScore(puzzleType: PuzzleType) {
	const [bestScore, setBestScore] = useState<PuzzleScore | null>(null);
	const [signedIn, setSignedIn] = useState<boolean>(true);
	const [saveState, setSaveState] = useState<PuzzleSaveState>("idle");
	const { execute: executeLoad } = useApi<PuzzleScoresResponse>();
	const { execute: executeSave } = useApi<SavePuzzleScoreResponse>();
	const toast = useToast();

	const loadBestScore = useCallback(async () => {
		try {
			const payload = await executeLoad(
				`${PUZZLE_SCORE_API_PATH}?puzzleType=${puzzleType}`
			);
			if (!payload) {
				return;
			}
			setSignedIn(payload.signedIn);

			const best = payload.bestByPuzzle?.[puzzleType];
			if (best) {
				setBestScore(best);
			}
		} catch {
			// Ignore load failures for non-essential UI.
		}
	}, [executeLoad, puzzleType]);

	const saveScore = useCallback(
		async (finalMoves: number, finalDurationMs: number) => {
			setSaveState("saving");

			try {
				const payload = await executeSave(PUZZLE_SCORE_API_PATH, {
					method: "POST",
					body: JSON.stringify({
						puzzleType,
						moves: finalMoves,
						durationMs: finalDurationMs,
					}),
				});

				if (!payload) {
					setSaveState("error");
					return;
				}

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
			} catch (error) {
				if (error instanceof ApiError && error.status === 401) {
					setSignedIn(false);
					setSaveState("signin");
					return;
				}

				setSaveState("error");
			}
		},
		[executeSave, puzzleType, toast]
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
