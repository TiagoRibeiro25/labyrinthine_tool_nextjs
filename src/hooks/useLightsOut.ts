import { useCallback, useEffect, useState } from "react";
import {
	LIGHTS_OUT_ANIMATION_DURATION_MS,
	LIGHTS_OUT_GRID_SIZE,
} from "../constants/lights-out";
import { PUZZLE_TIMER_TICK_MS, PUZZLE_TYPES } from "../constants/puzzles";
import { generateBoard, isSolved, toggleCells } from "../lib/lightsOut";
import { currentTimeMs } from "../lib/puzzles";
import { usePuzzleScore } from "./usePuzzleScore";

export function useLightsOut() {
	const [board, setBoard] = useState<boolean[]>(() => generateBoard());
	const [isWon, setIsWon] = useState<boolean>(false);
	const [moves, setMoves] = useState<number>(0);
	const [startTimeMs, setStartTimeMs] = useState<number>(() => currentTimeMs());
	const [elapsedMs, setElapsedMs] = useState<number>(0);
	const [tickMs, setTickMs] = useState<number>(() => currentTimeMs());
	const [animatingCells, setAnimatingCells] = useState<Set<number>>(new Set());
	const { bestScore, signedIn, saveState, loadBestScore, saveScore, resetSaveState } =
		usePuzzleScore(PUZZLE_TYPES.LIGHTS_OUT);

	// Load best score on mount
	useEffect(() => {
		const frameId = window.requestAnimationFrame(() => {
			loadBestScore().catch(() => {});
		});

		return () => window.cancelAnimationFrame(frameId);
	}, [loadBestScore]);

	// Update timer tick
	useEffect(() => {
		if (isWon) {
			return;
		}

		const intervalId = window.setInterval(() => {
			setTickMs(currentTimeMs());
		}, PUZZLE_TIMER_TICK_MS);

		return () => {
			window.clearInterval(intervalId);
		};
	}, [isWon]);

	const startNewGame = useCallback(() => {
		setBoard(generateBoard());
		setMoves(0);
		setIsWon(false);
		setStartTimeMs(currentTimeMs());
		setElapsedMs(0);
		resetSaveState();
	}, [resetSaveState]);

	const handleCellClick = useCallback(
		(index: number) => {
			if (isWon) return;

			const newBoard = toggleCells(board, index);
			setBoard(newBoard);
			const finalMoves = moves + 1;
			setMoves(finalMoves);

			// Add animation for affected cells
			const row = Math.floor(index / LIGHTS_OUT_GRID_SIZE);
			const col = index % LIGHTS_OUT_GRID_SIZE;
			const affectedIndices = new Set<number>([index]);

			if (row > 0) {
				affectedIndices.add((row - 1) * LIGHTS_OUT_GRID_SIZE + col);
			}
			if (row < LIGHTS_OUT_GRID_SIZE - 1) {
				affectedIndices.add((row + 1) * LIGHTS_OUT_GRID_SIZE + col);
			}
			if (col > 0) {
				affectedIndices.add(row * LIGHTS_OUT_GRID_SIZE + (col - 1));
			}
			if (col < LIGHTS_OUT_GRID_SIZE - 1) {
				affectedIndices.add(row * LIGHTS_OUT_GRID_SIZE + (col + 1));
			}

			setAnimatingCells(affectedIndices);
			setTimeout(() => setAnimatingCells(new Set()), LIGHTS_OUT_ANIMATION_DURATION_MS);

			// Check win condition (all lights are ON)
			if (isSolved(newBoard)) {
				const duration = currentTimeMs() - startTimeMs;
				setIsWon(true);
				setElapsedMs(duration);
				saveScore(finalMoves, duration).catch(() => {});
			}
		},
		[board, isWon, moves, startTimeMs, saveScore]
	);

	const visibleDurationMs = isWon ? elapsedMs : Math.max(0, tickMs - startTimeMs);

	return {
		board,
		isWon,
		moves,
		animatingCells,
		bestScore,
		signedIn,
		saveState,
		visibleDurationMs,
		elapsedMs,
		handleCellClick,
		startNewGame,
	};
}
