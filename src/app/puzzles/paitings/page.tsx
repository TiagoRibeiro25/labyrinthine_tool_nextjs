import PaitingsSlotsPuzzle from "@/components/PaintingSlotsPuzzle";
import { Metadata } from "next";
import Link from "next/link";
import { FaArrowLeft, FaHouse } from "react-icons/fa6";

export const metadata: Metadata = {
	title: "Manor Paintings | Labyrinthine Tool",
	description:
		"Record the Manor map painting order during case files so you don't have to memorize portraits in-game.",
};

const tips = [
	"In Manor case files, the map has a wall puzzle: four portraits must be placed in the correct order.",
	"When you learn the order in-game, set the same sequence here left to right (Frame 1 → Frame 4).",
	"Keep this page open on a second screen, or check it between runs, no memorization required.",
	"Drag portraits into the frames, click to fill the next slot, or on touch tap a portrait then a frame.",
];

export default function PaitingsPage() {
	return (
		<main className="relative z-10 min-h-screen px-4 pb-12 pt-20 text-neutral-200 selection:bg-neutral-800/50 selection:text-neutral-200 sm:px-6 sm:pt-24">
			<div className="mx-auto w-full max-w-6xl">
				<Link
					href="/puzzles"
					className="group mb-6 inline-flex items-center gap-2 rounded-full border border-neutral-700 bg-neutral-900/80 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-neutral-300 transition-all duration-300 hover:border-neutral-500 hover:bg-neutral-800 hover:text-neutral-100"
				>
					<FaArrowLeft className="transition-transform group-hover:-translate-x-1" />
					Back to Puzzles
				</Link>

				<div className="rounded-3xl border border-neutral-800/80 bg-[linear-gradient(145deg,rgba(8,11,13,0.95),rgba(20,27,25,0.9))] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.45)] sm:p-8 lg:p-10">
					<div className="grid grid-cols-1 gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:gap-10 lg:items-start">
						<header className="lg:sticky lg:top-24">
							<span className="inline-flex items-center gap-2 rounded-full border border-amber-700/50 bg-amber-950/30 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-200/90 sm:text-xs">
								<FaHouse className="h-3.5 w-3.5 text-amber-400" />
								Manor · Case files
							</span>

							<h1 className="mt-4 text-3xl font-black uppercase leading-[0.95] tracking-tight text-neutral-100 sm:text-4xl lg:text-5xl">
								Record the
								<span className="block text-white drop-shadow-[0_0_22px_rgba(255,255,255,0.16)]">
									Painting Order
								</span>
							</h1>

							<p className="mt-4 max-w-md text-sm leading-relaxed text-neutral-400 sm:text-base">
								On the Manor map, case files include a puzzle where you must remember
								which portraits hang on the wall and in what order. Use this tool to
								log that order as you figure it out, so you can solve the puzzle in-game
								without memorizing every run.
							</p>

							<ul className="mt-6 space-y-3">
								{tips.map((tip) => (
									<li
										key={tip}
										className="flex items-start gap-3 rounded-xl border border-neutral-800 bg-black/35 px-3.5 py-3"
									>
										<span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400/90 shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
										<span className="text-sm leading-relaxed text-neutral-300">{tip}</span>
									</li>
								))}
							</ul>
						</header>

						<div className="min-w-0">
							<PaitingsSlotsPuzzle />
						</div>
					</div>
				</div>
			</div>
		</main>
	);
}
