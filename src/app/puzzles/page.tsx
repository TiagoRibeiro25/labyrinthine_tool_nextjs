import { Metadata } from "next";
import Link from "next/link";
import { FaArrowLeft, FaLightbulb, FaPuzzlePiece, FaTrophy } from "react-icons/fa6";

export const metadata: Metadata = {
	title: "Puzzles | Labyrinthine Tool",
	description: "Choose a puzzle to practice.",
};

export default function PuzzlesPage() {
	return (
		<main className="min-h-screen text-neutral-200 selection:bg-neutral-800/50 selection:text-neutral-200 flex flex-col items-center pt-24 pb-12 px-6 relative z-10">
			<div className="w-full max-w-4xl mb-8 flex justify-start">
				<Link
					href="/"
					className="group flex items-center gap-2 px-4 py-2 rounded-sm bg-neutral-900 text-neutral-400 font-bold text-sm uppercase tracking-widest border border-neutral-800 hover:bg-neutral-800 hover:text-neutral-100 hover:border-neutral-500 transition-all duration-300"
				>
					<FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
					Back to Home
				</Link>
			</div>
			<div className="max-w-4xl w-full flex flex-col items-center text-center gap-12">
				<h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter mb-4 text-transparent bg-clip-text bg-linear-to-b from-neutral-100 via-neutral-400 to-neutral-800 drop-shadow-[0_5px_5px_rgba(0,0,0,1)] uppercase">
					Puzzles
				</h1>

				<p className="max-w-2xl mx-auto text-lg sm:text-xl text-neutral-400 font-medium tracking-wide drop-shadow-md">
					Select a puzzle type to practice.
				</p>

				<div className="flex flex-col sm:flex-row gap-6 w-full sm:w-auto mt-8">
					<Link
						href="/puzzles/slider-puzzle"
						className="group flex flex-col items-center justify-center gap-4 px-10 py-8 rounded-sm bg-neutral-900/80 text-neutral-100 border border-neutral-700 hover:bg-neutral-800 hover:border-neutral-400 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.05)] hover:shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:-translate-y-1 w-full sm:w-64"
					>
						<FaPuzzlePiece className="w-12 h-12 text-neutral-400 group-hover:text-white group-hover:scale-110 transition-all duration-300" />
						<span className="font-bold text-xl uppercase tracking-widest">
							Slider Puzzle
						</span>
					</Link>

					<Link
						href="/puzzles/lights-out"
						className="group flex flex-col items-center justify-center gap-4 px-10 py-8 rounded-sm bg-neutral-900/80 text-neutral-100 border border-neutral-700 hover:bg-neutral-800 hover:border-neutral-400 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.05)] hover:shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:-translate-y-1 w-full sm:w-64"
					>
						<FaLightbulb className="w-12 h-12 text-neutral-400 group-hover:text-white group-hover:scale-110 transition-all duration-300" />
						<span className="font-bold text-xl uppercase tracking-widest">
							Lights Out
						</span>
					</Link>

					<Link
						href="/puzzles/leaderboard"
						className="group flex flex-col items-center justify-center gap-4 px-10 py-8 rounded-sm bg-neutral-900/80 text-neutral-100 border border-neutral-700 hover:bg-neutral-800 hover:border-neutral-400 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.05)] hover:shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:-translate-y-1 w-full sm:w-64"
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
