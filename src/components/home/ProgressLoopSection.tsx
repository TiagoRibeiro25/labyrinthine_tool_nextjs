import { quickFacts, runPlan } from "./homeContent";

export default function ProgressLoopSection() {
	return (
		<section className="w-full max-w-6xl mx-auto px-6 mb-24 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8 items-start">
			<div className="bg-black/50 border border-neutral-800 p-6 sm:p-8">
				<h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wide text-neutral-100 mb-6">
					Your Progress Loop
				</h2>
				<div className="space-y-5">
					{runPlan.map((item) => (
						<div key={item.step} className="flex gap-4 border-l border-neutral-700 pl-4">
							<span className="text-lg font-black text-neutral-300 leading-none mt-1">
								{item.step}
							</span>
							<div>
								<h3 className="font-bold text-neutral-100 uppercase tracking-wide mb-1">
									{item.title}
								</h3>
								<p className="text-sm text-neutral-400 leading-relaxed">{item.text}</p>
							</div>
						</div>
					))}
				</div>
			</div>

			<div className="bg-black/40 border border-neutral-800 p-6 sm:p-8">
				<h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wide text-neutral-100 mb-6">
					Quick Facts
				</h2>
				<ul className="space-y-4">
					{quickFacts.map((fact) => (
						<li
							key={fact}
							className="flex items-start gap-3 text-neutral-300 text-sm sm:text-base"
						>
							<span className="mt-2 h-1.5 w-1.5 rounded-full bg-neutral-400 shrink-0" />
							<span>{fact}</span>
						</li>
					))}
				</ul>
			</div>
		</section>
	);
}
