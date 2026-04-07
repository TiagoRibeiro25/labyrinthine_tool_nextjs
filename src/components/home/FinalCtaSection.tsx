import Link from "next/link";

interface FinalCtaSectionProps {
	isAuthenticated: boolean;
}

export default function FinalCtaSection({ isAuthenticated }: FinalCtaSectionProps) {
	return (
		<section className="w-full max-w-5xl mx-auto px-6 mb-8">
			<div className="border border-neutral-700 bg-linear-to-r from-black/70 via-neutral-900/50 to-black/70 p-8 sm:p-10 text-center shadow-[0_0_30px_rgba(255,255,255,0.06)]">
				<h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-neutral-100 mb-3">
					Enter Prepared, Leave Rewarded
				</h2>
				<p className="max-w-2xl mx-auto text-neutral-400 mb-8">
					Join the tracker, tighten your route planning, and make every run count for you
					and your team.
				</p>
				<div className="flex flex-col sm:flex-row items-center justify-center gap-4">
					<Link
						href={isAuthenticated ? "/dashboard" : "/signup"}
						className="w-full sm:w-auto group flex items-center justify-center gap-3 px-8 py-3 rounded-sm bg-neutral-100 text-black font-black uppercase tracking-widest hover:bg-white transition-colors"
					>
						{isAuthenticated ? "Go To Dashboard" : "Create Account"}
					</Link>
					<Link
						href="/leaderboard"
						className="w-full sm:w-auto group flex items-center justify-center gap-3 px-8 py-3 rounded-sm bg-neutral-900 text-neutral-100 font-bold uppercase tracking-widest border border-neutral-700 hover:border-neutral-400 hover:bg-neutral-800 transition-colors"
					>
						View Leaderboard
					</Link>
				</div>
			</div>
		</section>
	);
}
