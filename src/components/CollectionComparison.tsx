"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
	FaFilter,
	FaLock,
	FaMagnifyingGlass,
	FaUser,
	FaUsers,
	FaWandMagicSparkles,
} from "react-icons/fa6";
import { allTypes, type CosmeticItem } from "../lib/cosmetics";

type ComparisonView = "onlyYou" | "onlyThem" | "bothMissing";

interface CollectionComparisonProps {
	currentUsername: string;
	targetUsername: string;
	onlyYouByCategory: Record<string, CosmeticItem[]>;
	onlyThemByCategory: Record<string, CosmeticItem[]>;
	bothMissingByCategory: Record<string, CosmeticItem[]>;
}

const VIEW_CONFIG: Record<
	ComparisonView,
	{
		label: string;
		subtitle: string;
		toneClasses: string;
		countToneClasses: string;
		cardClasses: string;
		bannerClasses: string;
		pillClasses: string;
		icon: React.ReactNode;
	}
> = {
	onlyYou: {
		label: "Only You Have",
		subtitle: "Potential gift ideas for your friend",
		toneClasses: "border-teal-400/45 bg-teal-500/12 text-teal-100",
		countToneClasses: "text-teal-300",
		cardClasses: "border-teal-400/35 bg-teal-500/6 hover:border-teal-300",
		bannerClasses: "bg-teal-300",
		pillClasses: "border-teal-400/45 bg-teal-500/15 text-teal-200",
		icon: <FaUser className="w-3.5 h-3.5" />,
	},
	onlyThem: {
		label: "Only They Have",
		subtitle: "What you can chase next",
		toneClasses: "border-sky-400/45 bg-sky-500/12 text-sky-100",
		countToneClasses: "text-sky-300",
		cardClasses: "border-sky-400/35 bg-sky-500/6 hover:border-sky-300",
		bannerClasses: "bg-sky-300",
		pillClasses: "border-sky-400/45 bg-sky-500/15 text-sky-200",
		icon: <FaUsers className="w-3.5 h-3.5" />,
	},
	bothMissing: {
		label: "Both Missing",
		subtitle: "Mutual goals to unlock together",
		toneClasses: "border-rose-400/45 bg-rose-500/12 text-rose-100",
		countToneClasses: "text-rose-300",
		cardClasses: "border-rose-400/35 bg-rose-500/6 hover:border-rose-300",
		bannerClasses: "bg-rose-300",
		pillClasses: "border-rose-400/45 bg-rose-500/15 text-rose-200",
		icon: <FaLock className="w-3.5 h-3.5" />,
	},
};

function flattenCategoryMap(map: Record<string, CosmeticItem[]>) {
	return Object.values(map).flat();
}

