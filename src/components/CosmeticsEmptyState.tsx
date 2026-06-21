interface CosmeticsEmptyStateProps {
	message: string;
	hint: string;
	variant?: "empty" | "complete";
}

export default function CosmeticsEmptyState({
	message,
	hint,
	variant = "empty",
}: CosmeticsEmptyStateProps) {
	if (variant === "complete") {
		return (
			<div className="w-full max-w-6xl rounded-3xl border border-emerald-500/25 bg-emerald-500/10 px-6 py-16 text-center">
				<p className="text-sm uppercase tracking-[0.18em] text-emerald-200 font-semibold">
					{message}
				</p>
				<p className="mt-2 text-emerald-100/75">{hint}</p>
			</div>
		);
	}

	return (
		<div className="w-full max-w-6xl rounded-3xl border border-dashed border-neutral-700 bg-neutral-950/45 px-6 py-16 text-center">
			<p className="text-sm uppercase tracking-[0.18em] text-neutral-400 font-semibold">
				{message}
			</p>
			<p className="mt-2 text-neutral-500">{hint}</p>
		</div>
	);
}
