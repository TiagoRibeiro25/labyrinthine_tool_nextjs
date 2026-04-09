import { formatDuration } from "../../lib/puzzles";

interface LightsOutMessagesProps {
	isWon: boolean;
	moves: number;
	elapsedMs: number;
	saveState: string;
	signedIn: boolean;
}

export function LightsOutMessages({
	isWon,
	moves,
	elapsedMs,
	saveState,
	signedIn,
}: LightsOutMessagesProps) {
	return (
		<>
			{isWon && (
				<div className="mb-6 p-4 bg-linear-to-r from-green-950/50 to-emerald-950/50 border border-green-500/60 rounded-lg text-center win-message backdrop-blur-sm">
					<p className="text-green-400 font-bold text-xl tracking-widest uppercase">
						✓ All Lights On!
					</p>
					<p className="text-green-300 text-xs mt-2 font-bold uppercase tracking-widest">
						{moves} moves in {formatDuration(elapsedMs)}
					</p>
				</div>
			)}

			{isWon && saveState === "saved" && (
				<p className="mt-4 text-[10px] uppercase tracking-widest font-bold text-emerald-500">
					Personal best saved to your profile.
				</p>
			)}

			{isWon && saveState === "not-best" && (
				<p className="mt-4 text-[10px] uppercase tracking-widest font-bold text-neutral-500">
					Run completed, but it did not beat your personal best.
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
		</>
	);
}
