"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FaFilter, FaLock, FaMagnifyingGlass, FaUser, FaUsers } from "react-icons/fa6";
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
		toneClasses: string;
		countToneClasses: string;
		cardClasses: string;
		bannerClasses: string;
		icon: React.ReactNode;
	}
> = {
	onlyYou: {
		label: "Only You Have",
		toneClasses:
			"bg-emerald-900/30 border-emerald-500 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.12)]",
		countToneClasses: "text-emerald-400",
		cardClasses:
			"border-emerald-500/40 hover:border-emerald-400 hover:shadow-[0_0_25px_rgba(16,185,129,0.2)]",
		bannerClasses: "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.7)]",
		icon: <FaUser className="w-3 h-3" />,
	},
	onlyThem: {
		label: "Only They Have",
		toneClasses:
			"bg-blue-900/30 border-blue-500 text-blue-300 shadow-[0_0_12px_rgba(59,130,246,0.12)]",
		countToneClasses: "text-blue-400",
		cardClasses:
			"border-blue-500/40 hover:border-blue-400 hover:shadow-[0_0_25px_rgba(59,130,246,0.2)]",
		bannerClasses: "bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.7)]",
		icon: <FaUsers className="w-3 h-3" />,
	},
	bothMissing: {
		label: "Both Missing",
		toneClasses:
			"bg-red-900/25 border-red-500 text-red-300 shadow-[0_0_12px_rgba(239,68,68,0.12)]",
		countToneClasses: "text-red-400",
		cardClasses:
			"border-red-500/35 hover:border-red-400 hover:shadow-[0_0_25px_rgba(239,68,68,0.2)]",
		bannerClasses: "bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.7)]",
		icon: <FaLock className="w-3 h-3" />,
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

	const filteredByCategory = useMemo(() => {
		const normalizedQuery = searchQuery.trim().toLowerCase();
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
	}, [activeData, activeCategory, activeType, searchQuery]);

	const filteredTotal = useMemo(
		() => Object.values(filteredByCategory).flat().length,
		[filteredByCategory]
	);

	return (
		<div className="w-full flex flex-col items-center">
			{/* Summary Cards */}
			<div className="w-full max-w-6xl mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
				<button
					onClick={() => {
						setActiveView("onlyYou");
						setActiveCategory("All");
					}}
					className={`p-4 border rounded-sm text-left transition-all duration-300 ${
						activeView === "onlyYou"
							? VIEW_CONFIG.onlyYou.toneClasses
							: "border-neutral-800 bg-neutral-900/40 hover:border-neutral-600"
					}`}
				>
					<p className="text-[10px] uppercase tracking-widest font-bold text-neutral-500">
						{currentUsername} has, {targetUsername} missing
					</p>
					<p
						className={`text-2xl font-black mt-2 ${
							activeView === "onlyYou"
								? VIEW_CONFIG.onlyYou.countToneClasses
								: "text-neutral-300"
						}`}
					>
						{totals.onlyYou}
					</p>
				</button>

				<button
					onClick={() => {
						setActiveView("onlyThem");
						setActiveCategory("All");
					}}
					className={`p-4 border rounded-sm text-left transition-all duration-300 ${
						activeView === "onlyThem"
							? VIEW_CONFIG.onlyThem.toneClasses
							: "border-neutral-800 bg-neutral-900/40 hover:border-neutral-600"
					}`}
				>
					<p className="text-[10px] uppercase tracking-widest font-bold text-neutral-500">
						{targetUsername} has, {currentUsername} missing
					</p>
					<p
						className={`text-2xl font-black mt-2 ${
							activeView === "onlyThem"
								? VIEW_CONFIG.onlyThem.countToneClasses
								: "text-neutral-300"
						}`}
					>
						{totals.onlyThem}
					</p>
				</button>

				<button
					onClick={() => {
						setActiveView("bothMissing");
						setActiveCategory("All");
					}}
					className={`p-4 border rounded-sm text-left transition-all duration-300 ${
						activeView === "bothMissing"
							? VIEW_CONFIG.bothMissing.toneClasses
							: "border-neutral-800 bg-neutral-900/40 hover:border-neutral-600"
					}`}
				>
					<p className="text-[10px] uppercase tracking-widest font-bold text-neutral-500">
						Both still missing
					</p>
					<p
						className={`text-2xl font-black mt-2 ${
							activeView === "bothMissing"
								? VIEW_CONFIG.bothMissing.countToneClasses
								: "text-neutral-300"
						}`}
					>
						{totals.bothMissing}
					</p>
				</button>
			</div>

			{/* View/Filter Bar */}
			<div className="w-full max-w-6xl mb-8 flex flex-col gap-4 bg-black/60 border border-neutral-800 p-4 rounded-sm shadow-xl">
				<div className="flex flex-col sm:flex-row items-center justify-between gap-4">
					<div className="flex items-center gap-3 text-neutral-400 font-bold uppercase tracking-widest text-xs">
						<FaFilter className="text-neutral-500" />
						<span>Compare View</span>
					</div>

					<div className="flex flex-wrap items-center justify-center sm:justify-end gap-2">
						{(Object.keys(VIEW_CONFIG) as ComparisonView[]).map((view) => (
							<button
								key={view}
								onClick={() => {
									setActiveView(view);
									setActiveCategory("All");
								}}
								className={`px-3 py-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded-sm transition-all duration-300 border flex items-center gap-2 ${
									activeView === view
										? VIEW_CONFIG[view].toneClasses
										: "bg-neutral-900/50 border-neutral-800 text-neutral-500 hover:border-neutral-500 hover:text-neutral-300"
								}`}
							>
								{VIEW_CONFIG[view].icon}
								{VIEW_CONFIG[view].label}
							</button>
						))}
					</div>
				</div>

				<div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-neutral-800/80 pt-4">
					<div className="flex items-center gap-3 text-neutral-400 font-bold uppercase tracking-widest text-xs">
						<FaFilter className="text-neutral-500" />
						<span>Category</span>
					</div>
					<div className="flex flex-wrap items-center justify-center sm:justify-end gap-2">
						{categoryOptions.map((category) => (
							<button
								key={category}
								onClick={() => setActiveCategory(category)}
								className={`px-3 py-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded-sm transition-all duration-300 border ${
									activeCategory === category
										? activeTheme.toneClasses
										: "bg-neutral-900/50 border-neutral-800 text-neutral-500 hover:border-neutral-500 hover:text-neutral-300"
								}`}
							>
								{category}
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
						{["All", ...allTypes].map((type) => (
							<button
								key={type}
								onClick={() => setActiveType(type)}
								className={`px-3 py-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded-sm transition-all duration-300 border ${
									activeType === type
										? activeTheme.toneClasses
										: "bg-neutral-900/50 border-neutral-800 text-neutral-500 hover:border-neutral-500 hover:text-neutral-300"
								}`}
							>
								{type}
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
							value={searchQuery}
							onChange={(event) => setSearchQuery(event.target.value)}
							placeholder="Search cosmetics..."
							className="w-full bg-neutral-900/50 border border-neutral-800 text-neutral-200 text-sm px-4 py-2 rounded-sm focus:outline-none focus:border-neutral-500 transition-colors placeholder:text-neutral-600"
						/>
					</div>
				</div>
			</div>

			{/* Current Totals */}
			<div className="w-full max-w-6xl mb-8 flex justify-end">
				<div className="px-4 py-2 bg-neutral-900/80 border border-neutral-700 rounded-sm inline-flex items-center gap-3 shadow-md">
					<span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
						Showing
					</span>
					<span className={`text-lg font-black ${activeTheme.countToneClasses}`}>
						{filteredTotal}
					</span>
					<span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">
						{VIEW_CONFIG[activeView].label}
					</span>
				</div>
			</div>

			{/* Results */}
			{filteredTotal === 0 ? (
				<div className="w-full max-w-6xl text-center py-16 border border-dashed border-neutral-800 rounded-sm bg-neutral-950/30">
					<p className="text-neutral-400 font-bold uppercase tracking-widest mb-2">
						No Cosmetics Found
					</p>
					<p className="text-neutral-500 font-medium italic">
						Try changing the view, filters, or search term.
					</p>
				</div>
			) : (
				<div className="w-full max-w-6xl space-y-16">
					{Object.entries(filteredByCategory).map(([categoryName, items]) => (
						<section key={categoryName} className="w-full">
							<div className="flex flex-col sm:flex-row items-start sm:items-end justify-between border-b border-neutral-800/80 pb-3 mb-6 gap-2">
								<h2 className="text-2xl sm:text-3xl font-black tracking-tighter text-transparent bg-clip-text bg-linear-to-b from-neutral-200 to-neutral-600 uppercase">
									{categoryName}
								</h2>
								<span className="text-sm font-bold text-neutral-500 tracking-widest">
									{items.length} Results
								</span>
							</div>

							<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
								{items.map((item) => (
									<div
										key={`${activeView}-${item.id}`}
										className={`group relative flex flex-col items-center bg-black border rounded-sm overflow-hidden transition-all duration-300 cursor-default ${activeTheme.cardClasses}`}
									>
										<div
											className={`absolute top-0 inset-x-0 h-1 z-20 transition-colors ${activeTheme.bannerClasses}`}
										/>

										<Link
											href={`/missing-cosmetics?cosmeticId=${item.id}`}
											title="Find friends missing this"
											className="absolute top-2 left-2 z-20 p-1.5 rounded-sm backdrop-blur-md border bg-black/60 border-neutral-800 text-neutral-500 hover:text-emerald-400 hover:border-emerald-500 transition-all opacity-0 group-hover:opacity-100"
										>
											<FaMagnifyingGlass className="w-3 h-3" />
										</Link>

										<div className="absolute top-2 right-2 z-20 p-1.5 rounded-sm backdrop-blur-md border bg-black/60 border-neutral-800 text-neutral-500 transition-colors group-hover:border-neutral-600">
											{activeView === "bothMissing" ? (
												<FaLock className="w-3 h-3" />
											) : (
												VIEW_CONFIG[activeView].icon
											)}
										</div>

										<div className="relative w-full aspect-square bg-neutral-950/50 flex items-center justify-center p-4">
											<div
												className={`relative w-full h-full transition-all duration-500 ${
													activeView === "bothMissing"
														? "grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100"
														: "drop-shadow-[0_0_12px_rgba(255,255,255,0.28)] group-hover:scale-110"
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

										<div className="w-full p-3 bg-neutral-900/80 border-t border-neutral-800/80 mt-auto">
											<p className="text-center text-[10px] sm:text-xs font-bold uppercase tracking-widest leading-tight text-neutral-200 group-hover:text-white transition-colors">
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
