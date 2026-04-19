import Link from "next/link";
import {
	FaArrowRight,
	FaKey,
	FaLayerGroup,
	FaPuzzlePiece,
	FaUsers,
} from "react-icons/fa6";

interface HeroSectionProps {
	isAuthenticated: boolean;
}

const highlights = [
	{
		label: "Track Cosmetics",
		value: "400+",
		description: "Organize unlocked and missing pieces with fast filtering.",
	},
	{
		label: "Coordinate Friends",
		value: "Squad Ready",
		description: "Compare collections and plan who should chase what next.",
	},
	{
		label: "Practice Puzzles",
		value: "Anytime",
		description: "Train for runs with dedicated puzzle tools and rankings.",
	},
];

export default function HeroSection({ isAuthenticated }: HeroSectionProps) {
	return (
		<section className="w-full px-4 sm:px-6 pt-10 sm:pt-14 pb-12 sm:pb-16">
			<div className="mx-auto w-full max-w-6xl rounded-3xl border border-neutral-800/80 bg-[linear-gradient(145deg,rgba(8,11,13,0.95),rgba(20,27,25,0.9))] p-5 sm:p-8 lg:p-10 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
				<div className="mb-6 inline-flex items-center gap-3 rounded-full border border-neutral-700/80 bg-black/45 px-4 py-2">
					<span className="relative flex h-2.5 w-2.5">
						<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
						<span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
					</span>
					<span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-300">
						Community Tracker Online
					</span>
				</div>

				<div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:gap-10">
					<div>
						<h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight uppercase text-neutral-100 leading-[0.95]">
							Survive the
							<span className="block text-white drop-shadow-[0_0_28px_rgba(255,255,255,0.28)]">
								Labyrinthine
							</span>
						</h1>

						<p className="mt-5 max-w-2xl text-base sm:text-lg text-neutral-300 leading-relaxed">
							Keep your progress visible, your squad aligned, and every run more rewarding
							with one unified toolkit for cosmetics, friends, and puzzle prep.
						</p>

						<div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
							<Link
								href={isAuthenticated ? "/dashboard" : "/login"}
								className="group inline-flex w-full sm:w-auto items-center justify-center gap-3 rounded-full border border-neutral-700 bg-neutral-900 px-7 py-3.5 text-sm sm:text-base font-bold uppercase tracking-[0.14em] text-neutral-100 transition-all duration-300 hover:-translate-y-1 hover:border-neutral-400 hover:bg-neutral-800 hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]"
							>
								{isAuthenticated ? (
									<FaLayerGroup className="h-5 w-5 transition-transform group-hover:scale-110" />
								) : (
									<FaKey className="h-5 w-5 transition-transform group-hover:scale-110" />
								)}
								{isAuthenticated ? "Open Dashboard" : "Sign In"}
							</Link>

							<Link
								href="/puzzles"
								className="group inline-flex w-full sm:w-auto items-center justify-center gap-3 rounded-full border border-neutral-700 bg-black/40 px-7 py-3.5 text-sm sm:text-base font-bold uppercase tracking-[0.14em] text-neutral-100 transition-all duration-300 hover:-translate-y-1 hover:border-neutral-400 hover:bg-neutral-900"
							>
								<FaPuzzlePiece className="h-5 w-5 transition-transform group-hover:scale-110" />
								Explore Puzzles
							</Link>
						</div>

						<div className="mt-6 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-neutral-500">
							<FaUsers className="h-3.5 w-3.5" />
							Built for solo players and full squads
						</div>
					</div>

					<div className="grid grid-cols-1 gap-3">
						{highlights.map((item) => (
							<article
								key={item.label}
								className="rounded-2xl border border-neutral-800 bg-black/35 p-4 sm:p-5 transition-colors duration-300 hover:border-neutral-600"
							>
								<div className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500">
									{item.label}
								</div>
								<div className="mt-1 text-2xl font-black uppercase tracking-tight text-neutral-100">
									{item.value}
								</div>
								<p className="mt-2 text-sm text-neutral-400 leading-relaxed">
									{item.description}
								</p>
							</article>
						))}

						<Link
							href="/leaderboard"
							className="group rounded-2xl border border-neutral-700/80 bg-neutral-900/45 p-4 sm:p-5 transition-all duration-300 hover:border-neutral-400 hover:bg-neutral-900"
						>
							<div className="mt-2 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.14em] text-neutral-100">
								View Leaderboard
								<FaArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
							</div>
						</Link>
					</div>
				</div>
			</div>
		</section>
	);
}
