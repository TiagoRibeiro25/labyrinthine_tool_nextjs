import { useCallback, useEffect, useState } from "react";
import { PUZZLE_TIMER_TICK_MS, PUZZLE_TYPES } from "../constants/puzzles";
import { currentTimeMs } from "../lib/puzzles";
import {
    ANIMATION_DURATION_MS,
    checkSolved,
    getSolvedState,
    isAdjacent,
    shufflePuzzle,
} from "../lib/sliderPuzzle";
import { usePuzzleScore } from "./usePuzzleScore";

export function useSliderPuzzle() {
	const [tiles, setTiles] = useState<number[]>(getSolvedState());
	const [isSolved, setIsSolved] = useState<boolean>(true);
	const [moves, setMoves] = useState<number>(0);
	const [isPlaying, setIsPlaying] = useState<boolean>(false);
	const [startTimeMs, setStartTimeMs] = useState<number | null>(null);
	const [elapsedMs, setElapsedMs] = useState<number>(0);
	const [tickMs, setTickMs] = useState<number>(() => currentTimeMs());
	const [animatingTiles, setAnimatingTiles] = useState<Set<number>>(new Set());
	const { bestScore, signedIn, saveState, loadBestScore, saveScore, resetSaveState } =
		usePuzzleScore(PUZZLE_TYPES.SLIDER_PUZZLE);

	const checkSolvedCallback = useCallback(
		(currentTiles: number[]) => checkSolved(currentTiles),
		[]
	);

	// Load best score on mount
	useEffect(() => {
		const frameId = window.requestAnimationFrame(() => {
			loadBestScore().catch(() => {});
		});

		return () => window.cancelAnimationFrame(frameId);
	}, [loadBestScore]);

	// Update timer tick
	useEffect(() => {
		if (!isPlaying) {
			return;
		}

		const intervalId = window.setInterval(() => {
			setTickMs(currentTimeMs());
		}, PUZZLE_TIMER_TICK_MS);

		return () => {
			window.clearInterval(intervalId);
		};
	}, [isPlaying]);

	const handleShuffle = useCallback(() => {
		const newTiles = shufflePuzzle();
		setTiles(newTiles);
		setMoves(0);
		setIsSolved(false);
		setIsPlaying(true);
		setStartTimeMs(currentTimeMs());
		setElapsedMs(0);
		resetSaveState();
	}, [resetSaveState]);

	const handleTileClick = useCallback(
		(index: number) => {
			if (!isPlaying || isSolved) return;

			const emptyIndex = tiles.indexOf(0);

			if (!isAdjacent(index, emptyIndex)) return;

			const newTiles = [...tiles];
			newTiles[emptyIndex] = newTiles[index];
			newTiles[index] = 0;

			// Add animation state for visual feedback
			setAnimatingTiles(new Set([index, emptyIndex]));
			setTimeout(() => setAnimatingTiles(new Set()), ANIMATION_DURATION_MS);

			setTiles(newTiles);
			setMoves((m) => m + 1);

			if (checkSolvedCallback(newTiles)) {
				const finalMoves = moves + 1;
				const duration = startTimeMs ? currentTimeMs() - startTimeMs : 0;
				setIsSolved(true);
				setIsPlaying(false);
				setElapsedMs(duration);
				saveScore(finalMoves, duration).catch(() => {});
			}
		},
		[tiles, isPlaying, isSolved, moves, startTimeMs, checkSolvedCallback, saveScore]
	);

	// Keyboard controls
	useEffect(() => {
		if (!isPlaying || isSolved) return;

		const handleKeyPress = (e: KeyboardEvent) => {
			const emptyIndex = tiles.indexOf(0);
			const row = Math.floor(emptyIndex / 3);
			const col = emptyIndex % 3;

			let tileToMove: number | null = null;

			switch (e.key) {
				case "ArrowUp":
					if (row < 2) {
						tileToMove = emptyIndex + 3;
						e.preventDefault();
					}
					break;
				case "ArrowDown":
					if (row > 0) {
						tileToMove = emptyIndex - 3;
						e.preventDefault();
					}
					break;
				case "ArrowLeft":
					if (col < 2) {
						tileToMove = emptyIndex + 1;
						e.preventDefault();
					}
					break;
				case "ArrowRight":
					if (col > 0) {
						tileToMove = emptyIndex - 1;
						e.preventDefault();
					}
					break;
			}

			if (tileToMove !== null) {
				handleTileClick(tileToMove);
			}
		};

		window.addEventListener("keydown", handleKeyPress);
		return () => window.removeEventListener("keydown", handleKeyPress);
	}, [tiles, isPlaying, isSolved, handleTileClick]);

	const visibleDurationMs =
		isPlaying && startTimeMs ? Math.max(0, tickMs - startTimeMs) : elapsedMs;

	return {
		tiles,
		isSolved,
		moves,
		isPlaying,
		animatingTiles,
		bestScore,
		signedIn,
		saveState,
		visibleDurationMs,
		elapsedMs,
		handleTileClick,
		handleShuffle,
	};
}
