import { quickFacts, runPlan } from "./homeContent";

export default function ProgressLoopSection() {
	return (
		<section className="w-full px-4 sm:px-6 mb-20 sm:mb-24">
			<div className="mx-auto w-full max-w-6xl rounded-3xl border border-neutral-800/80 bg-[linear-gradient(145deg,rgba(8,11,13,0.95),rgba(20,27,25,0.9))] p-5 sm:p-8 lg:p-10 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
				<div className="mb-8 sm:mb-10 text-center">
					<span className="inline-flex items-center rounded-full border border-neutral-700 bg-black/35 px-4 py-1.5 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.16em] text-neutral-300">
						Run Strategy
					</span>
					<h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight uppercase text-neutral-100">
						Your Progress Loop
					</h2>
					<p className="mt-3 max-w-3xl mx-auto text-sm sm:text-base text-neutral-400">
						Follow a repeatable flow from setup to review so each session pushes your
						collection forward.
					</p>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-5 sm:gap-6">
					<div className="rounded-2xl border border-neutral-800 bg-black/35 p-5 sm:p-6">
						<h3 className="text-xl sm:text-2xl font-black uppercase tracking-wide text-neutral-100 mb-6">
							Session Timeline
						</h3>

						<div className="space-y-5">
							{runPlan.map((item, index) => (
								<div key={item.step} className="relative pl-12">
									{index < runPlan.length - 1 && (
										<div className="absolute left-4.5 top-10 h-[calc(100%+10px)] w-px bg-neutral-700/80" />
									)}

									<div className="absolute left-0 top-0 inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-700 bg-neutral-900 text-sm font-black text-neutral-100">
										{item.step}
									</div>

									<div className="rounded-xl border border-neutral-800 bg-black/45 px-4 py-3">
										<h4 className="text-sm sm:text-base font-black uppercase tracking-[0.12em] text-neutral-100">
											{item.title}
										</h4>
										<p className="mt-2 text-sm text-neutral-400 leading-relaxed">
											{item.text}
										</p>
									</div>
								</div>
							))}
						</div>
					</div>

					<div className="rounded-2xl border border-neutral-800 bg-black/35 p-5 sm:p-6">
						<h3 className="text-xl sm:text-2xl font-black uppercase tracking-wide text-neutral-100 mb-5">
							Quick Facts
						</h3>

						<ul className="space-y-3">
							{quickFacts.map((fact) => (
								<li
									key={fact}
									className="group flex items-start gap-3 rounded-xl border border-neutral-800 bg-black/45 px-3 py-3 transition-colors duration-300 hover:border-neutral-700"
								>
									<span className="mt-1.5 inline-flex h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
									<span className="text-sm sm:text-base text-neutral-300 leading-relaxed">
										{fact}
									</span>
								</li>
							))}
						</ul>

						<div className="mt-5 rounded-xl border border-neutral-700/80 bg-neutral-900/50 p-4">
							<p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.14em] text-neutral-400">
								Pro tip
							</p>
							<p className="mt-2 text-sm text-neutral-300 leading-relaxed">
								Update your profile after every session so your next objective is always
								clear for you and your friends.
							</p>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
