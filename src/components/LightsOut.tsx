"use client";

import { FaArrowRotateRight } from "react-icons/fa6";
import { useLightsOut } from "../hooks/useLightsOut";
import { LightsOutBoard } from "./lightsOut/LightsOutBoard";
import { LightsOutMessages } from "./lightsOut/LightsOutMessages";
import { LightsOutStats } from "./lightsOut/LightsOutStats";
import { lightsOutAnimationStyles } from "./lightsOut/lightsOutStyles";

export default function LightsOut() {
	const {
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
	} = useLightsOut();

	return (
		<div className="flex flex-col items-center justify-center p-6 bg-black/40 border border-neutral-800 rounded-lg shadow-2xl backdrop-blur-md max-w-lg w-full">
			<style>{lightsOutAnimationStyles}</style>

			<h2 className="text-2xl font-black tracking-widest text-transparent bg-clip-text bg-linear-to-b from-neutral-200 to-neutral-500 uppercase mb-6">
				Lights Out
			</h2>

			<p className="text-neutral-400 mb-6 text-center max-w-sm">
				Click a square to toggle it and its adjacent squares. Goal: Light up all squares!
			</p>

			<LightsOutStats
				moves={moves}
				visibleDurationMs={visibleDurationMs}
				bestScore={bestScore}
			/>

			<LightsOutBoard
				board={board}
				animatingCells={animatingCells}
				isWon={isWon}
				onCellClick={handleCellClick}
			/>

			<button
				onClick={startNewGame}
				className="group flex items-center justify-center gap-3 px-8 py-3 rounded-lg bg-neutral-900 text-neutral-100 font-bold text-sm uppercase tracking-widest border border-neutral-700 hover:bg-neutral-800 hover:border-neutral-400 transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.4)] hover:shadow-[0_8px_30px_rgba(255,255,255,0.1)] hover:-translate-y-1 active:translate-y-0 mb-6"
			>
				<FaArrowRotateRight className="group-hover:rotate-180 transition-transform duration-500" />
				{isWon ? "Play Again" : "Reset Puzzle"}
			</button>

			<LightsOutMessages
				isWon={isWon}
				moves={moves}
				elapsedMs={elapsedMs}
				saveState={saveState}
				signedIn={signedIn}
			/>
		</div>
	);
}
