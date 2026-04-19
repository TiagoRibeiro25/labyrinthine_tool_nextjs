import { FaPuzzlePiece, FaShirt, FaUserGroup } from "react-icons/fa6";
import { featureBlocks } from "./homeContent";

const featureIcons = [FaShirt, FaPuzzlePiece, FaUserGroup];

export default function FeatureHighlightsSection() {
	return (
		<section className="w-full px-4 sm:px-6 mb-20 sm:mb-24">
			<div className="mx-auto w-full max-w-6xl rounded-3xl border border-neutral-800/80 bg-[linear-gradient(145deg,rgba(8,11,13,0.95),rgba(20,27,25,0.9))] p-5 sm:p-8 lg:p-10 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
				<div className="mb-8 sm:mb-10 text-center">
					<span className="inline-flex items-center rounded-full border border-neutral-700 bg-black/35 px-4 py-1.5 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.16em] text-neutral-300">
						Why Players Use It
					</span>
					<h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight uppercase text-neutral-100">
						Built for Every Run
					</h2>
					<p className="mt-3 max-w-3xl mx-auto text-sm sm:text-base text-neutral-400">
						From first map clears to late game collection grinding, this toolkit keeps
						your progress visible and your team coordinated.
					</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
					{featureBlocks.map((feature, index) => {
						const Icon = featureIcons[index % featureIcons.length];

						return (
							<article
								key={feature.title}
								className="group relative h-full rounded-2xl border border-neutral-800 bg-black/35 p-5 sm:p-6 transition-all duration-300 hover:-translate-y-1 hover:border-neutral-600 hover:bg-black/45"
							>
								<div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-full border border-neutral-700 bg-neutral-900/70 text-neutral-300 transition-colors duration-300 group-hover:border-neutral-500 group-hover:text-neutral-100">
									<Icon className="h-4 w-4" />
								</div>

								<h3 className="text-lg sm:text-xl font-black tracking-wide uppercase text-neutral-100">
									{feature.title}
								</h3>

								<p className="mt-3 text-sm text-neutral-400 leading-relaxed">
									{feature.description}
								</p>

								<div className="mt-5 rounded-xl border border-neutral-800 bg-black/45 px-3 py-2">
									<p className="text-xs sm:text-sm font-semibold text-neutral-200 leading-relaxed">
										{feature.accent}
									</p>
								</div>
							</article>
						);
					})}
				</div>
			</div>
		</section>
	);
}
