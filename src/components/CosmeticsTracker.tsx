"use client";

import { useState, useDeferredValue, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { FaLock, FaUnlockKeyhole, FaFilter, FaMagnifyingGlass } from "react-icons/fa6";
import { categories, allTypes } from "../lib/cosmetics";

import { useApi } from "../hooks/useApi";
import { useToast } from "../hooks/useToast";

interface CosmeticsTrackerProps {
	initialUnlockedIds: number[];
}

export default function CosmeticsTracker({ initialUnlockedIds }: CosmeticsTrackerProps) {
	const [unlockedIds, setUnlockedIds] = useState<Set<number>>(
		new Set(initialUnlockedIds)
	);
	const [activeFilter, setActiveFilter] = useState<string>("All");
	const [activeTypeFilter, setActiveTypeFilter] = useState<string>("All");
	const [searchQuery, setSearchQuery] = useState<string>("");
	const deferredSearchQuery = useDeferredValue(searchQuery);
	const [loadingIds, setLoadingIds] = useState<Set<number>>(new Set());
	const { execute } = useApi();
	const { success, error: toastError } = useToast();

	const toggleCosmetic = async (id: number) => {
		if (loadingIds.has(id)) return;

		// Optimistic UI Update
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
			// Revert State
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

	// Prepare filter options
	const filterOptions = ["All", ...Object.keys(categories)];
	const typeFilterOptions = ["All", ...allTypes];

	const categoryAnalytics = useMemo(() => {
		return Object.entries(categories)
			.map(([categoryName, items]) => {
				const total = items.length;
				const unlocked = items.filter((item) => unlockedIds.has(item.id)).length;
				const missing = total - unlocked;
				const percentage = total > 0 ? Math.round((unlocked / total) * 100) : 0;

				return {
					categoryName,
					total,
					unlocked,
					missing,
					percentage,
				};
			})
			.sort((a, b) => {
				if (b.percentage !== a.percentage) {
					return b.percentage - a.percentage;
				}
				return b.unlocked - a.unlocked;
			});
	}, [unlockedIds]);

	const totalCosmetics = useMemo(() => Object.values(categories).flat().length, []);

	const overallCompletion = totalCosmetics
		? Math.round((unlockedIds.size / totalCosmetics) * 100)
		: 0;

	const completedCategories = categoryAnalytics.filter(
		(category) => category.missing === 0
	).length;

	const nearCompleteCategories = categoryAnalytics
		.filter((category) => category.missing > 0 && category.percentage >= 80)
		.slice(0, 3);

	const topProgressCategories = categoryAnalytics.slice(0, 4);

	return (
		<div className="w-full flex flex-col items-center">
			{/* Filter Bar */}
			<div className="w-full max-w-6xl mb-8 flex flex-col gap-4 bg-black/60 border border-neutral-800 p-4 rounded-sm shadow-xl">
				<div className="flex flex-col sm:flex-row items-center justify-between gap-4">
					<div className="flex items-center gap-3 text-neutral-400 font-bold uppercase tracking-widest text-xs">
						<FaFilter className="text-neutral-500" />
						<span>Category</span>
					</div>
					<div className="flex flex-wrap items-center justify-center sm:justify-end gap-2">
						{filterOptions.map((filter) => (
							<button
								key={filter}
								onClick={() => setActiveFilter(filter)}
								className={`px-3 py-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded-sm transition-all duration-300 border ${
									activeFilter === filter
										? "bg-emerald-900/30 border-emerald-500 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]"
										: "bg-neutral-900/50 border-neutral-800 text-neutral-500 hover:border-neutral-500 hover:text-neutral-300"
								}`}
							>
								{filter}
							</button>
						))}
					</div>
				</div>
				<div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-neutral-800/80 pt-4">
					<div className="flex items-center gap-3 text-neutral-400 font-bold uppercase tracking-widest text-xs">
						<FaFilter className="text-neutral-500" />
						<span>Type</span>
					</div>
					<div className="flex flex-wrap items-center justify-center sm:justify-end gap-2">
						{typeFilterOptions.map((filter) => (
							<button
								key={filter}
								onClick={() => setActiveTypeFilter(filter)}
								className={`px-3 py-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded-sm transition-all duration-300 border ${
									activeTypeFilter === filter
										? "bg-emerald-900/30 border-emerald-500 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]"
										: "bg-neutral-900/50 border-neutral-800 text-neutral-500 hover:border-neutral-500 hover:text-neutral-300"
								}`}
							>
								{filter}
							</button>
						))}
					</div>
				</div>
				<div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-neutral-800/80 pt-4">
					<div className="flex items-center gap-3 text-neutral-400 font-bold uppercase tracking-widest text-xs">
						<FaMagnifyingGlass className="text-neutral-500" />
						<span>Search</span>
					</div>
					<div className="w-full sm:w-auto flex-1 max-w-sm flex justify-center sm:justify-end ml-auto">
						<input
							type="text"
							placeholder="Search cosmetics by name..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="w-full bg-neutral-900/50 border border-neutral-800 text-neutral-200 text-sm px-4 py-2 rounded-sm focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-neutral-600"
						/>
					</div>
				</div>
			</div>

			{/* Progress Analytics */}
			<div className="w-full max-w-6xl mb-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
				<div className="p-4 bg-neutral-900/70 border border-neutral-800 rounded-sm">
					<p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
						Total Progress
					</p>
					<p className="text-2xl font-black text-emerald-400 mt-2">
						{overallCompletion}%
					</p>
					<p className="text-xs text-neutral-500 mt-1">
						{unlockedIds.size} / {totalCosmetics} unlocked
					</p>
					<div className="mt-3 h-2 w-full bg-neutral-800 rounded-sm overflow-hidden">
						<div
							className="h-full bg-emerald-500 transition-all duration-300"
							style={{ width: `${overallCompletion}%` }}
						/>
					</div>
				</div>

				<div className="p-4 bg-neutral-900/70 border border-neutral-800 rounded-sm">
					<p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
						Categories Completed
					</p>
					<p className="text-2xl font-black text-blue-400 mt-2">{completedCategories}</p>
					<p className="text-xs text-neutral-500 mt-1">
						out of {categoryAnalytics.length} categories
					</p>
				</div>

				<div className="p-4 bg-neutral-900/70 border border-neutral-800 rounded-sm md:col-span-2 xl:col-span-2">
					<p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-3">
						Top Category Progress
					</p>
					<div className="space-y-3">
						{topProgressCategories.map((category) => (
							<div key={category.categoryName}>
								<div className="flex items-center justify-between text-xs mb-1">
									<span className="font-bold uppercase tracking-widest text-neutral-300">
										{category.categoryName}
									</span>
									<span className="text-neutral-500 font-bold">
										{category.unlocked}/{category.total} ({category.percentage}%)
									</span>
								</div>
								<div className="h-2 w-full bg-neutral-800 rounded-sm overflow-hidden">
									<div
										className="h-full bg-emerald-500/90 transition-all duration-300"
										style={{
											width: `${category.percentage}%`,
										}}
									/>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>

			{nearCompleteCategories.length > 0 && (
				<div className="w-full max-w-6xl mb-8 p-4 bg-amber-950/20 border border-amber-900/50 rounded-sm">
					<p className="text-[10px] font-bold uppercase tracking-widest text-amber-500 mb-3">
						Almost There
					</p>
					<div className="flex flex-wrap gap-2">
						{nearCompleteCategories.map((category) => (
							<span
								key={category.categoryName}
								className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-sm border border-amber-800/60 text-amber-300 bg-amber-950/30"
							>
								{category.categoryName}: {category.missing} left
							</span>
						))}
					</div>
				</div>
			)}

			{/* Statistics */}
			<div className="w-full max-w-6xl mb-8 flex justify-end">
				<div className="px-4 py-2 bg-neutral-900/80 border border-neutral-700 rounded-sm inline-flex items-center gap-3 shadow-md">
					<span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
						Total Unlocked
					</span>
					<span className="text-lg font-black text-emerald-400">{unlockedIds.size}</span>
				</div>
			</div>

			{/* Render Categories */}
			<div className="w-full max-w-6xl space-y-16">
				{Object.entries(categories).map(([categoryName, items]) => {
					if (activeFilter !== "All" && activeFilter !== categoryName) {
						return null;
					}

					const filteredItems = items.filter((i) => {
						const matchesType = activeTypeFilter === "All" || i.type === activeTypeFilter;
						const matchesSearch = i.name
							.toLowerCase()
							.includes(deferredSearchQuery.toLowerCase());
						return matchesType && matchesSearch;
					});

					if (filteredItems.length === 0) {
						return null;
					}

					// Sort items by unlocked status (unlocked first) just for visual organization if desired
					// But keeping them static is usually better for memory muscle when finding items.
					// We will keep static order.

					const categoryUnlockedCount = filteredItems.filter((i) =>
						unlockedIds.has(i.id)
					).length;

					return (
						<section key={categoryName} className="w-full">
							<div className="flex flex-col sm:flex-row items-start sm:items-end justify-between border-b border-neutral-800/80 pb-3 mb-6 gap-4 sm:gap-0">
								<h2 className="text-2xl sm:text-3xl font-black tracking-tighter text-transparent bg-clip-text bg-linear-to-b from-neutral-200 to-neutral-600 uppercase">
									{categoryName}
								</h2>
								<div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
									<div className="flex items-center gap-2">
										<button
											onClick={() => toggleCategory(filteredItems, "unlock")}
											className="text-[10px] sm:text-xs px-3 py-1.5 bg-emerald-950/30 text-emerald-500 border border-emerald-900 rounded-sm hover:bg-emerald-900 hover:text-emerald-400 transition-colors uppercase font-bold tracking-widest shadow-[0_0_10px_rgba(16,185,129,0.05)]"
										>
											Unlock All
										</button>
										<button
											onClick={() => toggleCategory(filteredItems, "lock")}
											className="text-[10px] sm:text-xs px-3 py-1.5 bg-red-950/30 text-red-500 border border-red-900 rounded-sm hover:bg-red-900 hover:text-red-400 transition-colors uppercase font-bold tracking-widest shadow-[0_0_10px_rgba(220,38,38,0.05)]"
										>
											Lock All
										</button>
									</div>
									<span className="text-sm font-bold text-neutral-500 tracking-widest shrink-0">
										{categoryUnlockedCount} / {filteredItems.length}
									</span>
								</div>
							</div>

							<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
								{filteredItems.map((item) => {
									const isUnlocked = unlockedIds.has(item.id);
									const isLoading = loadingIds.has(item.id);

									return (
										<div
											key={item.id}
											onClick={() => {
												if (!isLoading) {
													toggleCosmetic(item.id);
												}
											}}
											className={`group relative flex flex-col items-center bg-black border rounded-sm overflow-hidden transition-all duration-300 cursor-pointer ${
												isUnlocked
													? "border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)] hover:border-emerald-400 hover:shadow-[0_0_25px_rgba(16,185,129,0.2)] hover:-translate-y-1"
													: "border-neutral-800 opacity-60 hover:opacity-100 hover:border-neutral-500 hover:-translate-y-1"
											} ${isLoading ? "pointer-events-none" : ""}`}
										>
											{/* Top Status Banner */}
											<div
												className={`absolute top-0 inset-x-0 h-1 z-20 transition-colors ${
													isUnlocked
														? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]"
														: "bg-red-900/50"
												}`}
											/>

											{/* Search Friends Link */}
											<Link
												href={`/missing-cosmetics?cosmeticId=${item.id}`}
												onClick={(e) => e.stopPropagation()}
												title="Find friends missing this"
												className="absolute top-2 left-2 z-20 p-1.5 rounded-sm backdrop-blur-md border bg-black/60 border-neutral-800 text-neutral-500 hover:text-emerald-400 hover:border-emerald-500 transition-all opacity-0 group-hover:opacity-100"
											>
												<FaMagnifyingGlass className="w-3 h-3" />
											</Link>

											{/* Icon Indicator */}
											<div
												className={`absolute top-2 right-2 z-20 p-1.5 rounded-sm backdrop-blur-md border transition-all ${
													isUnlocked
														? "bg-emerald-900/40 border-emerald-500/50 text-emerald-400"
														: "bg-black/60 border-neutral-800 text-neutral-500"
												}`}
											>
												{isLoading ? (
													<span className="block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
												) : isUnlocked ? (
													<FaUnlockKeyhole className="w-3 h-3" />
												) : (
													<FaLock className="w-3 h-3" />
												)}
											</div>

											{/* Image Container */}
											<div className="relative w-full aspect-square bg-neutral-950/50 flex items-center justify-center p-4">
												<div
													className={`relative w-full h-full transition-all duration-500 ${
														isUnlocked
															? "drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] group-hover:scale-110"
															: "grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100"
													}`}
												>
													<Image
														src={`/images/cosmetics/${item.id}.png`}
														alt={item.name}
														fill
														className="object-contain"
														sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
														loading="lazy"
													/>
												</div>
											</div>

											{/* Title Footer */}
											<div className="w-full p-3 bg-neutral-900/80 border-t border-neutral-800/80 mt-auto">
												<p
													className={`text-center text-[10px] sm:text-xs font-bold uppercase tracking-widest leading-tight ${
														isUnlocked
															? "text-emerald-100"
															: "text-neutral-500 group-hover:text-neutral-300"
													}`}
												>
													{item.name}
												</p>
											</div>
										</div>
									);
								})}
							</div>
						</section>
					);
				})}
			</div>
		</div>
	);
}
