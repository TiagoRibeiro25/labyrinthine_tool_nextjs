"use client";

import { useCallback, useEffect, useState } from "react";
import { FaArrowRotateRight } from "react-icons/fa6";
import { useToast } from "../hooks/useToast";

const GRID_SIZE = 3;

interface PuzzleScore {
	puzzleType: string;
	moves: number;
	durationMs: number;
}

interface PuzzleScoresResponse {
	signedIn: boolean;
	bestByPuzzle: Record<string, PuzzleScore>;
}

function formatDuration(durationMs: number) {
	const totalSeconds = Math.floor(durationMs / 1000);
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function currentTimeMs() {
	return Date.now();
}

const toggleCells = (currentBoard: boolean[], index: number) => {
	const newBoard = [...currentBoard];
	const row = Math.floor(index / GRID_SIZE);
	const col = index % GRID_SIZE;

	// Toggle clicked cell
	newBoard[index] = !newBoard[index];

	// Toggle Top
	if (row > 0)
		newBoard[(row - 1) * GRID_SIZE + col] = !newBoard[(row - 1) * GRID_SIZE + col];
	// Toggle Bottom
	if (row < GRID_SIZE - 1)
		newBoard[(row + 1) * GRID_SIZE + col] = !newBoard[(row + 1) * GRID_SIZE + col];
	// Toggle Left
	if (col > 0)
		newBoard[row * GRID_SIZE + (col - 1)] = !newBoard[row * GRID_SIZE + (col - 1)];
	// Toggle Right
	if (col < GRID_SIZE - 1)
		newBoard[row * GRID_SIZE + (col + 1)] = !newBoard[row * GRID_SIZE + (col + 1)];

	return newBoard;
};

const generateBoard = () => {
	let newBoard = Array(GRID_SIZE * GRID_SIZE).fill(true); // Start fully lit

	// Apply random valid moves to scramble
	const numMoves = 10 + Math.floor(Math.random() * 10);
	for (let i = 0; i < numMoves; i++) {
		const randomIdx = Math.floor(Math.random() * (GRID_SIZE * GRID_SIZE));
		newBoard = toggleCells(newBoard, randomIdx);
	}

	// If it accidentally solved itself, do one more move
	if (newBoard.every((cell) => cell)) {
		newBoard = toggleCells(newBoard, Math.floor(Math.random() * (GRID_SIZE * GRID_SIZE)));
	}
	return newBoard;
};

export default function LightsOut() {
	const [board, setBoard] = useState<boolean[]>(() => generateBoard());
	const [isWon, setIsWon] = useState<boolean>(false);
	const [moves, setMoves] = useState<number>(0);
	const [startTimeMs, setStartTimeMs] = useState<number>(() => currentTimeMs());
	const [elapsedMs, setElapsedMs] = useState<number>(0);
	const [tickMs, setTickMs] = useState<number>(() => currentTimeMs());
	const [bestScore, setBestScore] = useState<PuzzleScore | null>(null);
	const [signedIn, setSignedIn] = useState<boolean>(true);
	const [saveState, setSaveState] = useState<
		"idle" | "saving" | "saved" | "error" | "signin"
	>("idle");
	const toast = useToast();

	const loadBestScore = useCallback(async () => {
		try {
			const response = await fetch("/api/puzzles/scores?puzzleType=lights-out");

			if (!response.ok) {
				return;
			}

			const payload = (await response.json()) as PuzzleScoresResponse;
			setSignedIn(payload.signedIn);

			const best = payload.bestByPuzzle?.["lights-out"];
			if (best) {
				setBestScore(best);
			}
		} catch {
			// Ignore load failures for non-essential UI.
		}
	}, []);

	const saveScore = useCallback(
		async (finalMoves: number, finalDurationMs: number) => {
			setSaveState("saving");

			try {
				const response = await fetch("/api/puzzles/scores", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						puzzleType: "lights-out",
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

				const payload = (await response.json()) as {
					personalBest: boolean;
				};

				setSaveState("saved");

				if (
					!bestScore ||
					finalMoves < bestScore.moves ||
					(finalMoves === bestScore.moves && finalDurationMs < bestScore.durationMs)
				) {
					setBestScore({
						puzzleType: "lights-out",
						moves: finalMoves,
						durationMs: finalDurationMs,
					});
				}

				if (payload.personalBest) {
					toast.success(
						"New personal best",
						`Lights Out solved in ${finalMoves} moves (${formatDuration(finalDurationMs)}).`,
					);
				}
			} catch {
				setSaveState("error");
			}
		},
		[bestScore, toast],
	);

	useEffect(() => {
		const frameId = window.requestAnimationFrame(() => {
			loadBestScore().catch(() => {});
		});

		return () => window.cancelAnimationFrame(frameId);
	}, [loadBestScore]);

	useEffect(() => {
		if (isWon) {
			return;
		}

		const intervalId = window.setInterval(() => {
			setTickMs(currentTimeMs());
		}, 250);

		return () => {
			window.clearInterval(intervalId);
		};
	}, [isWon]);

	// Initialize board with random moves to ensure solvability
	const startNewGame = useCallback(() => {
		setBoard(generateBoard());
		setMoves(0);
		setIsWon(false);
		setStartTimeMs(currentTimeMs());
		setElapsedMs(0);
		setSaveState("idle");
	}, []);

	const handleCellClick = (index: number) => {
		if (isWon) return;

		const newBoard = toggleCells(board, index);
		setBoard(newBoard);
		const finalMoves = moves + 1;
		setMoves(finalMoves);

		// Check win condition (all lights are ON)
		if (newBoard.every((cell) => cell)) {
			const duration = currentTimeMs() - startTimeMs;
			setIsWon(true);
			setElapsedMs(duration);
			saveScore(finalMoves, duration).catch(() => {});
		}
	};

	const visibleDurationMs = isWon ? elapsedMs : Math.max(0, tickMs - startTimeMs);

	return (
		<div className="flex flex-col items-center justify-center p-6 bg-black/40 border border-neutral-800 rounded-lg shadow-2xl backdrop-blur-md max-w-lg w-full">
			<h2 className="text-2xl font-black tracking-widest text-transparent bg-clip-text bg-linear-to-b from-neutral-200 to-neutral-500 uppercase mb-6">
				Lights Out
			</h2>

			<p className="text-neutral-400 mb-6 text-center max-w-sm">
				Click a square to toggle it and its adjacent squares. Goal: Light up all squares!
			</p>

			<div className="mb-6 text-neutral-300 font-mono text-lg flex justify-between w-full max-w-62.5">
				<span>
					Moves: <span className="text-white font-bold">{moves}</span>
				</span>
				<span>
					Time:{" "}
					<span className="text-white font-bold">
						{formatDuration(visibleDurationMs)}
					</span>
				</span>
			</div>

			<div className="mb-6 text-[11px] text-neutral-500 font-bold uppercase tracking-widest w-full max-w-62.5 flex justify-between">
				<span>Best</span>
				<span>{bestScore ? `${bestScore.moves} moves` : "--"}</span>
			</div>

			<div className="grid grid-cols-3 gap-2 sm:gap-3 mb-8 w-full max-w-75 aspect-square">
				{board.map((isLit, index) => (
					<button
						key={index}
						onClick={() => handleCellClick(index)}
						disabled={isWon}
						className={`w-full h-full rounded-md shadow-inner transition-all duration-300 transform active:scale-95 ${
							isLit
								? "bg-amber-300 shadow-[0_0_15px_rgba(252,211,77,0.6)] border-2 border-amber-100"
								: "bg-neutral-900 border-2 border-neutral-800 hover:bg-neutral-800"
						}`}
						aria-label={`Toggle cell ${index}`}
					/>
				))}
			</div>

			{isWon && (
				<div className="mb-6 p-4 bg-green-900/40 border border-green-500/50 rounded-md text-center animate-pulse">
					<p className="text-green-400 font-bold text-xl tracking-widest uppercase">
						Puzzle Solved!
					</p>
					<p className="text-green-300 text-xs mt-2 font-bold uppercase tracking-widest">
						{moves} moves in {formatDuration(elapsedMs)}
					</p>
				</div>
			)}

			<button
				onClick={startNewGame}
				className="group flex items-center justify-center gap-3 px-8 py-3 rounded-sm bg-neutral-900 text-neutral-100 font-bold text-sm uppercase tracking-widest border border-neutral-700 hover:bg-neutral-800 hover:border-neutral-400 transition-all duration-300 shadow-[0_0_15px_rgba(255,255,255,0.05)] hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:-translate-y-1 active:translate-y-0"
			>
				<FaArrowRotateRight className="group-hover:rotate-180 transition-transform duration-500" />
				{isWon ? "Play Again" : "Reset Puzzle"}
			</button>

			{isWon && saveState === "saved" && (
				<p className="mt-4 text-[10px] uppercase tracking-widest font-bold text-emerald-500">
					Score saved to your profile.
				</p>
			)}

			{isWon && saveState === "signin" && (
				<p className="mt-4 text-[10px] uppercase tracking-widest font-bold text-amber-500">
					Sign in to save puzzle scores.
				</p>
			)}

			{isWon && saveState === "error" && (
				<p className="mt-4 text-[10px] uppercase tracking-widest font-bold text-red-500">
					Could not save this run.
				</p>
			)}

			{!signedIn && (
				<p className="mt-2 text-[10px] uppercase tracking-widest font-bold text-neutral-600">
					Guest mode active.
				</p>
			)}
		</div>
	);
}