export default function CollectionComparison({
	currentUsername,
	targetUsername,
	onlyYouByCategory,
	onlyThemByCategory,
	bothMissingByCategory,
}: CollectionComparisonProps) {
	const [activeView, setActiveView] = useState<ComparisonView>("onlyYou");
	const [activeCategory, setActiveCategory] = useState<string>("All");
	const [activeType, setActiveType] = useState<string>("All");
	const [searchQuery, setSearchQuery] = useState<string>("");

	const datasets = useMemo(
		() => ({
			onlyYou: onlyYouByCategory,
			onlyThem: onlyThemByCategory,
			bothMissing: bothMissingByCategory,
		}),
		[onlyYouByCategory, onlyThemByCategory, bothMissingByCategory]
	);

	const totals = useMemo(
		() => ({
			onlyYou: flattenCategoryMap(onlyYouByCategory).length,
			onlyThem: flattenCategoryMap(onlyThemByCategory).length,
			bothMissing: flattenCategoryMap(bothMissingByCategory).length,
		}),
		[onlyYouByCategory, onlyThemByCategory, bothMissingByCategory]
	);

	const activeData = datasets[activeView];
	const activeTheme = VIEW_CONFIG[activeView];

	const categoryOptions = useMemo(
		() => ["All", ...Object.keys(activeData)],
		[activeData]
	);

	const normalizedQuery = searchQuery.trim().toLowerCase();

	const filteredByCategory = useMemo(() => {
		const output: Record<string, CosmeticItem[]> = {};

		Object.entries(activeData).forEach(([categoryName, items]) => {
			if (activeCategory !== "All" && activeCategory !== categoryName) {
				return;
			}

			const filteredItems = items.filter((item) => {
				const matchesType = activeType === "All" || item.type === activeType;
				const matchesSearch =
					normalizedQuery.length === 0 ||
					item.name.toLowerCase().includes(normalizedQuery);

				return matchesType && matchesSearch;
			});

			if (filteredItems.length > 0) {
				output[categoryName] = filteredItems;
			}
		});

		return output;
	}, [activeData, activeCategory, activeType, normalizedQuery]);

	const filteredTotal = useMemo(
		() => Object.values(filteredByCategory).flat().length,
		[filteredByCategory]
	);

	return (
		<div className="w-full flex flex-col items-center gap-8">
			<div className="w-full max-w-6xl rounded-3xl border border-neutral-800/80 bg-[linear-gradient(140deg,rgba(7,11,15,0.95),rgba(11,30,31,0.88))] p-4 sm:p-6 lg:p-8 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
				<div className="flex flex-col gap-3 sm:gap-4">
					<p className="text-[11px] uppercase tracking-[0.2em] text-cyan-200/80 font-semibold">
						Collection Signal
					</p>
					<h2 className="text-2xl sm:text-4xl font-black tracking-tight text-neutral-100">
						{currentUsername} vs {targetUsername}
					</h2>
					<p className="text-sm sm:text-base text-neutral-400 max-w-3xl">
						Switch comparison modes, narrow by category or type, and spot exact items
						worth chasing next.
					</p>
				</div>

				<div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
					{(Object.keys(VIEW_CONFIG) as ComparisonView[]).map((view) => {
						const config = VIEW_CONFIG[view];
						const count = totals[view];
						const selected = activeView === view;

						return (
							<button
								key={view}
								onClick={() => {
									setActiveView(view);
									setActiveCategory("All");
								}}
								className={`rounded-2xl border p-4 text-left transition-all duration-300 ${
									selected
										? config.toneClasses
										: "border-neutral-700/80 bg-neutral-900/55 text-neutral-100 hover:border-neutral-500"
								}`}
							>
								<div className="flex items-center justify-between gap-3">
									<div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] font-semibold">
										{config.icon}
										{config.label}
									</div>
									<span
										className={`text-3xl font-black ${selected ? config.countToneClasses : "text-neutral-200"}`}
									>
										{count}
									</span>
								</div>
								<p className="mt-2 text-xs text-neutral-400">{config.subtitle}</p>
							</button>
						);
					})}
				</div>
			</div>

			<div className="w-full max-w-6xl rounded-3xl border border-neutral-800/80 bg-black/55 backdrop-blur-xl p-4 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.4)] space-y-5">
				<div className="flex items-center gap-3 text-neutral-300">
					<FaWandMagicSparkles className="w-4 h-4 text-cyan-300" />
					<p className="text-xs sm:text-sm uppercase tracking-[0.22em] font-semibold">
						Comparison Controls
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
								placeholder="Search cosmetics"
								className="w-full rounded-xl border border-neutral-700 bg-neutral-950/80 py-2.5 pl-10 pr-4 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-cyan-400"
							/>
						</div>
					</label>

					<label className="flex flex-col gap-2">
						<span className="text-[10px] uppercase tracking-[0.18em] text-neutral-500 font-semibold">
							Category
						</span>
						<select
							value={activeCategory}
							onChange={(event) => setActiveCategory(event.target.value)}
							className="w-full rounded-xl border border-neutral-700 bg-neutral-950/80 px-3 py-2.5 text-sm text-neutral-100 focus:outline-none focus:border-cyan-400"
						>
							{categoryOptions.map((category) => (
								<option key={category} value={category}>
									{category}
								</option>
							))}
						</select>
					</label>

					<label className="flex flex-col gap-2">
						<span className="text-[10px] uppercase tracking-[0.18em] text-neutral-500 font-semibold">
							Type
						</span>
						<select
							value={activeType}
							onChange={(event) => setActiveType(event.target.value)}
							className="w-full rounded-xl border border-neutral-700 bg-neutral-950/80 px-3 py-2.5 text-sm text-neutral-100 focus:outline-none focus:border-cyan-400"
						>
							{["All", ...allTypes].map((type) => (
								<option key={type} value={type}>
									{type}
								</option>
							))}
						</select>
					</label>
				</div>

				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-neutral-800 pt-4">
					<div className="flex items-center gap-2 text-neutral-400 text-xs uppercase tracking-[0.16em] font-semibold">
						<FaFilter className="text-neutral-500" />
						<span>Current View</span>
					</div>
					<div className="flex flex-wrap gap-2">
						{(Object.keys(VIEW_CONFIG) as ComparisonView[]).map((view) => {
							const selected = activeView === view;
							return (
								<button
									key={view}
									onClick={() => {
										setActiveView(view);
										setActiveCategory("All");
									}}
									className={`rounded-full border px-4 py-2 text-[11px] uppercase tracking-[0.15em] font-semibold transition-colors ${
										selected
											? VIEW_CONFIG[view].pillClasses
											: "border-neutral-700 bg-neutral-900/60 text-neutral-400 hover:border-neutral-500 hover:text-neutral-200"
									}`}
								>
									{VIEW_CONFIG[view].label}
								</button>
							);
						})}
					</div>
				</div>

				<div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-800 pt-4">
					<div className="text-xs text-neutral-400 uppercase tracking-[0.18em] font-semibold">
						Showing {filteredTotal} item{filteredTotal === 1 ? "" : "s"}
					</div>
					<button
						onClick={() => {
							setSearchQuery("");
							setActiveCategory("All");
							setActiveType("All");
						}}
						className="rounded-full border border-neutral-700 bg-neutral-900/70 px-4 py-2 text-[11px] uppercase tracking-[0.16em] font-semibold text-neutral-300 hover:border-neutral-500 hover:text-neutral-100 transition-colors"
					>
						Reset Filters
					</button>
				</div>
			</div>

			{filteredTotal === 0 ? (
				<div className="w-full max-w-6xl rounded-3xl border border-dashed border-neutral-700 bg-neutral-950/45 px-6 py-16 text-center">
					<p className="text-sm uppercase tracking-[0.18em] text-neutral-400 font-semibold">
						No cosmetics found
					</p>
					<p className="mt-2 text-neutral-500">
						Try another view, category, type, or search term.
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
										{activeTheme.label}
									</p>
								</div>
								<span
									className={`rounded-full border px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] font-semibold ${activeTheme.pillClasses}`}
								>
									{items.length} result{items.length === 1 ? "" : "s"}
								</span>
							</div>

							<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-5">
								{items.map((item) => (
									<div
										key={`${activeView}-${item.id}`}
										className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 ${activeTheme.cardClasses}`}
									>
										<div
											className={`absolute inset-x-0 top-0 h-1 ${activeTheme.bannerClasses}`}
										/>

										<Link
											href={`/missing-cosmetics?cosmeticId=${item.id}`}
											title="Find friends missing this"
											className="absolute left-2 top-2 z-20 rounded-lg border border-neutral-700 bg-black/65 p-1.5 text-neutral-300 transition-colors md:opacity-0 md:group-hover:opacity-100 hover:border-emerald-300 hover:text-emerald-200"
										>
											<FaMagnifyingGlass className="w-3 h-3" />
										</Link>

										<div className="absolute right-2 top-2 z-20 rounded-lg border border-neutral-700 bg-black/65 p-1.5 text-neutral-300">
											{activeTheme.icon}
										</div>

										<div className="relative aspect-square w-full bg-neutral-950/70 p-4">
											<div
												className={`relative h-full w-full transition-all duration-500 ${
													activeView === "bothMissing"
														? "grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100"
														: "drop-shadow-[0_0_14px_rgba(186,230,253,0.45)] group-hover:scale-110"
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

										<div className="border-t border-neutral-800/70 bg-neutral-900/80 px-3 py-3">
											<p className="line-clamp-2 text-center text-[11px] sm:text-xs uppercase tracking-[0.13em] font-semibold text-neutral-200">
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
