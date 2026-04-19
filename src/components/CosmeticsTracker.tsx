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
	const totalMissing = totalCosmetics - unlockedIds.size;
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

	const filterOptions = ["All", ...Object.keys(categories)];
	const typeFilterOptions = ["All", ...allTypes];
	const normalizedSearchQuery = deferredSearchQuery.trim().toLowerCase();

	const renderableCategories = useMemo(() => {
		return Object.entries(categories)
			.map(([categoryName, items]) => {
				if (activeFilter !== "All" && activeFilter !== categoryName) {
					return null;
				}

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

				if (filteredItems.length === 0) {
					return null;
				}

				const categoryUnlockedCount = filteredItems.filter((item) =>
					unlockedIds.has(item.id)
				).length;

				return {
					categoryName,
					filteredItems,
					categoryUnlockedCount,
				};
			})
			.filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
	}, [
		activeFilter,
		activeTypeFilter,
		normalizedSearchQuery,
		unlockedIds,
		visibilityFilter,
	]);

	const visibleItemCount = useMemo(
		() =>
			renderableCategories.reduce(
				(total, category) => total + category.filteredItems.length,
				0
			),
		[renderableCategories]
	);

	return (
		<div className="w-full flex flex-col items-center gap-8">
			<div className="w-full max-w-6xl rounded-3xl border border-neutral-800/80 bg-[linear-gradient(125deg,rgba(7,10,12,0.95),rgba(18,28,33,0.9))] shadow-[0_24px_80px_rgba(0,0,0,0.45)] p-4 sm:p-6 lg:p-8">
				<div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-6 lg:gap-8">
					<div>
						<p className="text-[11px] tracking-[0.2em] uppercase text-teal-300/75 font-bold mb-3">
							Wardrobe Overview
						</p>
						<h2 className="text-2xl sm:text-4xl font-black tracking-tight text-neutral-100 leading-tight">
							Track fast. Filter smarter. Keep your collection clean.
						</h2>
						<p className="text-sm sm:text-base text-neutral-400 mt-3 max-w-2xl">
							Use focused filters and one-tap toggles to maintain your wardrobe without
							losing your place.
						</p>
					</div>
					<div className="grid grid-cols-2 gap-3 sm:gap-4">
						<div className="rounded-2xl border border-teal-500/20 bg-teal-500/10 p-4">
							<p className="text-[10px] tracking-[0.2em] uppercase text-teal-200/70 font-bold">
								Completion
							</p>
							<p className="text-3xl font-black text-teal-300 mt-1">
								{overallCompletion}%
							</p>
							<div className="mt-3 h-2 w-full rounded-full bg-black/35 overflow-hidden">
								<div
									className="h-full bg-linear-to-r from-teal-300 to-cyan-400 transition-all duration-300"
									style={{ width: `${overallCompletion}%` }}
								/>
							</div>
						</div>
						<div className="rounded-2xl border border-sky-500/20 bg-sky-500/10 p-4">
							<p className="text-[10px] tracking-[0.2em] uppercase text-sky-200/70 font-bold">
								Unlocked
							</p>
							<p className="text-3xl font-black text-sky-300 mt-1">{unlockedIds.size}</p>
							<p className="text-xs text-sky-100/60 mt-1">of {totalCosmetics}</p>
						</div>
						<div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
							<p className="text-[10px] tracking-[0.2em] uppercase text-amber-200/70 font-bold">
								Missing
							</p>
							<p className="text-3xl font-black text-amber-300 mt-1">{totalMissing}</p>
							<p className="text-xs text-amber-100/60 mt-1">still to discover</p>
						</div>
						<div className="rounded-2xl border border-violet-500/20 bg-violet-500/10 p-4">
							<p className="text-[10px] tracking-[0.2em] uppercase text-violet-200/70 font-bold">
								Categories Done
							</p>
							<p className="text-3xl font-black text-violet-300 mt-1">
								{completedCategories}
							</p>
							<p className="text-xs text-violet-100/60 mt-1">
								out of {categoryAnalytics.length}
							</p>
						</div>
					</div>
				</div>
			</div>

			<div className="w-full max-w-6xl rounded-3xl border border-neutral-800/80 bg-black/55 backdrop-blur-xl p-4 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.4)] space-y-5">
				<div className="flex items-center gap-3 text-neutral-300">
					<FaSliders className="w-4 h-4 text-teal-300" />
					<p className="text-xs sm:text-sm uppercase tracking-[0.22em] font-semibold">
						Wardrobe Controls
					</p>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
					<label className="flex flex-col gap-2 lg:col-span-2">
						<span className="text-[10px] uppercase tracking-[0.18em] text-neutral-500 font-semibold">
							Search
						</span>
						<div className="relative">
							<FaMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 w-4 h-4" />
							<input
								type="text"
								placeholder="Type a cosmetic name"
								value={searchQuery}
								onChange={(event) => setSearchQuery(event.target.value)}
								className="w-full rounded-xl border border-neutral-700 bg-neutral-950/80 py-2.5 pl-10 pr-4 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-teal-400"
							/>
						</div>
					</label>

					<label className="flex flex-col gap-2">
						<span className="text-[10px] uppercase tracking-[0.18em] text-neutral-500 font-semibold">
							Category
						</span>
						<select
							value={activeFilter}
							onChange={(event) => setActiveFilter(event.target.value)}
							className="w-full rounded-xl border border-neutral-700 bg-neutral-950/80 px-3 py-2.5 text-sm text-neutral-100 focus:outline-none focus:border-teal-400"
						>
							{filterOptions.map((option) => (
								<option key={option} value={option}>
									{option}
								</option>
							))}
						</select>
					</label>

					<label className="flex flex-col gap-2">
						<span className="text-[10px] uppercase tracking-[0.18em] text-neutral-500 font-semibold">
							Type
						</span>
						<select
							value={activeTypeFilter}
							onChange={(event) => setActiveTypeFilter(event.target.value)}
							className="w-full rounded-xl border border-neutral-700 bg-neutral-950/80 px-3 py-2.5 text-sm text-neutral-100 focus:outline-none focus:border-teal-400"
						>
							{typeFilterOptions.map((option) => (
								<option key={option} value={option}>
									{option}
								</option>
							))}
						</select>
					</label>
				</div>

				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-neutral-800 pt-4">
					<div className="flex items-center gap-2 text-neutral-400 text-xs uppercase tracking-[0.16em] font-semibold">
						<FaFilter className="text-neutral-500" />
						<span>Status</span>
					</div>
					<div className="flex flex-wrap gap-2">
						{(
							[
								{ key: "all", label: "All" },
								{ key: "unlocked", label: "Unlocked" },
								{ key: "locked", label: "Locked" },
							] as Array<{ key: VisibilityFilter; label: string }>
						).map((option) => (
							<button
								key={option.key}
								onClick={() => setVisibilityFilter(option.key)}
								className={`rounded-full border px-4 py-2 text-[11px] uppercase tracking-[0.16em] font-semibold transition-colors ${
									visibilityFilter === option.key
										? "border-teal-400 bg-teal-500/15 text-teal-200"
										: "border-neutral-700 bg-neutral-900/60 text-neutral-400 hover:border-neutral-500 hover:text-neutral-200"
								}`}
							>
								{option.label}
							</button>
						))}
					</div>
				</div>

				<div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-800 pt-4">
					<div className="text-xs text-neutral-400 uppercase tracking-[0.18em] font-semibold">
						Showing {visibleItemCount} item{visibleItemCount === 1 ? "" : "s"}
					</div>
					<button
						onClick={() => {
							setSearchQuery("");
							setActiveFilter("All");
							setActiveTypeFilter("All");
							setVisibilityFilter("all");
						}}
						className="rounded-full border border-neutral-700 bg-neutral-900/70 px-4 py-2 text-[11px] uppercase tracking-[0.16em] font-semibold text-neutral-300 hover:border-neutral-500 hover:text-neutral-100 transition-colors"
					>
						Reset Filters
					</button>
				</div>
			</div>

			<div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-4">
				<div className="rounded-2xl border border-neutral-800/80 bg-neutral-950/55 p-4 sm:p-5">
					<p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-semibold mb-3">
						Top Category Progress
					</p>
					<div className="space-y-3">
						{topProgressCategories.map((category) => (
							<div key={category.categoryName}>
								<div className="flex items-center justify-between text-xs mb-1.5">
									<span className="uppercase tracking-[0.14em] font-semibold text-neutral-300">
										{category.categoryName}
									</span>
									<span className="text-neutral-500">
										{category.unlocked}/{category.total} ({category.percentage}%)
									</span>
								</div>
								<div className="h-2 rounded-full bg-neutral-800/80 overflow-hidden">
									<div
										className="h-full bg-linear-to-r from-teal-400 to-cyan-400"
										style={{ width: `${category.percentage}%` }}
									/>
								</div>
							</div>
						))}
					</div>
				</div>

				<div className="rounded-2xl border border-neutral-800/80 bg-neutral-950/55 p-4 sm:p-5">
					<p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-semibold mb-3">
						Near Completion
					</p>
					{nearCompleteCategories.length > 0 ? (
						<div className="flex flex-wrap gap-2">
							{nearCompleteCategories.map((category) => (
								<span
									key={category.categoryName}
									className="rounded-full border border-amber-400/35 bg-amber-300/10 px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] font-semibold text-amber-200"
								>
									{category.categoryName}: {category.missing} left
								</span>
							))}
						</div>
					) : (
						<p className="text-sm text-neutral-500">
							No categories are close right now. Keep unlocking and this list will update
							automatically.
						</p>
					)}
				</div>
			</div>

			{visibleItemCount === 0 ? (
				<div className="w-full max-w-6xl rounded-3xl border border-dashed border-neutral-700 bg-neutral-950/40 px-6 py-16 text-center">
					<p className="text-sm uppercase tracking-[0.18em] text-neutral-400 font-semibold">
						No matches
					</p>
					<p className="text-neutral-500 mt-2">
						Try changing filters or search with a broader term.
					</p>
				</div>
			) : (
				<div className="w-full max-w-6xl space-y-10 sm:space-y-12">
					{renderableCategories.map(
						({ categoryName, filteredItems, categoryUnlockedCount }) => (
							<section
								key={categoryName}
								className="rounded-3xl border border-neutral-800/70 bg-neutral-950/45 p-4 sm:p-6 lg:p-8 shadow-[0_18px_45px_rgba(0,0,0,0.35)]"
							>
								<div className="flex flex-col gap-4 border-b border-neutral-800/70 pb-4 mb-5 sm:flex-row sm:items-end sm:justify-between">
									<div>
										<h3 className="text-xl sm:text-2xl lg:text-3xl font-black uppercase tracking-[0.08em] text-neutral-100">
											{categoryName}
										</h3>
										<p className="text-xs sm:text-sm text-neutral-500 mt-1 uppercase tracking-[0.14em]">
											{categoryUnlockedCount}/{filteredItems.length} unlocked in view
										</p>
									</div>
									<div className="flex items-center gap-2 sm:gap-3">
										<button
											onClick={() => toggleCategory(filteredItems, "unlock")}
											className="rounded-xl border border-teal-500/40 bg-teal-500/12 px-3 py-2 text-[11px] sm:text-xs uppercase tracking-[0.16em] font-semibold text-teal-200 hover:bg-teal-500/20 transition-colors"
										>
											Unlock All
										</button>
										<button
											onClick={() => toggleCategory(filteredItems, "lock")}
											className="rounded-xl border border-rose-500/40 bg-rose-500/12 px-3 py-2 text-[11px] sm:text-xs uppercase tracking-[0.16em] font-semibold text-rose-200 hover:bg-rose-500/20 transition-colors"
										>
											Lock All
										</button>
									</div>
								</div>

								<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-5">
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
												className={`group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border transition-all duration-300 ${
													isUnlocked
														? "border-teal-400/45 bg-teal-500/8 hover:border-teal-300 hover:-translate-y-1"
														: "border-neutral-700 bg-neutral-900/80 hover:border-neutral-500 hover:-translate-y-1"
												} ${isLoading ? "pointer-events-none opacity-70" : ""}`}
											>
												<div
													className={`absolute inset-x-0 top-0 h-1 ${
														isUnlocked ? "bg-teal-300" : "bg-neutral-700"
													}`}
												/>

												<Link
													href={`/missing-cosmetics?cosmeticId=${item.id}`}
													onClick={(event) => event.stopPropagation()}
													title="Find friends missing this"
													className="absolute left-2 top-2 z-20 rounded-lg border border-neutral-700 bg-black/65 p-1.5 text-neutral-300 transition-colors md:opacity-0 md:group-hover:opacity-100 hover:border-teal-300 hover:text-teal-200"
												>
													<FaMagnifyingGlass className="w-3 h-3" />
												</Link>

												<div
													className={`absolute right-2 top-2 z-20 rounded-lg border p-1.5 ${
														isUnlocked
															? "border-teal-400/60 bg-teal-500/25 text-teal-100"
															: "border-neutral-700 bg-black/65 text-neutral-300"
													}`}
												>
													{isLoading ? (
														<span className="block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
													) : isUnlocked ? (
														<FaUnlockKeyhole className="w-3 h-3" />
													) : (
														<FaLock className="w-3 h-3" />
													)}
												</div>

												<div className="relative aspect-square w-full shrink-0 bg-neutral-950/70 p-4">
													<div
														className={`relative h-full w-full transition-all duration-500 ${
															isUnlocked
																? "drop-shadow-[0_0_14px_rgba(186,230,253,0.45)] group-hover:scale-110"
																: "grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100"
														}`}
													>
														<Image
															src={`/images/cosmetics/${item.id}.png`}
															alt={item.name}
															fill
															className="object-contain"
															sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
															loading="lazy"
														/>
													</div>
												</div>

												<div className="mt-auto flex min-h-21 flex-col justify-center border-t border-neutral-800/70 bg-neutral-900/80 px-3 py-3">
													<p className="line-clamp-2 min-h-9 text-center text-[11px] sm:text-xs uppercase tracking-[0.13em] font-semibold text-neutral-200">
														{item.name}
													</p>
													<p
														className={`mt-1 flex items-center justify-center gap-1 text-[10px] uppercase tracking-[0.14em] ${
															isUnlocked ? "text-teal-300/90" : "invisible"
														}`}
													>
														<FaCheck className="w-2.5 h-2.5" />
														Unlocked
													</p>
												</div>
											</div>
										);
									})}
								</div>
							</section>
						)
					)}
				</div>
			)}
		</div>
	);
}
