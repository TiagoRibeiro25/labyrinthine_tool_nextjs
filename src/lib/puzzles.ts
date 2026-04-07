import { PUZZLE_LABELS, type PuzzleType } from "../constants/puzzles";

export interface PuzzleScore {
	puzzleType: string;
	moves: number;
	durationMs: number;
}

export interface PuzzleScoresResponse {
	signedIn: boolean;
	bestByPuzzle: Record<string, PuzzleScore>;
}

export type PuzzleSaveState =
	| "idle"
	| "saving"
	| "saved"
	| "not-best"
	| "error"
	| "signin";

export function formatDuration(durationMs: number) {
	const totalSeconds = Math.floor(durationMs / 1000);
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function currentTimeMs() {
	return Date.now();
}

export function getPuzzleLabel(puzzleType: string) {
	if (puzzleType in PUZZLE_LABELS) {
		return PUZZLE_LABELS[puzzleType as PuzzleType];
	}
	return "Puzzle";
}

export function isBetterPuzzleScore(
	previous: { moves: number; durationMs: number } | undefined,
	current: { moves: number; durationMs: number }
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
