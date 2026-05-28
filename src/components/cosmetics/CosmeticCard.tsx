"use client";

import { memo } from "react";
import Image from "next/image";
import Link from "next/link";
import { FaCheck, FaLock, FaMagnifyingGlass, FaUnlockKeyhole } from "react-icons/fa6";
import type { CosmeticItem } from "../../lib/cosmetics";

export interface CosmeticCardProps {
	item: CosmeticItem;
	isUnlocked: boolean;
	isLoading: boolean;
	onToggle: (id: number) => void;
}

function CosmeticCardComponent({
	item,
	isUnlocked,
	isLoading,
	onToggle,
}: CosmeticCardProps) {
	return (
		<div
			onClick={() => {
				if (!isLoading) onToggle(item.id);
			}}
			className={`group relative flex flex-col overflow-hidden rounded-xl border cursor-pointer transition-[border-color,box-shadow,opacity] duration-200 ${
				isUnlocked
					? "border-teal-400/40 bg-teal-500/6 hover:border-teal-300/70 hover:shadow-[0_8px_24px_rgba(45,212,191,0.15)]"
					: "border-neutral-700/70 bg-neutral-900/60 hover:border-neutral-500/70 hover:shadow-[0_8px_20px_rgba(0,0,0,0.3)]"
			} ${isLoading ? "pointer-events-none opacity-60" : ""}`}
		>
			<div
				className={`absolute inset-x-0 top-0 h-0.5 ${
					isUnlocked ? "bg-teal-400" : "bg-neutral-700/50"
				}`}
			/>

			<Link
				href={`/missing-cosmetics?cosmeticId=${item.id}`}
				onClick={(e) => e.stopPropagation()}
				title="Find friends missing this"
				className="absolute left-1.5 top-1.5 z-20 rounded-lg border border-neutral-700/80 bg-black/60 p-1.5 text-neutral-400 opacity-0 transition-opacity group-hover:opacity-100 hover:border-teal-400/60 hover:text-teal-200"
			>
				<FaMagnifyingGlass className="w-2.5 h-2.5" />
			</Link>

			<div
				className={`absolute right-1.5 top-1.5 z-20 rounded-lg border p-1.5 ${
					isUnlocked
						? "border-teal-400/50 bg-teal-500/20 text-teal-100"
						: "border-neutral-700/80 bg-black/60 text-neutral-400"
				}`}
			>
				{isLoading ? (
					<span className="block h-2.5 w-2.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
				) : isUnlocked ? (
					<FaUnlockKeyhole className="w-2.5 h-2.5" />
				) : (
					<FaLock className="w-2.5 h-2.5" />
				)}
			</div>

			<div className="relative aspect-square w-full bg-neutral-950/60 p-3">
				<div
					className={`relative h-full w-full ${
						isUnlocked
							? "drop-shadow-[0_0_10px_rgba(186,230,253,0.35)]"
							: "grayscale opacity-55 group-hover:grayscale-0 group-hover:opacity-90"
					}`}
				>
					<Image
						src={`/images/cosmetics/${item.id}.png`}
						alt={item.name}
						fill
						className="object-contain"
						sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 18vw"
						loading="lazy"
					/>
				</div>
			</div>

			<div className="flex flex-col items-center justify-center border-t border-neutral-800/60 bg-neutral-900/70 px-2.5 py-2.5 min-h-14">
				<p className="line-clamp-2 text-center text-[10px] sm:text-[11px] uppercase tracking-[0.11em] font-bold text-neutral-200 leading-snug">
					{item.name}
				</p>
				<p
					className={`mt-1 flex items-center gap-1 text-[9px] uppercase tracking-[0.14em] font-semibold ${
						isUnlocked ? "text-teal-400/90" : "invisible"
					}`}
				>
					<FaCheck className="w-2 h-2" />
					Unlocked
				</p>
			</div>
		</div>
	);
}

const CosmeticCard = memo(CosmeticCardComponent);
export default CosmeticCard;
