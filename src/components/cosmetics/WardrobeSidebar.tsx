"use client";

import { memo, useEffect, useState } from "react";
import { useDebounce } from "use-debounce";
import { FaCheck, FaMagnifyingGlass, FaXmark } from "react-icons/fa6";
import { allTypes } from "../../lib/cosmetics";

type VisibilityFilter = "all" | "unlocked" | "locked";

export interface CategoryAnalyticsRow {
	categoryName: string;
	total: number;
	unlocked: number;
	missing: number;
	percentage: number;
}

export interface WardrobeSidebarProps {
	filterSearchQuery: string;
	resetKey: number;
	overallCompletion: number;
	totalUnlocked: number;
	totalCosmetics: number;
	totalMissing: number;
	completedCategories: number;
	categoryAnalytics: CategoryAnalyticsRow[];
	activeFilter: string;
	activeTypeFilter: string;
	visibilityFilter: VisibilityFilter;
	hasActiveFilters: boolean;
	onSearchQueryChange: (query: string) => void;
	onActiveFilterChange: (filter: string) => void;
	onActiveTypeFilterChange: (type: string) => void;
	onVisibilityFilterChange: (filter: VisibilityFilter) => void;
	onResetFilters: () => void;
}

const typeFilterOptions = ["All", ...allTypes];

