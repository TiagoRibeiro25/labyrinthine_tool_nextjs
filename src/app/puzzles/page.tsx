import { Metadata } from "next";
import Link from "next/link";
import { FaArrowLeft, FaLightbulb, FaPuzzlePiece, FaTrophy } from "react-icons/fa6";

export const metadata: Metadata = {
	title: "Puzzles | Labyrinthine Tool",
	description: "Choose a puzzle to practice.",
};

export default function PuzzlesPage() {
	return (
		<main className="min-h-screen text-neutral-200 selection:bg-neutral-800/50 selection:text-neutral-200 flex flex-col items-center py-8 sm:py-12 px-4 sm:px-6 relative z-10">
			<div className="w-full max-w-5xl mb-6 sm:mb-8 flex justify-start">
				<Link
					href="/"
					className="group flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-900 text-neutral-300 font-semibold text-[11px] uppercase tracking-[0.16em] border border-neutral-700 hover:bg-neutral-800 hover:text-neutral-100 hover:border-neutral-500 transition-all duration-300"
				>
					<FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
					Back to Home
				</Link>
			</div>
			<div className="max-w-5xl w-full flex flex-col items-center text-center gap-8 sm:gap-10 rounded-3xl border border-neutral-800/80 bg-[linear-gradient(145deg,rgba(8,10,14,0.95),rgba(16,25,32,0.9))] shadow-[0_24px_80px_rgba(0,0,0,0.45)] p-5 sm:p-8 lg:p-10">
				<h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight mb-2 text-neutral-100 uppercase">
					Puzzles
				</h1>

				<p className="max-w-2xl mx-auto text-base sm:text-lg text-neutral-400 font-medium tracking-wide">
					Select a puzzle type to practice.
				</p>

				<div className="flex flex-col sm:flex-row gap-4 sm:gap-6 w-full sm:w-auto mt-2 sm:mt-4">
					<Link
						href="/puzzles/slider-puzzle"
						className="group flex flex-col items-center justify-center gap-4 px-8 py-7 rounded-2xl bg-neutral-900/75 text-neutral-100 border border-neutral-700 hover:bg-neutral-800 hover:border-neutral-400 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.05)] hover:shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:-translate-y-1 w-full sm:w-64"
					>
						<FaPuzzlePiece className="w-12 h-12 text-neutral-400 group-hover:text-white group-hover:scale-110 transition-all duration-300" />
						<span className="font-bold text-xl uppercase tracking-widest">
							Slider Puzzle
						</span>
					</Link>

					<Link
						href="/puzzles/lights-out"
						className="group flex flex-col items-center justify-center gap-4 px-8 py-7 rounded-2xl bg-neutral-900/75 text-neutral-100 border border-neutral-700 hover:bg-neutral-800 hover:border-neutral-400 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.05)] hover:shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:-translate-y-1 w-full sm:w-64"
					>
						<FaLightbulb className="w-12 h-12 text-neutral-400 group-hover:text-white group-hover:scale-110 transition-all duration-300" />
						<span className="font-bold text-xl uppercase tracking-widest">
							Lights Out
						</span>
					</Link>

					<Link
						href="/puzzles/leaderboard"
						className="group flex flex-col items-center justify-center gap-4 px-8 py-7 rounded-2xl bg-neutral-900/75 text-neutral-100 border border-neutral-700 hover:bg-neutral-800 hover:border-neutral-400 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.05)] hover:shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:-translate-y-1 w-full sm:w-64"
					>
						<FaTrophy className="w-12 h-12 text-neutral-400 group-hover:text-yellow-400 group-hover:scale-110 transition-all duration-300" />
						<span className="font-bold text-xl uppercase tracking-widest text-center">
							Puzzle Leaderboards
						</span>
					</Link>
				</div>
			</div>
		</main>
	);
}
