import { formatDuration } from "../../lib/puzzles";

interface SliderPuzzleMessagesProps {
	isSolved: boolean;
	moves: number;
	elapsedMs: number;
	saveState: string;
	signedIn: boolean;
	isPlaying: boolean;
}

export function SliderPuzzleMessages({
	isSolved,
	moves,
	elapsedMs,
	saveState,
	signedIn,
	isPlaying,
}: SliderPuzzleMessagesProps) {
	return (
		<>
			{isSolved && moves > 0 && (
				<div className="mt-6 p-4 w-full bg-linear-to-r from-green-950/40 to-emerald-950/40 border border-green-900/60 rounded-lg text-center puzzle-solved backdrop-blur-sm">
					<p className="text-green-400 font-bold tracking-wide">✓ Puzzle Solved!</p>
					<p className="text-green-300/80 text-sm mt-1 font-medium">
						{moves} moves in {formatDuration(elapsedMs)}
					</p>
				</div>
			)}

			{!isSolved && saveState === "saving" && (
				<p className="mt-4 text-[10px] uppercase tracking-widest font-bold text-neutral-500">
					Saving run...
				</p>
			)}

			{isSolved && saveState === "saved" && (
				<p className="mt-4 text-[10px] uppercase tracking-widest font-bold text-emerald-500">
					Personal best saved to your profile.
				</p>
			)}

			{isSolved && saveState === "not-best" && (
				<p className="mt-4 text-[10px] uppercase tracking-widest font-bold text-neutral-500">
					Run completed, but it did not beat your personal best.
				</p>
			)}

			{isSolved && saveState === "signin" && (
				<p className="mt-4 text-[10px] uppercase tracking-widest font-bold text-amber-500">
					Sign in to save puzzle scores.
				</p>
			)}

			{isSolved && saveState === "error" && (
				<p className="mt-4 text-[10px] uppercase tracking-widest font-bold text-red-500">
					Could not save this run.
				</p>
			)}

			{!signedIn && (
				<p className="mt-2 text-[10px] uppercase tracking-widest font-bold text-neutral-600">
					Guest mode active.
				</p>
			)}

			{isPlaying && (
				<p className="mt-3 text-[11px] uppercase tracking-widest font-bold text-neutral-500 text-center">
					💡 Tip: Use arrow keys to move, or click tiles
				</p>
			)}
		</>
	);
}
