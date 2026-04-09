"use client";

import { useSliderPuzzle } from "../hooks/useSliderPuzzle";
import { SliderPuzzleGrid } from "./sliderPuzzle/SliderPuzzleGrid";
import { SliderPuzzleMessages } from "./sliderPuzzle/SliderPuzzleMessages";
import { SliderPuzzleStats } from "./sliderPuzzle/SliderPuzzleStats";
import { sliderPuzzleAnimationStyles } from "./sliderPuzzle/sliderPuzzleStyles";

export default function SliderPuzzle() {
	const {
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
	} = useSliderPuzzle();

	return (
		<div className="flex flex-col items-center p-6 bg-black/60 border border-neutral-800 rounded-sm shadow-[0_0_20px_rgba(0,0,0,0.8)] backdrop-blur-md max-w-md w-full mx-auto">
			<style>{sliderPuzzleAnimationStyles}</style>

			<h2
				className={`text-2xl font-black tracking-widest text-transparent bg-clip-text bg-linear-to-b from-neutral-200 to-neutral-500 uppercase mb-6 ${isSolved ? "puzzle-title-glow" : ""}`}
			>
				Slider Puzzle
			</h2>

			<SliderPuzzleStats
				moves={moves}
				isSolved={isSolved}
				isPlaying={isPlaying}
				visibleDurationMs={visibleDurationMs}
				bestScore={bestScore}
			/>

			<SliderPuzzleGrid
				tiles={tiles}
				animatingTiles={animatingTiles}
				isPlaying={isPlaying}
				isSolved={isSolved}
				onTileClick={handleTileClick}
			/>

			<button
				onClick={handleShuffle}
				className="mt-8 px-8 py-3 w-full rounded-lg bg-linear-to-b from-neutral-800 to-neutral-900 text-neutral-100 font-bold uppercase tracking-widest border border-neutral-700 hover:border-neutral-500 hover:from-neutral-700 hover:to-neutral-800 transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.4)] hover:shadow-[0_8px_30px_rgba(255,255,255,0.1)] active:scale-95"
			>
				{isPlaying ? "Restart Puzzle" : "Start Practice"}
			</button>

			<SliderPuzzleMessages
				isSolved={isSolved}
				moves={moves}
				elapsedMs={elapsedMs}
				saveState={saveState}
				signedIn={signedIn}
				isPlaying={isPlaying}
			/>
		</div>
	);
}
