import { featureBlocks } from "./homeContent";

export default function FeatureHighlightsSection() {
	return (
		<section className="w-full max-w-6xl mx-auto px-6 mb-24">
			<div className="mb-10 text-center">
				<h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight uppercase text-neutral-100 mb-3">
					Built For Every Run
				</h2>
				<p className="text-neutral-400 max-w-3xl mx-auto">
					From first map clears to late-game collection grinding, this toolkit keeps your
					progress visible and your team coordinated.
				</p>
			</div>
			<div className="grid grid-cols-1 md:grid-cols-3 gap-5">
				{featureBlocks.map((feature) => (
					<article
						key={feature.title}
						className="h-full p-6 bg-black/50 border border-neutral-800 hover:border-neutral-500 transition-colors duration-300"
					>
						<h3 className="text-xl font-bold text-neutral-100 mb-3 tracking-wide uppercase">
							{feature.title}
						</h3>
						<p className="text-neutral-400 text-sm leading-relaxed mb-4">
							{feature.description}
						</p>
						<p className="text-neutral-200 text-sm font-semibold">{feature.accent}</p>
					</article>
				))}
			</div>
		</section>
	);
}
