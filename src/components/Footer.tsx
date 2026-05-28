import {
	DISCORD_DEVELOPER_ADD_FRIEND_URL,
	VALKO_DISCORD_INVITE_URL,
} from "@/constants/discord";
import { LABYRINTHINE_STEAM_STORE_URL } from "@/constants/steam";
import { LABYRINTHINE_WIKI_URL } from "@/constants/wiki";
import Link from "next/link";
import {
	FaArrowUpRightFromSquare,
	FaDiscord,
	FaLayerGroup,
	FaPuzzlePiece,
	FaSteam,
	FaTrophy,
	FaWandMagicSparkles,
} from "react-icons/fa6";

interface FooterProps {
	isAuthenticated?: boolean;
}

const exploreLinks = (isAuthenticated: boolean) => [
	{
		label: isAuthenticated ? "Dashboard" : "Sign In",
		href: isAuthenticated ? "/dashboard" : "/login",
	},
	{
		label: isAuthenticated ? "Cosmetics" : "Sign Up",
		href: isAuthenticated ? "/cosmetics" : "/register",
	},
	{ label: "Puzzles", href: "/puzzles" },
	{ label: "Leaderboard", href: "/leaderboard" },
	{ label: "Search Players", href: "/search" },
];

const communityLinks = [
	{
		label: "Valko Discord",
		href: VALKO_DISCORD_INVITE_URL,
		external: true,
		icon: FaDiscord,
	},
	{
		label: "Steam Store",
		href: LABYRINTHINE_STEAM_STORE_URL,
		external: true,
		icon: FaSteam,
	},
	{
		label: "Wiki Guide",
		href: LABYRINTHINE_WIKI_URL,
		external: true,
		icon: FaArrowUpRightFromSquare,
	},
];

export default function Footer({ isAuthenticated = false }: FooterProps) {
	const year = new Date().getFullYear();

	return (
		<footer className="relative z-10 w-full px-4 sm:px-6 pb-8 sm:pb-12 pt-4 sm:pt-8">
			<div className="mx-auto w-full max-w-6xl">
				<div className="relative overflow-hidden rounded-3xl border border-neutral-800/40 bg-black/20 shadow-[0_12px_48px_rgba(0,0,0,0.18)] backdrop-blur-sm">
					<div
						aria-hidden
						className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,rgba(8,10,12,0.35),rgba(12,18,16,0.2))]"
					/>
					{/* Beacon strip */}
					<div className="relative border-b border-neutral-800/50 px-5 sm:px-8 py-4">
						<div className="flex items-center gap-3">
							<span className="relative flex h-2 w-2 shrink-0">
								<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/80 opacity-60" />
								<span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
							</span>
							<div className="h-px flex-1 bg-linear-to-r from-emerald-500/50 via-neutral-600/40 to-transparent" />
							<span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-500">
								Companion online
							</span>
						</div>
					</div>

					<div className="relative grid grid-cols-1 gap-8 p-5 sm:p-8 lg:grid-cols-[1.1fr_1fr_0.9fr] lg:gap-10 lg:p-10">
						{/* Brand */}
						<div className="flex flex-col gap-5">
							<div>
								<p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-emerald-500/90">
									Labyrinthine Tool
								</p>
								<h2 className="mt-2 text-2xl sm:text-3xl font-black uppercase tracking-tight text-neutral-100 leading-none">
									Map Your
									<span className="block text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
										Progress
									</span>
								</h2>
								<p className="mt-3 max-w-sm text-sm text-neutral-400 leading-relaxed">
									Cosmetics, squads, and puzzle prep, one toolkit built for players who
									want every run to count.
								</p>
							</div>

							<div className="flex flex-wrap gap-2">
								<span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/5 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-300">
									<FaWandMagicSparkles className="h-3 w-3" />
									100% free
								</span>
								<span className="inline-flex items-center gap-2 rounded-full border border-neutral-700/60 bg-white/3 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-400">
									<FaLayerGroup className="h-3 w-3 text-neutral-500" />
									Community driven
								</span>
							</div>
						</div>

						{/* Navigation */}
						<div className="grid grid-cols-2 gap-6 sm:gap-8">
							<nav aria-label="Explore">
								<p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500">
									Explore
								</p>
								<ul className="mt-4 space-y-2.5">
									{exploreLinks(isAuthenticated).map((link) => (
										<li key={link.href}>
											<Link
												href={link.href}
												className="group inline-flex items-center gap-2 text-sm text-neutral-300 transition-colors hover:text-white"
											>
												<span className="h-px w-0 bg-emerald-400 transition-all duration-300 group-hover:w-3" />
												{link.label}
											</Link>
										</li>
									))}
								</ul>
							</nav>

							<nav aria-label="Community">
								<p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500">
									Community
								</p>
								<ul className="mt-4 space-y-2.5">
									{communityLinks.map((link) => {
										const Icon = link.icon;
										return (
											<li key={link.href}>
												<a
													href={link.href}
													target="_blank"
													rel="noopener noreferrer"
													className="group inline-flex items-center gap-2 text-sm text-neutral-300 transition-colors hover:text-white"
												>
													<Icon className="h-3.5 w-3.5 text-neutral-500 transition-colors group-hover:text-emerald-400" />
													{link.label}
												</a>
											</li>
										);
									})}
								</ul>
							</nav>
						</div>

						{/* Developer card */}
						<div className="flex flex-col justify-between rounded-2xl border border-neutral-800/40 bg-black/15 p-5 sm:p-6">
							<div>
								<p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500">
									Crafted by
								</p>
								<a
									href="https://tiagodsribeiro.vercel.app"
									target="_blank"
									rel="noopener noreferrer"
									className="group mt-3 inline-flex items-center gap-2"
								>
									<span className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/35 bg-amber-500/10 text-sm font-black text-amber-200 transition-transform duration-300 group-hover:scale-105">
										G
									</span>
									<div>
										<span className="block text-lg font-black uppercase tracking-wide text-neutral-100 transition-colors group-hover:text-amber-100">
											GOLD
										</span>
										<span className="text-xs text-neutral-500 group-hover:text-neutral-400">
											Portfolio &rarr;
										</span>
									</div>
								</a>
								<p className="mt-4 text-xs text-neutral-500 leading-relaxed">
									Bugs, ideas, or feedback? Reach out on Discord, your input shapes what
									ships next.
								</p>
							</div>

							<Link
								href="/puzzles"
								className="group mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full border border-neutral-700/70 bg-white/4 px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-200 transition-all duration-300 hover:-translate-y-0.5 hover:border-neutral-500 hover:bg-white/[0.07] hover:text-white"
							>
								<FaPuzzlePiece className="h-3.5 w-3.5 transition-transform group-hover:rotate-12" />
								Practice puzzles
							</Link>
						</div>
					</div>

					{/* Bottom bar */}
					<div className="relative border-t border-neutral-800/50 px-5 sm:px-8 py-5 sm:py-6">
						<div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
							<p className="max-w-2xl text-[11px] leading-relaxed text-neutral-600">
								Not affiliated with or endorsed by Valko Game Studios. All game assets and
								lore belong to their respective owners.
							</p>
							<div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
								<span>&copy; {year} Labyrinthine Tool</span>
								<span className="hidden sm:inline text-neutral-700">|</span>
								<span className="inline-flex items-center gap-1.5">
									<FaTrophy className="h-3 w-3 text-neutral-600" />
									Player-built
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</footer>
	);
}
