import { formatDuration } from "../../lib/puzzles";

interface SliderPuzzleStatsProps {
	moves: number;
	isSolved: boolean;
	isPlaying: boolean;
	visibleDurationMs: number;
	bestScore: { moves: number } | null;
}

export function SliderPuzzleStats({
	moves,
	isSolved,
	isPlaying,
	visibleDurationMs,
	bestScore,
}: SliderPuzzleStatsProps) {
	return (
		<>
			<div className="flex justify-between w-full mb-4 px-2 text-neutral-400 font-mono text-sm tracking-wider">
				<span>MOVES: {moves}</span>
				<span>
					{isSolved && moves > 0 ? "SOLVED!" : isPlaying ? "PLAYING" : "WAITING"}
				</span>
			</div>

			<div className="w-full mb-4 px-2 flex items-center justify-between text-xs text-neutral-500 font-bold uppercase tracking-widest">
				<span>Time: {formatDuration(visibleDurationMs)}</span>
				<span>Best: {bestScore ? `${bestScore.moves} moves` : "--"}</span>
			</div>
		</>
	);
}
