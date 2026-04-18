import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { FaArrowLeft, FaSkullCrossbones } from "react-icons/fa6";
import { GiLanternFlame, GiFootsteps } from "react-icons/gi";

export default async function NotFound() {
	const session = await getServerSession(authOptions);

	return (
		<main className="min-h-screen text-neutral-200 flex flex-col items-center justify-center px-6 relative z-10 selection:bg-neutral-800/50 selection:text-neutral-200">
			<div className="w-full max-w-2xl p-8 sm:p-12 bg-black/80 backdrop-blur-md border border-neutral-800 border-t-4 border-t-neutral-600 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative text-center flex flex-col items-center">
				<GiLanternFlame className="text-6xl text-neutral-600 mb-6 animate-pulse drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" />

				<h1 className="text-6xl sm:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-linear-to-b from-neutral-100 to-neutral-700 drop-shadow-[0_5px_5px_rgba(0,0,0,1)] mb-4 flex items-center justify-center gap-2 sm:gap-4">
					4<FaSkullCrossbones className="text-neutral-500 pb-2" />4
				</h1>

				<h2 className="text-2xl sm:text-3xl font-black tracking-widest text-neutral-300 uppercase mb-4">
					Dead End
				</h2>

				<p className="text-base sm:text-lg text-neutral-400 font-medium tracking-wide mb-8 leading-relaxed max-w-lg">
					You&apos;ve wandered too far into the maze. The cosmetics you are looking for
					have been swallowed by the fog, or perhaps you just took a wrong turn.
				</p>

				<div className="flex flex-col sm:flex-row items-center gap-3 text-sm text-neutral-500 font-bold tracking-widest uppercase bg-neutral-900/50 px-6 py-4 border border-neutral-800 mb-10 rounded-sm w-full">
					<GiFootsteps className="text-2xl text-neutral-400 shrink-0" />
					<span className="text-center sm:text-left">
						Survival Tip: Never stray from the path without a lantern.
					</span>
				</div>

				<Link
					href={session ? "/dashboard" : "/"}
					className="group inline-flex items-center justify-center gap-3 px-8 py-4 rounded-sm bg-neutral-900 text-neutral-100 font-bold text-base uppercase tracking-widest border border-neutral-700 hover:bg-neutral-800 hover:border-neutral-400 transition-all duration-300 shadow-[0_0_15px_rgba(255,255,255,0.05)] hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:-translate-y-1 active:translate-y-0 w-full sm:w-auto"
				>
					<FaArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
					Retreat to Safety
				</Link>
			</div>
		</main>
	);
}
