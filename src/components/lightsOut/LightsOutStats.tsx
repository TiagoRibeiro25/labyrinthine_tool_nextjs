import { formatDuration } from "../../lib/puzzles";

interface LightsOutStatsProps {
	moves: number;
	visibleDurationMs: number;
	bestScore: { moves: number } | null;
}

export function LightsOutStats({
	moves,
	visibleDurationMs,
	bestScore,
}: LightsOutStatsProps) {
	return (
		<>
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
		</>
	);
}
