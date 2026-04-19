import { FaChevronDown } from "react-icons/fa6";
import { faqs } from "./homeContent";

export default function FaqSection() {
	return (
		<section className="w-full px-4 sm:px-6 mb-20 sm:mb-24">
			<div className="mx-auto w-full max-w-6xl rounded-3xl border border-neutral-800/80 bg-[linear-gradient(145deg,rgba(8,11,13,0.95),rgba(20,27,25,0.9))] p-5 sm:p-8 lg:p-10 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
				<div className="mb-8 sm:mb-10 text-center">
					<span className="inline-flex items-center rounded-full border border-neutral-700 bg-black/35 px-4 py-1.5 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.16em] text-neutral-300">
						Need-to-Know
					</span>
					<h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-neutral-100">
						Frequently Asked Questions
					</h2>
					<p className="mt-3 text-sm sm:text-base text-neutral-400 max-w-3xl mx-auto">
						Everything you need before jumping into your next Labyrinthine session.
					</p>
				</div>

				<div className="space-y-3 sm:space-y-4">
					{faqs.map((faq) => (
						<details
							key={faq.question}
							className="group rounded-2xl border border-neutral-800 bg-black/35 transition-all duration-300 open:border-neutral-600 hover:border-neutral-700"
						>
							<summary className="list-none cursor-pointer px-4 sm:px-5 py-4 text-left flex items-start justify-between gap-4">
								<span className="text-sm sm:text-base font-bold uppercase tracking-[0.12em] text-neutral-100">
									{faq.question}
								</span>
								<span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-neutral-700 bg-neutral-900/70 text-neutral-400 transition-all duration-300 group-hover:text-neutral-200 group-open:rotate-180 group-open:text-neutral-100">
									<FaChevronDown className="h-3 w-3" />
								</span>
							</summary>

							<div className="px-4 sm:px-5 pb-4 sm:pb-5">
								<div className="border-t border-neutral-800 pt-3 sm:pt-4">
									<p className="text-sm sm:text-base text-neutral-400 leading-relaxed">
										{faq.answer}
									</p>
								</div>
							</div>
						</details>
					))}
				</div>
			</div>
		</section>
	);
}
