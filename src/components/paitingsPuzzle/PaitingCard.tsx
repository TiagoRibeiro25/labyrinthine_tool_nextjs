"use client";

import { getPaintingImageSrc } from "@/lib/paitings-puzzle";
import Image from "next/image";

type PaitingCardVariant = "default" | "frame";

export default function PaitingCard({
	paintingName,
	isGhost,
	className,
	actions,
	variant = "default",
}: {
	paintingName: string;
	isGhost?: boolean;
	className?: string;
	actions?: React.ReactNode;
	variant?: PaitingCardVariant;
}) {
	const isFrame = variant === "frame";

	return (
		<div
			className={`group relative w-full aspect-square overflow-hidden transition-all duration-300 ${
				isFrame
					? "rounded-xl border-2 border-amber-900/40 bg-amber-950/20 shadow-[inset_0_0_0_1px_rgba(251,191,36,0.08),0_16px_40px_rgba(0,0,0,0.45)]"
					: "rounded-2xl border border-neutral-800 bg-neutral-950/30 shadow-[0_12px_36px_rgba(0,0,0,0.4)] hover:border-neutral-600 hover:shadow-[0_16px_44px_rgba(0,0,0,0.5)]"
			} ${isGhost ? "opacity-55 scale-[0.98]" : "opacity-100"} ${className ?? ""}`}
		>
			{isFrame ? (
				<div
					aria-hidden
					className="pointer-events-none absolute inset-2 rounded-lg border border-amber-500/15"
				/>
			) : null}

			<Image
				className="absolute inset-0 h-full w-full object-cover object-top select-none pointer-events-none transition-transform duration-500 group-hover:scale-[1.03]"
				src={getPaintingImageSrc(paintingName)}
				alt={paintingName}
				width={400}
				height={400}
			/>

			<div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/75 via-black/10 to-transparent" />

			{actions ? <div className="absolute top-2 right-2 z-10">{actions}</div> : null}

			<div className="absolute inset-x-0 bottom-0 z-10 px-3 py-2.5">
				<p className="truncate text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-100 sm:text-[11px]">
					{paintingName}
				</p>
			</div>
		</div>
	);
}