function WardrobeSidebarComponent({
	filterSearchQuery,
	resetKey,
	overallCompletion,
	totalUnlocked,
	totalCosmetics,
	totalMissing,
	completedCategories,
	categoryAnalytics,
	activeFilter,
	activeTypeFilter,
	visibilityFilter,
	hasActiveFilters,
	onSearchQueryChange,
	onActiveFilterChange,
	onActiveTypeFilterChange,
	onVisibilityFilterChange,
	onResetFilters,
}: WardrobeSidebarProps) {
	const [searchQuery, setSearchQuery] = useState<string>(filterSearchQuery);
	const [debouncedSearchQuery] = useDebounce(searchQuery, 250);

	useEffect(() => {
		onSearchQueryChange(debouncedSearchQuery);
	}, [debouncedSearchQuery, onSearchQueryChange]);

	useEffect(() => {
		setSearchQuery("");
	}, [resetKey]);

	return (
		<div className="flex flex-col gap-5 h-full">
			<div className="grid grid-cols-2 gap-2.5">
				<div className="rounded-xl border border-teal-500/20 bg-teal-500/8 p-3">
					<p className="text-[9px] uppercase tracking-[0.2em] text-teal-300/70 font-bold">
						Completion
					</p>
					<p className="text-2xl font-black text-teal-300 mt-0.5 leading-none">
						{overallCompletion}%
					</p>
					<div className="mt-2 h-1 w-full rounded-full bg-black/35 overflow-hidden">
						<div
							className="h-full bg-linear-to-r from-teal-400 to-cyan-400"
							style={{ width: `${overallCompletion}%` }}
						/>
					</div>
				</div>
				<div className="rounded-xl border border-sky-500/20 bg-sky-500/8 p-3">
					<p className="text-[9px] uppercase tracking-[0.2em] text-sky-300/70 font-bold">
						Unlocked
					</p>
					<p className="text-2xl font-black text-sky-300 mt-0.5 leading-none">
						{totalUnlocked}
					</p>
					<p className="text-[10px] text-sky-100/50 mt-1">of {totalCosmetics}</p>
				</div>
				<div className="rounded-xl border border-amber-500/20 bg-amber-500/8 p-3">
					<p className="text-[9px] uppercase tracking-[0.2em] text-amber-300/70 font-bold">
						Missing
					</p>
					<p className="text-2xl font-black text-amber-300 mt-0.5 leading-none">
						{totalMissing}
					</p>
					<p className="text-[10px] text-amber-100/50 mt-1">to discover</p>
				</div>
				<div className="rounded-xl border border-violet-500/20 bg-violet-500/8 p-3">
					<p className="text-[9px] uppercase tracking-[0.2em] text-violet-300/70 font-bold">
						Done
					</p>
					<p className="text-2xl font-black text-violet-300 mt-0.5 leading-none">
						{completedCategories}
					</p>
					<p className="text-[10px] text-violet-100/50 mt-1">
						of {categoryAnalytics.length} cats
					</p>
				</div>
			</div>

			<div className="h-px bg-neutral-800/70" />

			<div className="flex flex-col gap-1.5">
				<label
					htmlFor="wardrobe-search"
					className="text-[9px] uppercase tracking-[0.2em] text-neutral-500 font-bold"
				>
					Search
				</label>
				<div className="relative">
					<FaMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 w-3.5 h-3.5" />
					<input
						id="wardrobe-search"
						type="text"
						placeholder="Type a cosmetic name…"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="w-full rounded-xl border border-neutral-700/80 bg-neutral-900/70 py-2.5 pl-9 pr-8 text-xs text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-teal-500/60"
					/>
					{searchQuery && (
						<button
							type="button"
							onClick={() => setSearchQuery("")}
							className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-200 transition-colors"
						>
							<FaXmark className="w-3 h-3" />
						</button>
					)}
				</div>
			</div>

			<div className="flex flex-col gap-1.5">
				<p className="text-[9px] uppercase tracking-[0.2em] text-neutral-500 font-bold">
					Status
				</p>
				<div className="flex flex-col gap-1.5">
					{(
						[
							{ key: "all", label: "All Items" },
							{ key: "unlocked", label: "Unlocked" },
							{ key: "locked", label: "Locked" },
						] as Array<{ key: VisibilityFilter; label: string }>
					).map((opt) => (
						<button
							key={opt.key}
							type="button"
							onClick={() => onVisibilityFilterChange(opt.key)}
							className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-left ${
								visibilityFilter === opt.key
									? "bg-teal-500/15 border border-teal-400/40 text-teal-200"
									: "border border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50"
							}`}
						>
							<span
								className={`w-1.5 h-1.5 rounded-full shrink-0 ${
									visibilityFilter === opt.key ? "bg-teal-400" : "bg-neutral-700"
								}`}
							/>
							{opt.label}
						</button>
					))}
				</div>
			</div>

			<div className="flex flex-col gap-1.5">
				<p className="text-[9px] uppercase tracking-[0.2em] text-neutral-500 font-bold">
					Type
				</p>
				<div className="flex flex-wrap gap-1.5">
					{typeFilterOptions.map((opt) => (
						<button
							key={opt}
							type="button"
							onClick={() => onActiveTypeFilterChange(opt)}
							className={`rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] border ${
								activeTypeFilter === opt
									? "bg-cyan-500/15 border-cyan-400/40 text-cyan-200"
									: "border-neutral-800 text-neutral-500 hover:text-neutral-200 hover:border-neutral-600"
							}`}
						>
							{opt}
						</button>
					))}
				</div>
			</div>

			<div className="h-px bg-neutral-800/70" />

			<div className="flex flex-col gap-1">
				<p className="text-[9px] uppercase tracking-[0.2em] text-neutral-500 font-bold mb-1">
					Categories
				</p>

				<button
					type="button"
					onClick={() => onActiveFilterChange("All")}
					className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-left group ${
						activeFilter === "All"
							? "bg-teal-500/15 border border-teal-400/40 text-teal-200"
							: "border border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50"
					}`}
				>
					<span>All Categories</span>
					<span
						className={`text-[10px] font-black tabular-nums ${
							activeFilter === "All" ? "text-teal-300" : "text-neutral-600"
						}`}
					>
						{totalCosmetics}
					</span>
				</button>

				{categoryAnalytics.map((cat) => (
					<button
						key={cat.categoryName}
						type="button"
						onClick={() => onActiveFilterChange(cat.categoryName)}
						className={`group flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-left ${
							activeFilter === cat.categoryName
								? "bg-teal-500/15 border border-teal-400/40 text-teal-200"
								: "border border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50"
						}`}
					>
						<div className="flex-1 min-w-0">
							<div className="flex items-center justify-between gap-1">
								<span className="truncate">{cat.categoryName}</span>
								<span
									className={`text-[10px] font-black tabular-nums shrink-0 ${
										activeFilter === cat.categoryName
											? "text-teal-300"
											: "text-neutral-600 group-hover:text-neutral-400"
									}`}
								>
									{cat.unlocked}/{cat.total}
								</span>
							</div>
							<div className="mt-1 h-0.5 w-full rounded-full bg-neutral-800 overflow-hidden">
								<div
									className={`h-full rounded-full ${
										cat.percentage === 100
											? "bg-teal-400"
											: cat.percentage >= 80
												? "bg-amber-400"
												: "bg-neutral-600"
									}`}
									style={{ width: `${cat.percentage}%` }}
								/>
							</div>
						</div>
						{cat.percentage === 100 && (
							<FaCheck className="w-2.5 h-2.5 text-teal-400 shrink-0" />
						)}
					</button>
				))}
			</div>

			{hasActiveFilters && (
				<button
					type="button"
					onClick={onResetFilters}
					className="mt-auto flex items-center justify-center gap-2 rounded-xl border border-neutral-700/70 bg-neutral-900/60 px-4 py-2.5 text-[11px] uppercase tracking-[0.16em] font-bold text-neutral-300 hover:border-rose-500/50 hover:text-rose-300 hover:bg-rose-950/20 transition-colors"
				>
					<FaXmark className="w-3 h-3" />
					Reset Filters
				</button>
			)}
		</div>
	);
}

const WardrobeSidebar = memo(WardrobeSidebarComponent);
export default WardrobeSidebar;
