"use client";

import { useDeferredValue, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
	FaCheck,
	FaFilter,
	FaLock,
	FaMagnifyingGlass,
	FaSliders,
	FaUnlockKeyhole,
	FaXmark,
} from "react-icons/fa6";
import { allTypes, categories } from "../lib/cosmetics";
import { useApi } from "../hooks/useApi";
import { useToast } from "../hooks/useToast";

interface CosmeticsTrackerProps {
	initialUnlockedIds: number[];
}

type VisibilityFilter = "all" | "unlocked" | "locked";

export default function CosmeticsTracker({ initialUnlockedIds }: CosmeticsTrackerProps) {
	const [unlockedIds, setUnlockedIds] = useState<Set<number>>(
		new Set(initialUnlockedIds)
	);
	const [activeFilter, setActiveFilter] = useState<string>("All");
	const [activeTypeFilter, setActiveTypeFilter] = useState<string>("All");
	const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>("all");
	const [searchQuery, setSearchQuery] = useState<string>("");
	const deferredSearchQuery = useDeferredValue(searchQuery);
	const [loadingIds, setLoadingIds] = useState<Set<number>>(new Set());
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const { execute } = useApi();
	const { success, error: toastError } = useToast();

	const toggleCosmetic = async (id: number) => {
		if (loadingIds.has(id)) return;

		const newUnlockedIds = new Set(unlockedIds);
		const isUnlocking = !newUnlockedIds.has(id);

		if (isUnlocking) {
			newUnlockedIds.add(id);
		} else {
			newUnlockedIds.delete(id);
		}

		setUnlockedIds(newUnlockedIds);
		setLoadingIds((prev) => new Set(prev).add(id));

		try {
			await execute("/api/cosmetics/toggle", {
				method: "POST",
				body: JSON.stringify({ cosmeticId: id }),
			});
		} catch (error) {
			console.error(error);
			const revertedIds = new Set(unlockedIds);
			if (isUnlocking) revertedIds.delete(id);
			else revertedIds.add(id);
			setUnlockedIds(revertedIds);
		} finally {
			setLoadingIds((prev) => {
				const updated = new Set(prev);
				updated.delete(id);
				return updated;
			});
		}
	};

	const toggleCategory = async (
		items: { id: number; name: string }[],
		action: "unlock" | "lock"
	) => {
		const itemIds = items.map((i) => i.id);
		const originalUnlockedIds = new Set(unlockedIds);
		const newUnlockedIds = new Set(unlockedIds);

		if (action === "unlock") {
			itemIds.forEach((id) => newUnlockedIds.add(id));
		} else {
			itemIds.forEach((id) => newUnlockedIds.delete(id));
		}

		setUnlockedIds(newUnlockedIds);
		setLoadingIds((prev) => new Set([...prev, ...itemIds]));

		try {
			await execute("/api/cosmetics/toggle", {
				method: "POST",
				body: JSON.stringify({ cosmeticIds: itemIds, action }),
			});

			success(
				action === "unlock" ? "Category unlocked" : "Category locked",
				`${itemIds.length} cosmetic${itemIds.length === 1 ? "" : "s"} updated.`
			);
		} catch (error) {
			console.error(error);
			setUnlockedIds(originalUnlockedIds);

			const message =
				error instanceof Error ? error.message : "Failed to update this category.";
			toastError("Bulk update failed", message);
		} finally {
			setLoadingIds((prev) => {
				const updated = new Set(prev);
				itemIds.forEach((id) => updated.delete(id));
				return updated;
			});
		}
	};

	// ── Analytics ──────────────────────────────────────────────────────────────

	const categoryAnalytics = useMemo(() => {
		return Object.entries(categories)
			.map(([categoryName, items]) => {
				const total = items.length;
				const unlocked = items.filter((item) => unlockedIds.has(item.id)).length;
				const missing = total - unlocked;
				const percentage = total > 0 ? Math.round((unlocked / total) * 100) : 0;

				return { categoryName, total, unlocked, missing, percentage };
			})
			.sort((a, b) => {
				if (b.percentage !== a.percentage) return b.percentage - a.percentage;
				return b.unlocked - a.unlocked;
			});
	}, [unlockedIds]);

	const totalCosmetics = useMemo(() => Object.values(categories).flat().length, []);
	const totalUnlocked = unlockedIds.size;
	const totalMissing = totalCosmetics - totalUnlocked;
	const overallCompletion = totalCosmetics
		? Math.round((totalUnlocked / totalCosmetics) * 100)
		: 0;
	const completedCategories = categoryAnalytics.filter((c) => c.missing === 0).length;

	// ── Filtering ──────────────────────────────────────────────────────────────

	const typeFilterOptions = ["All", ...allTypes];
	const normalizedSearchQuery = deferredSearchQuery.trim().toLowerCase();

	const renderableCategories = useMemo(() => {
		return Object.entries(categories)
			.map(([categoryName, items]) => {
				if (activeFilter !== "All" && activeFilter !== categoryName) return null;

				const filteredItems = items.filter((item) => {
					const matchesType =
						activeTypeFilter === "All" || item.type === activeTypeFilter;
					const matchesSearch =
						normalizedSearchQuery.length === 0 ||
						item.name.toLowerCase().includes(normalizedSearchQuery);
					const isUnlocked = unlockedIds.has(item.id);
					const matchesVisibility =
						visibilityFilter === "all" ||
						(visibilityFilter === "unlocked" ? isUnlocked : !isUnlocked);

					return matchesType && matchesSearch && matchesVisibility;
				});

				if (filteredItems.length === 0) return null;

				const categoryUnlockedCount = filteredItems.filter((item) =>
					unlockedIds.has(item.id)
				).length;

				return { categoryName, filteredItems, categoryUnlockedCount };
			})
			.filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
	}, [activeFilter, activeTypeFilter, normalizedSearchQuery, unlockedIds, visibilityFilter]);

	const visibleItemCount = useMemo(
		() => renderableCategories.reduce((total, cat) => total + cat.filteredItems.length, 0),
		[renderableCategories]
	);

	const hasActiveFilters =
		activeFilter !== "All" ||
		activeTypeFilter !== "All" ||
		visibilityFilter !== "all" ||
		searchQuery.trim().length > 0;

	const resetFilters = () => {
		setSearchQuery("");
		setActiveFilter("All");
		setActiveTypeFilter("All");
		setVisibilityFilter("all");
	};

	// ── Sidebar Content (plain JSX — not a nested component, or the search input loses focus on each keystroke)
	const sidebarContent = (
		<div className="flex flex-col gap-5 h-full">

			{/* Stats */}
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
							className="h-full bg-linear-to-r from-teal-400 to-cyan-400 transition-all duration-500"
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

			{/* Divider */}
			<div className="h-px bg-neutral-800/70" />

			{/* Search */}
			<div className="flex flex-col gap-1.5">
				<label className="text-[9px] uppercase tracking-[0.2em] text-neutral-500 font-bold">
					Search
				</label>
				<div className="relative">
					<FaMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 w-3.5 h-3.5" />
					<input
						type="text"
						placeholder="Type a cosmetic name…"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="w-full rounded-xl border border-neutral-700/80 bg-neutral-900/70 py-2.5 pl-9 pr-8 text-xs text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-teal-500/60 transition-colors"
					/>
					{searchQuery && (
						<button
							onClick={() => setSearchQuery("")}
							className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-200 transition-colors"
						>
							<FaXmark className="w-3 h-3" />
						</button>
					)}
				</div>
			</div>

			{/* Status Filter */}
			<div className="flex flex-col gap-1.5">
				<label className="text-[9px] uppercase tracking-[0.2em] text-neutral-500 font-bold">
					Status
				</label>
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
							onClick={() => setVisibilityFilter(opt.key)}
							className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition-all text-left ${
								visibilityFilter === opt.key
									? "bg-teal-500/15 border border-teal-400/40 text-teal-200"
									: "border border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50"
							}`}
						>
							<span
								className={`w-1.5 h-1.5 rounded-full shrink-0 ${
									visibilityFilter === opt.key
										? "bg-teal-400"
										: "bg-neutral-700"
								}`}
							/>
							{opt.label}
						</button>
					))}
				</div>
			</div>

			{/* Type Filter */}
			<div className="flex flex-col gap-1.5">
				<label className="text-[9px] uppercase tracking-[0.2em] text-neutral-500 font-bold">
					Type
				</label>
				<div className="flex flex-wrap gap-1.5">
					{typeFilterOptions.map((opt) => (
						<button
							key={opt}
							onClick={() => setActiveTypeFilter(opt)}
							className={`rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] transition-all border ${
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

			{/* Divider */}
			<div className="h-px bg-neutral-800/70" />

			{/* Category List */}
			<div className="flex flex-col gap-1">
				<p className="text-[9px] uppercase tracking-[0.2em] text-neutral-500 font-bold mb-1">
					Categories
				</p>

				{/* All categories button */}
				<button
					onClick={() => setActiveFilter("All")}
					className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition-all text-left group ${
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
						onClick={() => setActiveFilter(cat.categoryName)}
						className={`group flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition-all text-left ${
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
									className={`h-full rounded-full transition-all duration-300 ${
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

			{/* Reset */}
			{hasActiveFilters && (
				<button
					onClick={resetFilters}
					className="mt-auto flex items-center justify-center gap-2 rounded-xl border border-neutral-700/70 bg-neutral-900/60 px-4 py-2.5 text-[11px] uppercase tracking-[0.16em] font-bold text-neutral-300 hover:border-rose-500/50 hover:text-rose-300 hover:bg-rose-950/20 transition-all"
				>
					<FaXmark className="w-3 h-3" />
					Reset Filters
				</button>
			)}
		</div>
	);

	// ── Render ─────────────────────────────────────────────────────────────────

	return (
		<div className="w-full flex flex-col" style={{ minHeight: "calc(100vh - 180px)" }}>

			{/* Mobile filter toggle */}
			<div className="lg:hidden mb-4 flex items-center justify-between gap-3">
				<button
					onClick={() => setSidebarOpen(true)}
					className="inline-flex items-center gap-2 rounded-xl border border-neutral-700/80 bg-neutral-900/70 px-4 py-2.5 text-xs uppercase tracking-[0.18em] font-bold text-neutral-300 hover:border-teal-500/50 hover:text-teal-200 transition-all"
				>
					<FaSliders className="w-3.5 h-3.5" />
					Filters
					{hasActiveFilters && (
						<span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-teal-500 text-[9px] font-black text-black">
							!
						</span>
					)}
				</button>
				<p className="text-xs text-neutral-500 uppercase tracking-[0.16em] font-semibold">
					{visibleItemCount} item{visibleItemCount !== 1 ? "s" : ""}
				</p>
			</div>

			{/* Mobile sidebar drawer */}
			{sidebarOpen && (
				<div className="lg:hidden fixed inset-0 z-50 flex">
					{/* Backdrop */}
					<div
						className="absolute inset-0 bg-black/70 backdrop-blur-sm"
						onClick={() => setSidebarOpen(false)}
					/>
					{/* Drawer */}
					<aside className="relative w-72 max-w-[85vw] h-full bg-neutral-950 border-r border-neutral-800/80 flex flex-col overflow-y-auto p-5">
						<div className="flex items-center justify-between mb-5">
							<div className="flex items-center gap-2">
								<FaFilter className="w-3.5 h-3.5 text-teal-300" />
								<p className="text-xs uppercase tracking-[0.2em] font-bold text-neutral-200">
									Filters
								</p>
							</div>
							<button
								onClick={() => setSidebarOpen(false)}
								className="rounded-lg border border-neutral-700 bg-neutral-900 p-2 text-neutral-400 hover:text-neutral-100 transition-colors"
							>
								<FaXmark className="w-3.5 h-3.5" />
							</button>
						</div>
						{sidebarContent}
					</aside>
				</div>
			)}

			{/* Main two-panel layout */}
			<div className="flex gap-5 lg:gap-6 flex-1">

				{/* Left sidebar — desktop only */}
				<aside className="hidden lg:flex flex-col w-64 xl:w-72 shrink-0 self-start">
					<div className="sticky top-6 rounded-2xl border border-neutral-800/80 bg-neutral-950/75 backdrop-blur-xl p-5 shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
						{/* Sidebar header */}
						<div className="flex items-center gap-2 mb-5">
							<FaSliders className="w-3.5 h-3.5 text-teal-300" />
							<p className="text-[10px] uppercase tracking-[0.22em] font-bold text-neutral-300">
								Wardrobe Controls
							</p>
						</div>
						{sidebarContent}
					</div>
				</aside>

				{/* Right content area */}
				<div className="flex-1 min-w-0 flex flex-col gap-5">

					{/* Content header bar */}
					<div className="flex items-center justify-between gap-3 flex-wrap">
						<div className="flex items-center gap-3 flex-wrap">
							<p className="text-xs text-neutral-400 uppercase tracking-[0.18em] font-semibold">
								<span className="text-neutral-100 font-black">{visibleItemCount}</span>{" "}
								item{visibleItemCount !== 1 ? "s" : ""}
							</p>

							{/* Active filter chips */}
							{activeFilter !== "All" && (
								<button
									onClick={() => setActiveFilter("All")}
									className="inline-flex items-center gap-1.5 rounded-full border border-teal-400/40 bg-teal-500/12 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-teal-200 hover:bg-teal-500/20 transition-colors"
								>
									{activeFilter}
									<FaXmark className="w-2.5 h-2.5" />
								</button>
							)}
							{activeTypeFilter !== "All" && (
								<button
									onClick={() => setActiveTypeFilter("All")}
									className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/40 bg-cyan-500/12 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-200 hover:bg-cyan-500/20 transition-colors"
								>
									{activeTypeFilter}
									<FaXmark className="w-2.5 h-2.5" />
								</button>
							)}
							{visibilityFilter !== "all" && (
								<button
									onClick={() => setVisibilityFilter("all")}
									className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/40 bg-sky-500/12 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-sky-200 hover:bg-sky-500/20 transition-colors"
								>
									{visibilityFilter === "unlocked" ? "Unlocked" : "Locked"}
									<FaXmark className="w-2.5 h-2.5" />
								</button>
							)}
							{searchQuery.trim().length > 0 && (
								<button
									onClick={() => setSearchQuery("")}
									className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/40 bg-violet-500/12 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-violet-200 hover:bg-violet-500/20 transition-colors"
								>
									&ldquo;{searchQuery.trim().slice(0, 20)}&rdquo;
									<FaXmark className="w-2.5 h-2.5" />
								</button>
							)}
						</div>

						{hasActiveFilters && (
							<button
								onClick={resetFilters}
								className="text-[10px] uppercase tracking-[0.16em] font-bold text-neutral-500 hover:text-rose-300 transition-colors"
							>
								Clear all
							</button>
						)}
					</div>

					{/* Empty state */}
					{visibleItemCount === 0 ? (
						<div className="flex-1 rounded-2xl border border-dashed border-neutral-700/60 bg-neutral-950/30 flex flex-col items-center justify-center py-24 px-6 text-center">
							<div className="w-12 h-12 rounded-2xl border border-neutral-700 bg-neutral-900/60 flex items-center justify-center mb-4">
								<FaMagnifyingGlass className="w-5 h-5 text-neutral-600" />
							</div>
							<p className="text-sm uppercase tracking-[0.18em] text-neutral-400 font-bold">
								No matches
							</p>
							<p className="text-neutral-600 mt-2 text-sm max-w-xs">
								Try adjusting your filters or search with a broader term.
							</p>
							<button
								onClick={resetFilters}
								className="mt-5 rounded-xl border border-neutral-700 bg-neutral-900/60 px-4 py-2 text-xs uppercase tracking-[0.16em] font-bold text-neutral-300 hover:border-teal-500/50 hover:text-teal-200 transition-all"
							>
								Reset Filters
							</button>
						</div>
					) : (
						<div className="space-y-6">
							{renderableCategories.map(
								({ categoryName, filteredItems, categoryUnlockedCount }) => {
									const catData = categoryAnalytics.find(
										(c) => c.categoryName === categoryName
									);
									const catPercentage = catData?.percentage ?? 0;

									return (
										<section
											key={categoryName}
											className="rounded-2xl border border-neutral-800/70 bg-neutral-950/50 overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
										>
											{/* Category header */}
											<div className="flex flex-col gap-3 px-4 sm:px-5 py-4 border-b border-neutral-800/60 bg-neutral-900/40 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
												<div className="min-w-0 w-full sm:flex-1">
													<div className="flex flex-wrap items-center gap-2">
														<h2 className="text-sm sm:text-base font-black uppercase tracking-[0.1em] text-neutral-100 break-words">
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
														{categoryUnlockedCount} / {filteredItems.length}{" "}
														in view &nbsp;·&nbsp; {catPercentage}% overall
													</p>
												</div>
												<div className="flex w-full items-center gap-2 sm:w-auto sm:shrink-0">
													<button
														onClick={() => toggleCategory(filteredItems, "unlock")}
														className="flex-1 rounded-lg border border-teal-500/35 bg-teal-500/10 px-3 py-1.5 text-[10px] sm:flex-none sm:text-[11px] uppercase tracking-[0.14em] font-bold text-teal-200 hover:bg-teal-500/18 transition-colors"
													>
														Unlock All
													</button>
													<button
														onClick={() => toggleCategory(filteredItems, "lock")}
														className="flex-1 rounded-lg border border-rose-500/35 bg-rose-500/10 px-3 py-1.5 text-[10px] sm:flex-none sm:text-[11px] uppercase tracking-[0.14em] font-bold text-rose-200 hover:bg-rose-500/18 transition-colors"
													>
														Lock All
													</button>
												</div>
											</div>

											{/* Progress bar */}
											<div className="h-0.5 w-full bg-neutral-800/60">
												<div
													className="h-full bg-linear-to-r from-teal-500 to-cyan-400 transition-all duration-500"
													style={{ width: `${catPercentage}%` }}
												/>
											</div>

											{/* Item grid */}
											<div className="p-3 sm:p-4">
												<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2.5 sm:gap-3">
													{filteredItems.map((item) => {
														const isUnlocked = unlockedIds.has(item.id);
														const isLoading = loadingIds.has(item.id);

														return (
															<div
																key={item.id}
																onClick={() => {
																	if (!isLoading) toggleCosmetic(item.id);
																}}
																className={`group relative flex flex-col overflow-hidden rounded-xl border cursor-pointer transition-all duration-250 ${
																	isUnlocked
																		? "border-teal-400/40 bg-teal-500/6 hover:border-teal-300/70 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(45,212,191,0.15)]"
																		: "border-neutral-700/70 bg-neutral-900/60 hover:border-neutral-500/70 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(0,0,0,0.3)]"
																} ${isLoading ? "pointer-events-none opacity-60" : ""}`}
															>
																{/* Unlock status strip */}
																<div
																	className={`absolute inset-x-0 top-0 h-0.5 transition-colors ${
																		isUnlocked ? "bg-teal-400" : "bg-neutral-700/50"
																	}`}
																/>

																{/* Find friends button */}
																<Link
																	href={`/missing-cosmetics?cosmeticId=${item.id}`}
																	onClick={(e) => e.stopPropagation()}
																	title="Find friends missing this"
																	className="absolute left-1.5 top-1.5 z-20 rounded-lg border border-neutral-700/80 bg-black/60 p-1.5 text-neutral-400 transition-all opacity-0 group-hover:opacity-100 hover:border-teal-400/60 hover:text-teal-200"
																>
																	<FaMagnifyingGlass className="w-2.5 h-2.5" />
																</Link>

																{/* Lock/unlock indicator */}
																<div
																	className={`absolute right-1.5 top-1.5 z-20 rounded-lg border p-1.5 transition-all ${
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

																{/* Image */}
																<div className="relative aspect-square w-full bg-neutral-950/60 p-3">
																	<div
																		className={`relative h-full w-full transition-all duration-400 ${
																			isUnlocked
																				? "drop-shadow-[0_0_10px_rgba(186,230,253,0.35)] group-hover:scale-105"
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

																{/* Name footer */}
																<div className="flex flex-col items-center justify-center border-t border-neutral-800/60 bg-neutral-900/70 px-2.5 py-2.5 min-h-[3.5rem]">
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
													})}
												</div>
											</div>
										</section>
									);
								}
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
