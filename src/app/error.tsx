"use client";

import Link from "next/link";
import { FaArrowLeft, FaRotateRight } from "react-icons/fa6";

export default function Error() {
	return (
		<main className="min-h-screen text-neutral-200 flex flex-col items-center justify-center py-12 px-4 sm:px-6 relative z-10 selection:bg-neutral-800/50 selection:text-neutral-200">
			<div className="w-full max-w-xl bg-black/80 backdrop-blur-md border border-neutral-800 border-t-4 border-t-red-600 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative p-6 sm:p-10 flex flex-col items-center text-center">
				<h1 className="text-4xl sm:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-linear-to-b from-neutral-100 to-neutral-700 drop-shadow-[0_5px_5px_rgba(0,0,0,1)] mb-4 uppercase">
					System Failure
				</h1>
				<p className="text-neutral-400 font-medium mb-8">
					We encountered an unexpected error while trying to process your request. The
					server or database might be offline or temporarily unreachable.
				</p>

				<div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
					<button
						onClick={() => window.location.reload()}
						className="group inline-flex items-center justify-center gap-3 px-8 py-4 rounded-sm bg-red-900/20 text-red-400 font-bold text-base uppercase tracking-widest border border-red-900/50 hover:bg-red-900/40 hover:border-red-500/50 transition-all duration-300 w-full sm:w-auto cursor-pointer"
					>
						<FaRotateRight className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
						Try Again
					</button>
					<Link
						href="/"
						className="group inline-flex items-center justify-center gap-3 px-8 py-4 rounded-sm bg-neutral-900 text-neutral-100 font-bold text-base uppercase tracking-widest border border-neutral-700 hover:bg-neutral-800 hover:border-neutral-400 transition-all duration-300 w-full sm:w-auto"
					>
						<FaArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
						Return Home
					</Link>
				</div>
			</div>
		</main>
	);
}
