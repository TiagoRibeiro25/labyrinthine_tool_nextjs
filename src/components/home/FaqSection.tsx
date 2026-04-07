import { faqs } from "./homeContent";

export default function FaqSection() {
	return (
		<section className="w-full max-w-5xl mx-auto px-6 mb-24">
			<div className="text-center mb-10">
				<h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-neutral-100 mb-3">
					Frequently Asked Questions
				</h2>
				<p className="text-neutral-400">
					Everything you need before jumping into your next session.
				</p>
			</div>
			<div className="space-y-4">
				{faqs.map((faq) => (
					<details
						key={faq.question}
						className="group bg-black/45 border border-neutral-800 open:border-neutral-600 transition-colors"
					>
						<summary className="cursor-pointer list-none px-5 py-4 text-neutral-100 font-semibold tracking-wide uppercase text-sm sm:text-base flex items-center justify-between gap-4">
							{faq.question}
							<span className="text-neutral-500 group-open:rotate-45 transition-transform text-xl leading-none">
								+
							</span>
						</summary>
						<p className="px-5 pb-5 text-neutral-400 text-sm sm:text-base leading-relaxed">
							{faq.answer}
						</p>
					</details>
				))}
			</div>
		</section>
	);
}
