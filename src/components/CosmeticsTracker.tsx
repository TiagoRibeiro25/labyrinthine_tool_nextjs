"use client";

import {
	useCallback,
	useMemo,
	useState,
	useTransition,
	type CSSProperties,
} from "react";
import { FaFilter, FaMagnifyingGlass, FaSliders, FaXmark } from "react-icons/fa6";
import { categories } from "../lib/cosmetics";
import type { CosmeticItem } from "../lib/cosmetics";
import { useApi } from "../hooks/useApi";
import { useToast } from "../hooks/useToast";
import CosmeticCategorySection from "./cosmetics/CosmeticCategorySection";
import WardrobeSidebar from "./cosmetics/WardrobeSidebar";

interface CosmeticsTrackerProps {
	initialUnlockedIds: number[];
}

type VisibilityFilter = "all" | "unlocked" | "locked";

const totalCosmetics = Object.values(categories).flat().length;

export default function CosmeticsTracker({ initialUnlockedIds }: CosmeticsTrackerProps) {
	const [unlockedIds, setUnlockedIds] = useState<Set<number>>(
		() => new Set(initialUnlockedIds)
	);
	const [activeFilter, setActiveFilter] = useState<string>("All");
	const [activeTypeFilter, setActiveTypeFilter] = useState<string>("All");
	const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>("all");
	const [filterSearchQuery, setFilterSearchQuery] = useState<string>("");
	const [filterResetKey, setFilterResetKey] = useState<number>(0);
	const [loadingIds, setLoadingIds] = useState<Set<number>>(() => new Set());
	const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
	const [, startTransition] = useTransition();
	const { execute } = useApi();
	const { success, error: toastError } = useToast();

	const isUnlocked = useCallback((id: number) => unlockedIds.has(id), [unlockedIds]);
	const isLoading = useCallback((id: number) => loadingIds.has(id), [loadingIds]);

	const toggleCosmetic = useCallback(
		async (id: number) => {
			if (loadingIds.has(id)) return;

			const isUnlocking = !unlockedIds.has(id);
			const optimisticIds = new Set(unlockedIds);
			if (isUnlocking) optimisticIds.add(id);
			else optimisticIds.delete(id);

			startTransition(() => {
				setUnlockedIds(optimisticIds);
			});
			setLoadingIds((prev) => new Set(prev).add(id));

			try {
				await execute("/api/cosmetics/toggle", {
					method: "POST",
					body: JSON.stringify({ cosmeticId: id }),
				});
			} catch (error) {
				console.error(error);
				startTransition(() => {
					setUnlockedIds((prev) => {
						const reverted = new Set(prev);
						if (isUnlocking) reverted.delete(id);
						else reverted.add(id);
						return reverted;
					});
				});
			} finally {
				setLoadingIds((prev) => {
					const updated = new Set(prev);
					updated.delete(id);
					return updated;
				});
			}
		},
		[execute, loadingIds, unlockedIds]
	);

	const toggleCategory = useCallback(
		async (items: CosmeticItem[], action: "unlock" | "lock") => {
			const itemIds = items.map((i) => i.id);
			const originalUnlockedIds = unlockedIds;
			const newUnlockedIds = new Set(unlockedIds);

			if (action === "unlock") itemIds.forEach((id) => newUnlockedIds.add(id));
			else itemIds.forEach((id) => newUnlockedIds.delete(id));

			startTransition(() => {
				setUnlockedIds(newUnlockedIds);
			});
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
				startTransition(() => {
					setUnlockedIds(originalUnlockedIds);
				});

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
		},
		[execute, success, toastError, unlockedIds]
	);

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

	const categoryPercentageByName = useMemo(() => {
		const map = new Map<string, number>();
		for (const row of categoryAnalytics) {
			map.set(row.categoryName, row.percentage);
		}
		return map;
	}, [categoryAnalytics]);

	const totalUnlocked = unlockedIds.size;
	const totalMissing = totalCosmetics - totalUnlocked;
	const overallCompletion = totalCosmetics
		? Math.round((totalUnlocked / totalCosmetics) * 100)
		: 0;
	const completedCategories = categoryAnalytics.filter((c) => c.missing === 0).length;

	const normalizedSearchQuery = filterSearchQuery.trim().toLowerCase();

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
					const itemUnlocked = unlockedIds.has(item.id);
					const matchesVisibility =
						visibilityFilter === "all" ||
						(visibilityFilter === "unlocked" ? itemUnlocked : !itemUnlocked);

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
		filterSearchQuery.trim().length > 0;

	const resetFilters = useCallback(() => {
		setFilterSearchQuery("");
		setActiveFilter("All");
		setActiveTypeFilter("All");
		setVisibilityFilter("all");
		setFilterResetKey((key) => key + 1);
	}, []);

	const handleSearchQueryChange = useCallback((query: string) => {
		setFilterSearchQuery(query);
	}, []);

	const openMobileSidebar = useCallback(() => {
		startTransition(() => {
			setSidebarOpen(true);
		});
	}, []);

	const closeMobileSidebar = useCallback(() => {
		setSidebarOpen(false);
	}, []);

	const sidebarProps = {
		filterSearchQuery,
		resetKey: filterResetKey,
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
		onSearchQueryChange: handleSearchQueryChange,
		onActiveFilterChange: setActiveFilter,
		onActiveTypeFilterChange: setActiveTypeFilter,
		onVisibilityFilterChange: setVisibilityFilter,
		onResetFilters: resetFilters,
	};

	const layoutMinHeight = { minHeight: "calc(100vh - 180px)" } satisfies CSSProperties;

	return (
		<div className="w-full flex flex-col" style={layoutMinHeight}>
			<div className="lg:hidden mb-4 flex items-center justify-between gap-3">
				<button
					type="button"
					onClick={openMobileSidebar}
					className="inline-flex items-center gap-2 rounded-xl border border-neutral-700/80 bg-neutral-900/70 px-4 py-2.5 text-xs uppercase tracking-[0.18em] font-bold text-neutral-300 hover:border-teal-500/50 hover:text-teal-200 transition-colors"
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

			{sidebarOpen && (
				<div className="lg:hidden fixed inset-0 z-50 flex">
					<div
						className="absolute inset-0 bg-black/75"
						onClick={closeMobileSidebar}
						aria-hidden
					/>
					<aside className="relative w-72 max-w-[85vw] h-full bg-neutral-950 border-r border-neutral-800/80 flex flex-col overflow-y-auto p-5">
						<div className="flex items-center justify-between mb-5">
							<div className="flex items-center gap-2">
								<FaFilter className="w-3.5 h-3.5 text-teal-300" />
								<p className="text-xs uppercase tracking-[0.2em] font-bold text-neutral-200">
									Filters
								</p>
							</div>
							<button
								type="button"
								onClick={closeMobileSidebar}
								className="rounded-lg border border-neutral-700 bg-neutral-900 p-2 text-neutral-400 hover:text-neutral-100 transition-colors"
							>
								<FaXmark className="w-3.5 h-3.5" />
							</button>
						</div>
						<WardrobeSidebar {...sidebarProps} />
					</aside>
				</div>
			)}

			<div className="flex gap-5 lg:gap-6 flex-1">
				<aside className="hidden lg:flex flex-col w-64 xl:w-72 shrink-0 self-start">
					<div className="sticky top-6 rounded-2xl border border-neutral-800/80 bg-neutral-950/75 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
						<div className="flex items-center gap-2 mb-5">
							<FaSliders className="w-3.5 h-3.5 text-teal-300" />
							<p className="text-[10px] uppercase tracking-[0.22em] font-bold text-neutral-300">
								Wardrobe Controls
							</p>
						</div>
						<WardrobeSidebar {...sidebarProps} />
					</div>
				</aside>

				<div className="flex-1 min-w-0 flex flex-col gap-5">
					<div className="flex items-center justify-between gap-3 flex-wrap">
						<div className="flex items-center gap-3 flex-wrap">
							<p className="text-xs text-neutral-400 uppercase tracking-[0.18em] font-semibold">
								<span className="text-neutral-100 font-black">{visibleItemCount}</span>{" "}
								item{visibleItemCount !== 1 ? "s" : ""}
							</p>

							{activeFilter !== "All" && (
								<button
									type="button"
									onClick={() => setActiveFilter("All")}
									className="inline-flex items-center gap-1.5 rounded-full border border-teal-400/40 bg-teal-500/12 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-teal-200 hover:bg-teal-500/20 transition-colors"
								>
									{activeFilter}
									<FaXmark className="w-2.5 h-2.5" />
								</button>
							)}
							{activeTypeFilter !== "All" && (
								<button
									type="button"
									onClick={() => setActiveTypeFilter("All")}
									className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/40 bg-cyan-500/12 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-200 hover:bg-cyan-500/20 transition-colors"
								>
									{activeTypeFilter}
									<FaXmark className="w-2.5 h-2.5" />
								</button>
							)}
							{visibilityFilter !== "all" && (
								<button
									type="button"
									onClick={() => setVisibilityFilter("all")}
									className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/40 bg-sky-500/12 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-sky-200 hover:bg-sky-500/20 transition-colors"
								>
									{visibilityFilter === "unlocked" ? "Unlocked" : "Locked"}
									<FaXmark className="w-2.5 h-2.5" />
								</button>
							)}
							{filterSearchQuery.trim().length > 0 && (
								<button
									type="button"
									onClick={() => {
										setFilterSearchQuery("");
										setFilterResetKey((key) => key + 1);
									}}
									className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/40 bg-violet-500/12 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-violet-200 hover:bg-violet-500/20 transition-colors"
								>
									&ldquo;{filterSearchQuery.trim().slice(0, 20)}&rdquo;
									<FaXmark className="w-2.5 h-2.5" />
								</button>
							)}
						</div>

						{hasActiveFilters && (
							<button
								type="button"
								onClick={resetFilters}
								className="text-[10px] uppercase tracking-[0.16em] font-bold text-neutral-500 hover:text-rose-300 transition-colors"
							>
								Clear all
							</button>
						)}
					</div>

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
								type="button"
								onClick={resetFilters}
								className="mt-5 rounded-xl border border-neutral-700 bg-neutral-900/60 px-4 py-2 text-xs uppercase tracking-[0.16em] font-bold text-neutral-300 hover:border-teal-500/50 hover:text-teal-200 transition-colors"
							>
								Reset Filters
							</button>
						</div>
					) : (
						<div className="space-y-6">
							{renderableCategories.map(
								({ categoryName, filteredItems, categoryUnlockedCount }) => (
									<CosmeticCategorySection
										key={categoryName}
										categoryName={categoryName}
										filteredItems={filteredItems}
										categoryUnlockedCount={categoryUnlockedCount}
										catPercentage={categoryPercentageByName.get(categoryName) ?? 0}
										isUnlocked={isUnlocked}
										isLoading={isLoading}
										onToggle={toggleCosmetic}
										onToggleCategory={toggleCategory}
									/>
								)
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
