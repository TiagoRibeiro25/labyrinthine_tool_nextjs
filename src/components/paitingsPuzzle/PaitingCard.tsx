"use client";

import { getPaintingImageSrc } from "@/lib/paitings-puzzle";
import Image from "next/image";

export default function PaitingCard({
	paintingName,
	isGhost,
	className,
	actions,
}: {
	paintingName: string;
	isGhost?: boolean;
	className?: string;
	actions?: React.ReactNode;
}) {
	return (
		<div
			className={`relative w-full aspect-square rounded-2xl border border-neutral-800 bg-neutral-950/20 shadow-[0_18px_55px_rgba(0,0,0,0.5)] overflow-hidden ${
				isGhost ? "opacity-60" : "opacity-100"
			} ${className ?? ""}`}
		>
			<Image
				className="absolute inset-0 w-full h-full object-cover object-top select-none pointer-events-none"
				src={getPaintingImageSrc(paintingName)}
				alt={paintingName}
				width={400}
				height={400}
			/>

			{actions ? <div className="absolute top-2 right-2 z-10">{actions}</div> : null}

			<div className="absolute inset-x-0 bottom-0 bg-black/60 px-3 py-2">
				<p className="text-[11px] uppercase tracking-[0.14em] font-bold text-neutral-100 truncate">
					{paintingName}
				</p>
			</div>
		</div>
	);
}
