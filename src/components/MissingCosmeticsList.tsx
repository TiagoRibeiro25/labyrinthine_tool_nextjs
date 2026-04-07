"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FaLock, FaFilter, FaMagnifyingGlass } from "react-icons/fa6";
import { CosmeticItem, allTypes } from "../lib/cosmetics";

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

	const filterOptions = ["All", ...Object.keys(missingByCategory)];
	const typeFilterOptions = ["All", ...allTypes];

	return (
		<div className="w-full flex flex-col items-center">
			{totalMissing > 0 && (
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
				</div>
			)}

			{/* Statistics */}
			<div className="w-full max-w-6xl mb-8 flex justify-end">
				<div className="px-4 py-2 bg-neutral-900/80 border border-neutral-700 rounded-sm inline-flex items-center gap-3 shadow-md">
					<span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
						Total Missing
					</span>
					<span className="text-lg font-black text-red-500">{totalMissing}</span>
				</div>
			</div>

			{totalMissing === 0 ? (
				<div className="w-full text-center py-20 border border-dashed border-neutral-800 rounded-sm bg-neutral-950/30 max-w-6xl">
					<p className="text-emerald-500 font-bold tracking-widest uppercase mb-2">
						Collection Complete!
					</p>
					<p className="text-neutral-500 font-medium italic">
						This survivor has braved the fog and collected every item.
					</p>
				</div>
			) : (
				<div className="w-full max-w-6xl space-y-16">
					{Object.entries(missingByCategory).map(([categoryName, items]) => {
						if (activeFilter !== "All" && activeFilter !== categoryName) {
							return null;
						}

						const filteredItems =
							activeTypeFilter === "All"
								? items
								: items.filter((i) => i.type === activeTypeFilter);

						if (filteredItems.length === 0) {
							return null;
						}

						return (
							<section key={categoryName} className="w-full">
								<div className="flex items-end justify-between border-b border-neutral-800/80 pb-3 mb-6">
									<h2 className="text-2xl sm:text-3xl font-black tracking-tighter text-transparent bg-clip-text bg-linear-to-b from-neutral-200 to-neutral-600 uppercase">
										{categoryName}
									</h2>
									<span className="text-sm font-bold text-neutral-500 tracking-widest">
										{filteredItems.length} Missing
									</span>
								</div>

								<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
									{filteredItems.map((item) => (
										<div
											key={item.id}
											className="group relative flex flex-col items-center bg-black border border-neutral-800 rounded-sm overflow-hidden transition-all duration-300 hover:border-neutral-500 hover:-translate-y-1 cursor-default"
										>
											<div className="absolute top-0 inset-x-0 h-1 z-20 transition-colors bg-red-900/50 group-hover:bg-red-800" />
											<Link
												href={`/missing-cosmetics?cosmeticId=${item.id}`}
												title="Find friends missing this"
												className="absolute top-2 left-2 z-20 p-1.5 rounded-sm backdrop-blur-md border bg-black/60 border-neutral-800 text-neutral-500 hover:text-emerald-400 hover:border-emerald-500 transition-all opacity-0 group-hover:opacity-100"
											>
												<FaMagnifyingGlass className="w-3 h-3" />
											</Link>
											<div className="absolute top-2 right-2 z-20 p-1.5 rounded-sm backdrop-blur-md border bg-black/60 border-neutral-800 text-neutral-500 transition-colors group-hover:border-neutral-600">
												<FaLock className="w-3 h-3" />
											</div>
											<div className="relative w-full aspect-square bg-neutral-950/50 flex items-center justify-center p-4">
												<div className="relative w-full h-full transition-all duration-500 grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100">
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
											<div className="w-full p-3 bg-neutral-900/80 border-t border-neutral-800/80 mt-auto transition-colors group-hover:bg-neutral-800/80">
												<p className="text-center text-[10px] sm:text-xs font-bold uppercase tracking-widest leading-tight text-neutral-500 group-hover:text-neutral-300">
													{item.name}
												</p>
											</div>
										</div>
									))}
								</div>
							</section>
						);
					})}
				</div>
			)}
		</div>
	);
}
