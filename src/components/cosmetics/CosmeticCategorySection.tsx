"use client";

import { memo, useCallback } from "react";
import { FaCheck } from "react-icons/fa6";
import type { CosmeticItem } from "../../lib/cosmetics";
import CosmeticCard from "./CosmeticCard";

export interface CosmeticCategorySectionProps {
	categoryName: string;
	filteredItems: CosmeticItem[];
	categoryUnlockedCount: number;
	catPercentage: number;
	isUnlocked: (id: number) => boolean;
	isLoading: (id: number) => boolean;
	onToggle: (id: number) => void;
	onToggleCategory: (items: CosmeticItem[], action: "unlock" | "lock") => void;
}

function CosmeticCategorySectionComponent({
	categoryName,
	filteredItems,
	categoryUnlockedCount,
	catPercentage,
	isUnlocked,
	isLoading,
	onToggle,
	onToggleCategory,
}: CosmeticCategorySectionProps) {
	const onUnlockAll = useCallback(
		() => onToggleCategory(filteredItems, "unlock"),
		[filteredItems, onToggleCategory]
	);
	const onLockAll = useCallback(
		() => onToggleCategory(filteredItems, "lock"),
		[filteredItems, onToggleCategory]
	);

	return (
		<section className="rounded-2xl border border-neutral-800/70 bg-neutral-950/50 overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
			<div className="flex flex-col gap-3 px-4 sm:px-5 py-4 border-b border-neutral-800/60 bg-neutral-900/40 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
				<div className="min-w-0 w-full sm:flex-1">
					<div className="flex flex-wrap items-center gap-2">
						<h2 className="text-sm sm:text-base font-black uppercase tracking-widest text-neutral-100 wrap-break-word">
							{categoryName}
						</h2>
						{catPercentage === 100 && (
							<span className="inline-flex items-center gap-1 rounded-full border border-teal-400/40 bg-teal-500/12 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.16em] text-teal-300">
								<FaCheck className="w-2 h-2" />
								Complete
							</span>
						)}
					</div>
					<p className="text-[11px] text-neutral-500 mt-0.5 uppercase tracking-[0.12em] font-semibold">
						{categoryUnlockedCount} / {filteredItems.length} in view &nbsp;·&nbsp;{" "}
						{catPercentage}% overall
					</p>
				</div>
				<div className="flex w-full items-center gap-2 sm:w-auto sm:shrink-0">
					<button
						type="button"
						onClick={onUnlockAll}
						className="flex-1 rounded-lg border border-teal-500/35 bg-teal-500/10 px-3 py-1.5 text-[10px] sm:flex-none sm:text-[11px] uppercase tracking-[0.14em] font-bold text-teal-200 hover:bg-teal-500/18 transition-colors"
					>
						Unlock All
					</button>
					<button
						type="button"
						onClick={onLockAll}
						className="flex-1 rounded-lg border border-rose-500/35 bg-rose-500/10 px-3 py-1.5 text-[10px] sm:flex-none sm:text-[11px] uppercase tracking-[0.14em] font-bold text-rose-200 hover:bg-rose-500/18 transition-colors"
					>
						Lock All
					</button>
				</div>
			</div>

			<div className="h-0.5 w-full bg-neutral-800/60">
				<div
					className="h-full bg-linear-to-r from-teal-500 to-cyan-400"
					style={{ width: `${catPercentage}%` }}
				/>
			</div>

			<div className="p-3 sm:p-4">
				<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2.5 sm:gap-3">
					{filteredItems.map((item) => (
						<CosmeticCard
							key={item.id}
							item={item}
							isUnlocked={isUnlocked(item.id)}
							isLoading={isLoading(item.id)}
							onToggle={onToggle}
						/>
					))}
				</div>
			</div>
		</section>
	);
}

const CosmeticCategorySection = memo(CosmeticCategorySectionComponent);
export default CosmeticCategorySection;
