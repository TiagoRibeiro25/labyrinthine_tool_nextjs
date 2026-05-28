import {
	LABYRINTHINE_STEAM_NEWS_URL,
	LABYRINTHINE_STEAM_STORE_URL,
} from "@/constants/steam";
import Link from "next/link";
import { FaArrowUpRightFromSquare, FaFilm, FaPlay, FaSteam } from "react-icons/fa6";
import PlayerCount from "../PlayerCount";

const TRAILER_SRC =
	"https://cdn.akamai.steamstatic.com/steam/apps/256962951/movie480_vp9.webm?t=1691679856";

const atmosphereNotes = [
	"Procedural cases that never play the same twice.",
	"Co-op horror built for tension, teamwork, and close calls.",
	"Unlock cosmetics and chase completion across every chapter.",
];

export default function TrailerSection() {
	return (
		<section className="w-full px-4 sm:px-6 mb-20 sm:mb-24">
			<div className="mx-auto w-full max-w-6xl">
				<div className="relative overflow-hidden rounded-3xl border border-neutral-800/40 bg-black/20 shadow-[0_12px_48px_rgba(0,0,0,0.18)] backdrop-blur-sm">
					<div
						aria-hidden
						className="pointer-events-none absolute inset-0 bg-[linear-gradient(145deg,rgba(8,10,12,0.4),rgba(14,20,18,0.25))]"
					/>
					<div
						aria-hidden
						className="pointer-events-none absolute -right-16 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-red-950/20 blur-3xl"
					/>

					<div className="relative grid grid-cols-1 gap-8 p-5 sm:p-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:gap-10 lg:p-10">
						{/* Copy + actions */}
						<div className="flex flex-col gap-6 lg:pr-2">
							<div>
								<span className="inline-flex items-center gap-2 rounded-full border border-neutral-700/70 bg-white/4 px-4 py-1.5 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.16em] text-neutral-300">
									<FaFilm className="h-3.5 w-3.5 text-red-400/90" />
									Official trailer
								</span>

								<h2 className="mt-4 text-3xl sm:text-4xl lg:text-[2.65rem] font-black tracking-tight uppercase text-neutral-100 leading-[0.95]">
									Feel the
									<span className="block text-white drop-shadow-[0_0_22px_rgba(255,255,255,0.18)]">
										Dread First
									</span>
								</h2>

								<p className="mt-4 max-w-md text-sm sm:text-base text-neutral-400 leading-relaxed">
									Watch the official Steam trailer, then jump back into your tracker ready
									for the next case, route, and cosmetic hunt.
								</p>
							</div>

							<ul className="space-y-3">
								{atmosphereNotes.map((note) => (
									<li
										key={note}
										className="flex items-start gap-3 rounded-xl border border-neutral-800/50 bg-black/20 px-3.5 py-3"
									>
										<span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500/90 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
										<span className="text-sm text-neutral-300 leading-relaxed">
											{note}
										</span>
									</li>
								))}
							</ul>

							<div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
								<a
									href={LABYRINTHINE_STEAM_STORE_URL}
									target="_blank"
									rel="noopener noreferrer"
									className="group inline-flex w-full sm:w-auto items-center justify-center gap-3 rounded-full border border-[#1b2838]/80 bg-[#1b2838]/70 px-7 py-3.5 text-sm font-bold uppercase tracking-[0.14em] text-neutral-100 transition-all duration-300 hover:-translate-y-1 hover:border-[#66c0f4]/50 hover:bg-[#1b2838] hover:shadow-[0_0_28px_rgba(102,192,244,0.18)]"
								>
									<FaSteam className="h-5 w-5 text-[#66c0f4] transition-transform group-hover:scale-110" />
									Buy on Steam
								</a>

								<Link
									href={LABYRINTHINE_STEAM_NEWS_URL}
									target="_blank"
									rel="noopener noreferrer"
									className="group inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full border border-neutral-700/80 bg-white/3 px-6 py-3.5 text-sm font-bold uppercase tracking-[0.14em] text-neutral-300 transition-all duration-300 hover:-translate-y-1 hover:border-neutral-500 hover:text-neutral-100"
								>
									Patch notes
									<FaArrowUpRightFromSquare className="h-3.5 w-3.5 opacity-70 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
								</Link>
							</div>

							<PlayerCount />
						</div>

						{/* Cinema frame */}
						<div className="relative">
							<div
								aria-hidden
								className="pointer-events-none absolute -inset-3 rounded-[1.35rem] border border-red-500/10 bg-red-950/5 blur-sm"
							/>

							<div className="relative overflow-hidden rounded-2xl border border-neutral-800/80 bg-black shadow-[0_20px_60px_rgba(0,0,0,0.55)]">
								<div className="flex items-center justify-between border-b border-neutral-800/80 bg-black/60 px-4 py-2.5">
									<div className="flex items-center gap-2">
										<span className="relative flex h-2 w-2">
											<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500/70 opacity-60" />
											<span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
										</span>
										<span className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500">
											Now playing
										</span>
									</div>
									<span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-600">
										Labyrinthine
									</span>
								</div>

								<div className="relative aspect-video w-full">
									<div
										aria-hidden
										className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.45)_100%)]"
									/>
									<div
										aria-hidden
										className="pointer-events-none absolute inset-x-0 top-0 z-10 h-16 bg-linear-to-b from-black/50 to-transparent"
									/>
									<div
										aria-hidden
										className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-20 bg-linear-to-t from-black/60 to-transparent"
									/>

									<video
										autoPlay
										loop
										muted
										playsInline
										controls
										className="h-full w-full object-cover"
									>
										<source src={TRAILER_SRC} type="video/webm" />
									</video>
								</div>

								{/* Corner brackets */}
								<span
									aria-hidden
									className="pointer-events-none absolute left-3 top-12 h-5 w-5 border-l-2 border-t-2 border-white/20"
								/>
								<span
									aria-hidden
									className="pointer-events-none absolute right-3 top-12 h-5 w-5 border-r-2 border-t-2 border-white/20"
								/>
								<span
									aria-hidden
									className="pointer-events-none absolute bottom-3 left-3 h-5 w-5 border-b-2 border-l-2 border-white/20"
								/>
								<span
									aria-hidden
									className="pointer-events-none absolute bottom-3 right-3 h-5 w-5 border-b-2 border-r-2 border-white/20"
								/>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
