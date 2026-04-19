"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FaFilter, FaLock, FaMagnifyingGlass } from "react-icons/fa6";
import { type CosmeticItem, allTypes } from "../lib/cosmetics";

interface MissingCosmeticsListProps {
	missingByCategory: Record<string, CosmeticItem[]>;
	totalMissing: number;
}

export default function MissingCosmeticsList({
	missingByCategory,
	totalMissing,
}: MissingCosmeticsListProps) {
	const [activeFilter, setActiveFilter] = useState<string>("All");
	const [activeTypeFilter, setActiveTypeFilter] = useState<string>("All");
	const [searchQuery, setSearchQuery] = useState<string>("");

	const filterOptions = ["All", ...Object.keys(missingByCategory)];
	const typeFilterOptions = ["All", ...allTypes];
	const normalizedSearch = searchQuery.trim().toLowerCase();

	const filteredByCategory = useMemo(() => {
		const output: Record<string, CosmeticItem[]> = {};

		Object.entries(missingByCategory).forEach(([categoryName, items]) => {
			if (activeFilter !== "All" && activeFilter !== categoryName) {
				return;
			}

			const filteredItems = items.filter((item) => {
				const matchesType = activeTypeFilter === "All" || item.type === activeTypeFilter;
				const matchesSearch =
					normalizedSearch.length === 0 ||
					item.name.toLowerCase().includes(normalizedSearch);
				return matchesType && matchesSearch;
			});

			if (filteredItems.length > 0) {
				output[categoryName] = filteredItems;
			}
		});

		return output;
	}, [activeFilter, activeTypeFilter, missingByCategory, normalizedSearch]);

	const filteredTotal = useMemo(
		() => Object.values(filteredByCategory).flat().length,
		[filteredByCategory]
	);

	return (
		<div className="w-full flex flex-col items-center gap-8">
			<div className="w-full max-w-6xl rounded-3xl border border-neutral-800/80 bg-[linear-gradient(145deg,rgba(14,9,9,0.95),rgba(39,19,18,0.9))] p-4 sm:p-6 lg:p-8 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
				<div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-6 lg:gap-8">
					<div>
						<p className="text-[11px] tracking-[0.2em] uppercase text-rose-200/75 font-semibold mb-3">
							Missing Inventory
						</p>
						<h2 className="text-2xl sm:text-4xl font-black tracking-tight text-neutral-100 leading-tight">
							Still hidden in the fog
						</h2>
						<p className="text-sm sm:text-base text-neutral-400 mt-3 max-w-2xl">
							Inspect what is missing by category, type, and keyword to decide what to
							prioritize next.
						</p>
					</div>
					<div className="grid grid-cols-2 gap-3 sm:gap-4">
						<div className="rounded-2xl border border-rose-500/25 bg-rose-500/10 p-4">
							<p className="text-[10px] tracking-[0.2em] uppercase text-rose-200/70 font-bold">
								Missing
							</p>
							<p className="text-3xl font-black text-rose-300 mt-1">{totalMissing}</p>
							<p className="text-xs text-rose-100/60 mt-1">from full collection</p>
						</div>
						<div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4">
							<p className="text-[10px] tracking-[0.2em] uppercase text-amber-200/70 font-bold">
								Categories
							</p>
							<p className="text-3xl font-black text-amber-300 mt-1">
								{Object.keys(missingByCategory).length}
							</p>
							<p className="text-xs text-amber-100/60 mt-1">have at least one missing</p>
						</div>
						<div className="rounded-2xl border border-sky-500/25 bg-sky-500/10 p-4 col-span-2">
							<p className="text-[10px] tracking-[0.2em] uppercase text-sky-200/70 font-bold">
								Filtered Result
							</p>
							<p className="text-3xl font-black text-sky-300 mt-1">{filteredTotal}</p>
							<p className="text-xs text-sky-100/60 mt-1">currently visible</p>
						</div>
					</div>
				</div>
			</div>

			{totalMissing > 0 && (
				<div className="w-full max-w-6xl rounded-3xl border border-neutral-800/80 bg-black/55 backdrop-blur-xl p-4 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.4)] space-y-5">
					<div className="flex items-center gap-3 text-neutral-300">
						<FaFilter className="w-4 h-4 text-rose-300" />
						<p className="text-xs sm:text-sm uppercase tracking-[0.22em] font-semibold">
							Filter Missing Cosmetics
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
									value={searchQuery}
									onChange={(event) => setSearchQuery(event.target.value)}
									placeholder="Search missing cosmetic"
									className="w-full rounded-xl border border-neutral-700 bg-neutral-950/80 py-2.5 pl-10 pr-4 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-rose-300"
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
								className="w-full rounded-xl border border-neutral-700 bg-neutral-950/80 px-3 py-2.5 text-sm text-neutral-100 focus:outline-none focus:border-rose-300"
							>
								{filterOptions.map((filter) => (
									<option key={filter} value={filter}>
										{filter}
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
								className="w-full rounded-xl border border-neutral-700 bg-neutral-950/80 px-3 py-2.5 text-sm text-neutral-100 focus:outline-none focus:border-rose-300"
							>
								{typeFilterOptions.map((filter) => (
									<option key={filter} value={filter}>
										{filter}
									</option>
								))}
							</select>
						</label>
					</div>

					<div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-800 pt-4">
						<div className="text-xs text-neutral-400 uppercase tracking-[0.18em] font-semibold">
							Showing {filteredTotal} item{filteredTotal === 1 ? "" : "s"}
						</div>
						<button
							onClick={() => {
								setSearchQuery("");
								setActiveFilter("All");
								setActiveTypeFilter("All");
							}}
							className="rounded-full border border-neutral-700 bg-neutral-900/70 px-4 py-2 text-[11px] uppercase tracking-[0.16em] font-semibold text-neutral-300 hover:border-neutral-500 hover:text-neutral-100 transition-colors"
						>
							Reset Filters
						</button>
					</div>
				</div>
			)}

			{totalMissing === 0 ? (
				<div className="w-full max-w-6xl rounded-3xl border border-emerald-500/25 bg-emerald-500/10 px-6 py-16 text-center">
					<p className="text-sm uppercase tracking-[0.18em] text-emerald-200 font-semibold">
						Collection complete
					</p>
					<p className="mt-2 text-emerald-100/75">
						This survivor has every cosmetic unlocked.
					</p>
				</div>
			) : filteredTotal === 0 ? (
				<div className="w-full max-w-6xl rounded-3xl border border-dashed border-neutral-700 bg-neutral-950/45 px-6 py-16 text-center">
					<p className="text-sm uppercase tracking-[0.18em] text-neutral-400 font-semibold">
						No matches
					</p>
					<p className="mt-2 text-neutral-500">
						Try another category, type, or a broader search term.
					</p>
				</div>
			) : (
				<div className="w-full max-w-6xl space-y-10 sm:space-y-12">
					{Object.entries(filteredByCategory).map(([categoryName, items]) => (
						<section
							key={categoryName}
							className="rounded-3xl border border-neutral-800/70 bg-neutral-950/45 p-4 sm:p-6 lg:p-8 shadow-[0_18px_45px_rgba(0,0,0,0.35)]"
						>
							<div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 border-b border-neutral-800/70 pb-4 mb-5">
								<div>
									<h3 className="text-xl sm:text-2xl lg:text-3xl font-black uppercase tracking-[0.08em] text-neutral-100">
										{categoryName}
									</h3>
									<p className="text-xs sm:text-sm text-neutral-500 mt-1 uppercase tracking-[0.14em]">
										items still missing
									</p>
								</div>
								<span className="rounded-full border border-rose-400/45 bg-rose-500/15 px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] font-semibold text-rose-200">
									{items.length} missing
								</span>
							</div>

							<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-5">
								{items.map((item) => (
									<div
										key={item.id}
										className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-rose-400/30 bg-rose-500/6 transition-all duration-300 hover:border-rose-300 hover:-translate-y-1"
									>
										<div className="absolute inset-x-0 top-0 h-1 bg-rose-300" />
										<Link
											href={`/missing-cosmetics?cosmeticId=${item.id}`}
											title="Find friends missing this"
											className="absolute left-2 top-2 z-20 rounded-lg border border-neutral-700 bg-black/65 p-1.5 text-neutral-300 transition-colors md:opacity-0 md:group-hover:opacity-100 hover:border-emerald-300 hover:text-emerald-200"
										>
											<FaMagnifyingGlass className="w-3 h-3" />
										</Link>
										<div className="absolute right-2 top-2 z-20 rounded-lg border border-neutral-700 bg-black/65 p-1.5 text-neutral-300">
											<FaLock className="w-3 h-3" />
										</div>
										<div className="relative aspect-square w-full shrink-0 bg-neutral-950/70 p-4">
											<div className="relative h-full w-full transition-all duration-500 grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100">
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
										<div className="flex min-h-[3.25rem] items-center justify-center border-t border-neutral-800/70 bg-neutral-900/80 px-3 py-3">
											<p className="line-clamp-2 min-h-[2.25rem] text-center text-[11px] sm:text-xs uppercase tracking-[0.13em] font-semibold leading-relaxed text-neutral-200">
												{item.name}
											</p>
										</div>
									</div>
								))}
							</div>
						</section>
					))}
				</div>
			)}
		</div>
	);
}
