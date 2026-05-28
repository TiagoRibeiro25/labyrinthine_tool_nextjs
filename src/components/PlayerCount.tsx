import { LABYRINTHINE_STEAM_STORE_URL } from "@/constants/steam";
import {
	getPlayerActivityLevel,
	getSteamCurrentPlayerCount,
} from "@/lib/steam-player-count";
import { FaArrowUpRightFromSquare, FaSteam, FaUsers } from "react-icons/fa6";
import type { ActivityTier } from "@/lib/steam-player-count";

const tierAccent: Record<ActivityTier, string> = {
	peak: "text-emerald-300",
	busy: "text-[#8fd4ff]",
	steady: "text-neutral-200",
	quiet: "text-neutral-400",
};

function PlayerCountUnavailable() {
	return (
		<div className="rounded-2xl border border-neutral-800/60 bg-black/25 p-5 backdrop-blur-sm">
			<div className="flex items-start gap-4">
				<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#66c0f4]/25 bg-[#1b2838]/50">
					<FaSteam className="h-5 w-5 text-[#66c0f4]" />
				</div>
				<div>
					<p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500">
						Steam live count
					</p>
					<p className="mt-1 text-sm font-semibold text-neutral-300">
						Player count is temporarily unavailable
					</p>
					<p className="mt-1 text-xs text-neutral-500 leading-relaxed">
						Steam&apos;s API did not respond. You can still check live activity on the
						store page.
					</p>
					<a
						href={LABYRINTHINE_STEAM_STORE_URL}
						target="_blank"
						rel="noopener noreferrer"
						className="group mt-4 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#8fd4ff] transition-colors hover:text-[#b8e4ff]"
					>
						Open on Steam
						<FaArrowUpRightFromSquare className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
					</a>
				</div>
			</div>
		</div>
	);
}

export default async function PlayerCount() {
	const count = await getSteamCurrentPlayerCount();
	if (count === null) return <PlayerCountUnavailable />;

	const activity = getPlayerActivityLevel(count);

	return (
		<a
			href={LABYRINTHINE_STEAM_STORE_URL}
			target="_blank"
			rel="noopener noreferrer"
			className="group block rounded-2xl border border-[#66c0f4]/20 bg-[linear-gradient(135deg,rgba(27,40,56,0.55),rgba(8,10,12,0.65))] p-5 shadow-[0_8px_32px_rgba(0,0,0,0.25)] backdrop-blur-sm transition-all duration-300 hover:border-[#66c0f4]/40 hover:shadow-[0_12px_40px_rgba(102,192,244,0.12)]"
		>
			<div className="flex items-start justify-between gap-4">
				<div className="flex items-center gap-3">
					<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#66c0f4]/30 bg-[#1b2838]/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
						<FaSteam className="h-5 w-5 text-[#66c0f4]" />
					</div>
					<div>
						<div className="flex items-center gap-2">
							<span className="relative flex h-2 w-2">
								<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/80 opacity-60" />
								<span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(52,211,153,0.7)]" />
							</span>
							<span className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500">
								Live on Steam
							</span>
						</div>
						<p
							className={`mt-1 text-xs font-semibold uppercase tracking-[0.12em] ${tierAccent[activity.tier]}`}
						>
							{activity.label}
						</p>
					</div>
				</div>

				<span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500 transition-colors group-hover:border-[#66c0f4]/30 group-hover:text-[#8fd4ff]">
					Store
					<FaArrowUpRightFromSquare className="h-2.5 w-2.5" />
				</span>
			</div>

			<div className="mt-5">
				<p className="text-4xl sm:text-5xl font-black tabular-nums tracking-tight text-neutral-50">
					{count.toLocaleString()}
				</p>
				<p className="mt-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
					<FaUsers className="h-3 w-3" />
					Players in-game now
				</p>
				<p className="mt-3 text-xs text-neutral-500 leading-relaxed">{activity.hint}</p>
			</div>

			<p className="mt-4 border-t border-neutral-800/60 pt-3 text-[10px] font-medium uppercase tracking-[0.14em] text-neutral-600">
				Refreshes every minute · Tap to view on Steam
			</p>
		</a>
	);
}
