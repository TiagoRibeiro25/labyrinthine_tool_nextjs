import { FaSteam } from "react-icons/fa6";
import PlayerCount from "../PlayerCount";

export default function TrailerSection() {
	return (
		<section className="w-full px-4 sm:px-6 mb-20 sm:mb-24">
			<div className="mx-auto w-full max-w-6xl rounded-3xl border border-neutral-800/80 bg-[linear-gradient(145deg,rgba(8,11,13,0.95),rgba(20,27,25,0.9))] p-4 sm:p-6 lg:p-8 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
				<div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
					<div>
						<h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight uppercase text-neutral-100">
							Official Trailer
						</h2>
						<p className="mt-1 text-sm sm:text-base text-neutral-400">
							Get a quick look at the atmosphere before your next run.
						</p>
					</div>
				</div>

				<div className="overflow-hidden rounded-2xl border border-neutral-800 bg-black shadow-[0_0_50px_rgba(0,0,0,0.75)]">
					<div className="aspect-video w-full">
						<video
							autoPlay
							loop
							muted
							playsInline
							controls
							className="h-full w-full object-cover"
						>
							<source
								src="https://cdn.akamai.steamstatic.com/steam/apps/256962951/movie480_vp9.webm?t=1691679856"
								type="video/webm"
							/>
						</video>
					</div>
				</div>

				<div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<a
						href="https://store.steampowered.com/app/1302240/Labyrinthine/"
						target="_blank"
						rel="noopener noreferrer"
						className="group inline-flex w-full sm:w-auto items-center justify-center gap-3 rounded-full border border-neutral-700 bg-neutral-900 px-7 py-3 text-sm sm:text-base font-bold uppercase tracking-[0.14em] text-neutral-100 transition-all duration-300 hover:-translate-y-1 hover:border-neutral-400 hover:bg-neutral-800 hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]"
					>
						<FaSteam className="h-4 w-4 sm:h-5 sm:w-5" />
						Buy on Steam
					</a>

					<div className="w-full sm:w-auto">
						<PlayerCount />
					</div>
				</div>
			</div>
		</section>
	);
}
