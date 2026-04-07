import { FaSteam } from "react-icons/fa6";
import PlayerCount from "../PlayerCount";

export default function TrailerSection() {
	return (
		<section className="w-full max-w-4xl mx-auto px-6 mb-24 flex flex-col items-center">
			<div className="aspect-video w-full rounded-sm border border-neutral-800 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden bg-black relative mb-8">
				<video autoPlay loop muted playsInline className="w-full h-full object-cover">
					<source
						src="https://cdn.akamai.steamstatic.com/steam/apps/256962951/movie480_vp9.webm?t=1691679856"
						type="video/webm"
					/>
				</video>
			</div>
			<a
				href="https://store.steampowered.com/app/1302240/Labyrinthine/"
				target="_blank"
				rel="noopener noreferrer"
				className="group flex items-center justify-center gap-3 px-8 py-3 rounded-sm bg-neutral-900 text-neutral-100 font-bold text-base uppercase tracking-widest border border-neutral-700 hover:bg-neutral-800 hover:border-neutral-400 transition-all duration-300 shadow-[0_0_15px_rgba(255,255,255,0.05)] hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:-translate-y-1 active:translate-y-0"
			>
				<FaSteam />
				Buy on Steam
			</a>

			<PlayerCount />
		</section>
	);
}
