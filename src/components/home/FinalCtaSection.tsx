import Link from "next/link";
import { FaArrowRight, FaLayerGroup, FaTrophy, FaUserPlus } from "react-icons/fa6";

interface FinalCtaSectionProps {
	isAuthenticated: boolean;
}

const callouts = [
	"Track every unlocked cosmetic from one clean dashboard.",
	"Coordinate targets with friends and compare progress quickly.",
	"Keep momentum with puzzle practice and leaderboard goals.",
];

export default function FinalCtaSection({ isAuthenticated }: FinalCtaSectionProps) {
	return (
		<section className="w-full px-4 sm:px-6 mb-10 sm:mb-12">
			<div className="mx-auto w-full max-w-6xl rounded-3xl border border-neutral-800/80 bg-[linear-gradient(145deg,rgba(8,11,13,0.95),rgba(20,27,25,0.9))] p-5 sm:p-8 lg:p-10 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
				<div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-6 sm:gap-8 items-stretch">
					<div className="rounded-2xl border border-neutral-800 bg-black/35 p-5 sm:p-6">
						<span className="inline-flex items-center rounded-full border border-neutral-700 bg-black/45 px-4 py-1.5 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.16em] text-neutral-300">
							Ready for your next run?
						</span>

						<h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-neutral-100">
							Enter Prepared, Leave Rewarded
						</h2>

						<p className="mt-4 text-sm sm:text-base text-neutral-400 max-w-2xl leading-relaxed">
							Bring your profile, puzzle prep, and squad planning into one flow that feels
							as polished as the rest of your toolkit.
						</p>

						<ul className="mt-5 space-y-3">
							{callouts.map((item) => (
								<li
									key={item}
									className="flex items-start gap-3 rounded-xl border border-neutral-800 bg-black/45 px-3 py-3"
								>
									<span className="mt-1.5 inline-flex h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
									<span className="text-sm text-neutral-300 leading-relaxed">{item}</span>
								</li>
							))}
						</ul>
					</div>

					<div className="rounded-2xl border border-neutral-800 bg-black/35 p-5 sm:p-6 flex flex-col">
						<h3 className="text-lg sm:text-xl font-black uppercase tracking-[0.12em] text-neutral-100">
							Choose your path
						</h3>
						<p className="mt-2 text-sm text-neutral-400 leading-relaxed">
							{isAuthenticated
								? "Jump back into your dashboard and keep your collection progress moving."
								: "Create your account to start tracking cosmetics and coordinating with friends."}
						</p>

						<div className="mt-5 space-y-3">
							<Link
								href={isAuthenticated ? "/dashboard" : "/signup"}
								className="group inline-flex w-full items-center justify-center gap-3 rounded-full border border-neutral-700 bg-neutral-900 px-6 py-3.5 text-sm font-bold uppercase tracking-[0.14em] text-neutral-100 transition-all duration-300 hover:-translate-y-1 hover:border-neutral-400 hover:bg-neutral-800 hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]"
							>
								{isAuthenticated ? (
									<FaLayerGroup className="h-4 w-4" />
								) : (
									<FaUserPlus className="h-4 w-4" />
								)}
								{isAuthenticated ? "Go to Dashboard" : "Create Account"}
								<FaArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
							</Link>

							<Link
								href="/leaderboard"
								className="group inline-flex w-full items-center justify-center gap-3 rounded-full border border-neutral-700 bg-black/45 px-6 py-3.5 text-sm font-bold uppercase tracking-[0.14em] text-neutral-100 transition-all duration-300 hover:-translate-y-1 hover:border-neutral-400 hover:bg-neutral-900"
							>
								<FaTrophy className="h-4 w-4" />
								View Leaderboard
							</Link>
						</div>

						<div className="mt-auto pt-5 text-xs uppercase tracking-[0.16em] text-neutral-500">
							Progress sync • Squad-ready • Mobile-friendly
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
