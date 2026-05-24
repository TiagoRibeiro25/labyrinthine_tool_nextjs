import Link from "next/link";
import { FaArrowUpRightFromSquare, FaBook } from "react-icons/fa6";
import { LABYRINTHINE_WIKI_URL } from "../../constants/wiki";

const wikiTopics = [
	"Case files, chapters, and map layouts",
	"Entity behavior and safe routes",
	"Cosmetics, events, and unlock tips",
	"Mechanics, items, and co-op strategies",
];

export default function WikiGuideSection() {
	return (
		<section className="w-full px-4 sm:px-6 mb-20 sm:mb-24">
			<div className="mx-auto w-full max-w-6xl rounded-3xl border border-neutral-800/80 bg-[linear-gradient(145deg,rgba(8,11,13,0.95),rgba(20,27,25,0.9))] p-5 sm:p-8 lg:p-10 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
				<div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
					<div>
						<span className="inline-flex items-center gap-2 rounded-full border border-neutral-700 bg-black/35 px-4 py-1.5 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.16em] text-neutral-300">
							<FaBook className="h-3.5 w-3.5 text-amber-300" />
							Community Wiki
						</span>

						<h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight uppercase text-neutral-100">
							Level Up Your Knowledge
						</h2>

						<p className="mt-3 max-w-2xl text-sm sm:text-base text-neutral-400 leading-relaxed">
							Want to learn more and get better at Labyrinthine? The community maintained
							wiki covers mechanics, routes, cosmetics, and strategies so you can head
							into each run prepared.
						</p>

						<Link
							href={LABYRINTHINE_WIKI_URL}
							target="_blank"
							rel="noopener noreferrer"
							className="group mt-7 inline-flex w-full sm:w-auto items-center justify-center gap-3 rounded-full border border-amber-700/60 bg-amber-900/25 px-7 py-3.5 text-sm sm:text-base font-bold uppercase tracking-[0.14em] text-neutral-100 transition-all duration-300 hover:-translate-y-1 hover:border-amber-500 hover:bg-amber-900/40 hover:shadow-[0_0_30px_rgba(245,158,11,0.15)]"
						>
							<FaBook className="h-5 w-5 text-amber-300 transition-transform group-hover:scale-110" />
							Open the Wiki
							<FaArrowUpRightFromSquare className="h-3.5 w-3.5 opacity-70" />
						</Link>
					</div>

					<div className="rounded-2xl border border-neutral-800 bg-black/35 p-5 sm:p-6">
						<h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500">
							Great starting points
						</h3>
						<ul className="mt-4 space-y-3">
							{wikiTopics.map((topic) => (
								<li
									key={topic}
									className="flex items-start gap-3 text-sm text-neutral-300 leading-relaxed"
								>
									<span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400/80" />
									{topic}
								</li>
							))}
						</ul>
					</div>
				</div>
			</div>
		</section>
	);
}
