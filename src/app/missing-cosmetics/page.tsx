"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import {
	FaArrowLeft,
	FaMagnifyingGlass,
	FaShirt,
	FaUsers,
	FaWandMagicSparkles,
} from "react-icons/fa6";
import { useDebounce } from "use-debounce";
import { useApi } from "../../hooks/useApi";
import { useOnClickOutside } from "../../hooks/useOnClickOutside";
import { getUserAvatarUrl } from "../../lib/avatar";
import { allCosmetics, type CosmeticItem } from "../../lib/cosmetics";

interface FriendResult {
	id: string;
	username: string;
	profilePictureId: string | null;
	steamAvatarUrl: string | null;
	useSteamAvatar: boolean;
	discordAvatarUrl: string | null;
	useDiscordAvatar: boolean;
}

function MissingCosmeticsContent() {
	const searchParams = useSearchParams();
	const initialCosmeticId = searchParams.get("cosmeticId");

	const initialCosmetic = useMemo(
		() =>
			initialCosmeticId
				? allCosmetics.find((cosmetic) => cosmetic.id === parseInt(initialCosmeticId, 10)) || null
				: null,
		[initialCosmeticId]
	);

	const [searchQuery, setSearchQuery] = useState<string>(initialCosmetic?.name || "");
	const [debouncedQuery] = useDebounce(searchQuery, 250);
	const [selectedCosmetic, setSelectedCosmetic] = useState<CosmeticItem | null>(initialCosmetic);
	const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	useOnClickOutside(dropdownRef, () => setIsDropdownOpen(false));

	const {
		data,
		loading,
		error,
		execute,
		setData: setMissingFriends,
	} = useApi<FriendResult[]>();
	const missingFriends = data || [];

	const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const value = event.target.value;
		setSearchQuery(value);
		setIsDropdownOpen(true);
		if (selectedCosmetic && value !== selectedCosmetic.name) {
			setSelectedCosmetic(null);
			setMissingFriends([]);
		}
	};

	const handleSelectCosmetic = (cosmetic: CosmeticItem) => {
		setSelectedCosmetic(cosmetic);
		setSearchQuery(cosmetic.name);
		setIsDropdownOpen(false);
	};

	const filteredCosmetics =
		debouncedQuery && !selectedCosmetic
			? allCosmetics
					.filter((cosmetic) =>
						cosmetic.name.toLowerCase().includes(debouncedQuery.toLowerCase())
					)
					.slice(0, 10)
			: [];

	useEffect(() => {
		if (!selectedCosmetic) {
			setMissingFriends([]);
			return;
		}

		execute(`/api/missing-cosmetics?cosmeticId=${selectedCosmetic.id}`).catch(() => {
			setMissingFriends([]);
		});
	}, [selectedCosmetic, execute, setMissingFriends]);

	return (
		<main className="min-h-screen text-neutral-200 px-4 sm:px-6 py-8 sm:py-12 relative z-10 selection:bg-neutral-800/50 selection:text-neutral-200">
			<div className="mx-auto w-full max-w-6xl space-y-6 sm:space-y-8">
				<div className="rounded-3xl border border-neutral-800/80 bg-[linear-gradient(135deg,rgba(6,10,14,0.95),rgba(18,31,38,0.88))] p-4 sm:p-6 lg:p-8 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
					<div className="flex flex-col gap-4 sm:gap-6">
						<div>
							<Link
								href="/dashboard"
								className="inline-flex items-center gap-2 rounded-full border border-neutral-700 bg-black/35 px-4 py-2 text-[11px] uppercase tracking-[0.16em] font-semibold text-neutral-300 hover:border-neutral-500 hover:text-neutral-100 transition-colors"
							>
								<FaArrowLeft className="w-3 h-3" />
								Return to Safehouse
							</Link>
						</div>

						<div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-5 sm:gap-6">
							<div>
								<p className="text-[11px] uppercase tracking-[0.2em] text-cyan-200/80 font-semibold mb-3">
									Friend Inventory Finder
								</p>
								<h1 className="text-2xl sm:text-4xl font-black tracking-tight text-neutral-100 leading-tight">
									Who still needs this cosmetic?
								</h1>
								<p className="text-sm sm:text-base text-neutral-400 mt-3 max-w-2xl">
									Pick a cosmetic and instantly see which friends are still missing it.
								</p>
							</div>

							<div className="rounded-2xl border border-cyan-400/25 bg-cyan-500/10 p-4 sm:p-5">
								<p className="text-[10px] uppercase tracking-[0.18em] text-cyan-200/75 font-semibold">
									Current Selection
								</p>
								{selectedCosmetic ? (
									<div className="mt-3 flex items-center gap-3">
										<div className="relative h-14 w-14 rounded-xl border border-cyan-300/40 bg-black/40 p-2">
											<Image
												src={`/images/cosmetics/${selectedCosmetic.id}.png`}
												alt={selectedCosmetic.name}
												fill
												className="object-contain"
												sizes="56px"
											/>
										</div>
										<div>
											<p className="text-sm uppercase tracking-[0.14em] text-cyan-100 font-semibold">
												{selectedCosmetic.name}
											</p>
											<p className="text-xs text-cyan-100/65">Tracking friend ownership now</p>
										</div>
									</div>
								) : (
									<p className="mt-3 text-sm text-cyan-100/70">
										Choose an item below to start searching.
									</p>
								)}
							</div>
						</div>
					</div>
				</div>

				<div className="rounded-3xl border border-neutral-800/80 bg-black/55 backdrop-blur-xl p-4 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
					<div className="relative" ref={dropdownRef}>
						<label className="flex flex-col gap-2">
							<span className="text-[10px] uppercase tracking-[0.18em] text-neutral-500 font-semibold">
								Search Cosmetic
							</span>
							<div className="relative">
								<FaMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 w-4 h-4" />
								<input
									type="text"
									placeholder="Type cosmetic name"
									value={searchQuery}
									onChange={handleSearchChange}
									onFocus={() => setIsDropdownOpen(true)}
									className="w-full rounded-xl border border-neutral-700 bg-neutral-950/80 py-3 pl-10 pr-4 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-cyan-400"
								/>
							</div>
						</label>

						{isDropdownOpen && filteredCosmetics.length > 0 && (
							<div className="absolute top-full left-0 right-0 z-30 mt-2 max-h-72 overflow-y-auto rounded-2xl border border-neutral-700 bg-neutral-900/95 shadow-2xl">
								{filteredCosmetics.map((cosmetic) => (
									<button
										key={cosmetic.id}
										onClick={() => handleSelectCosmetic(cosmetic)}
										className="flex w-full items-center gap-3 border-b border-neutral-800 px-4 py-3 text-left transition-colors hover:bg-neutral-800/90"
									>
										<div className="relative h-9 w-9 rounded-lg border border-neutral-700 bg-black/45 p-1.5">
											<Image
												src={`/images/cosmetics/${cosmetic.id}.png`}
												alt={cosmetic.name}
												fill
												className="object-contain"
												sizes="36px"
											/>
										</div>
										<span className="text-sm font-semibold uppercase tracking-[0.12em] text-neutral-200">
											{cosmetic.name}
										</span>
									</button>
								))}
							</div>
						)}
					</div>
				</div>

				<div className="rounded-3xl border border-neutral-800/80 bg-neutral-950/45 p-4 sm:p-6 lg:p-8 shadow-[0_18px_45px_rgba(0,0,0,0.35)] min-h-80">
					{loading && (
						<div className="flex h-full min-h-64 flex-col items-center justify-center gap-4">
							<span className="relative flex h-5 w-5">
								<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-300 opacity-70" />
								<span className="relative inline-flex h-5 w-5 rounded-full bg-cyan-200" />
							</span>
							<p className="text-xs uppercase tracking-[0.2em] text-neutral-400 font-semibold">Checking wardrobes...</p>
						</div>
					)}

					{error && !loading && (
						<div className="flex h-full min-h-64 items-center justify-center rounded-2xl border border-rose-500/30 bg-rose-500/10 px-6 text-center">
							<p className="text-sm uppercase tracking-[0.15em] text-rose-200 font-semibold">{error}</p>
						</div>
					)}

					{!loading && !error && !selectedCosmetic && (
						<div className="flex h-full min-h-64 flex-col items-center justify-center text-center px-6">
							<div className="mb-4 rounded-full border border-neutral-700 bg-neutral-900/70 p-4">
								<FaWandMagicSparkles className="w-6 h-6 text-neutral-300" />
							</div>
							<p className="text-sm uppercase tracking-[0.18em] text-neutral-300 font-semibold">Select a cosmetic</p>
							<p className="mt-2 text-neutral-500">Search above and pick one item to see who is still missing it.</p>
						</div>
					)}

					{!loading && !error && selectedCosmetic && missingFriends.length === 0 && (
						<div className="flex h-full min-h-64 flex-col items-center justify-center text-center rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-6">
							<div className="mb-4 rounded-full border border-emerald-400/40 bg-emerald-500/20 p-4">
								<FaShirt className="w-7 h-7 text-emerald-200" />
							</div>
							<p className="text-sm uppercase tracking-[0.18em] text-emerald-200 font-semibold">Everyone has it</p>
							<p className="mt-2 text-emerald-100/80">All of your friends already own {selectedCosmetic.name}.</p>
						</div>
					)}

					{!loading && !error && selectedCosmetic && missingFriends.length > 0 && (
						<div className="space-y-5">
							<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-neutral-800/70 pb-4">
								<div>
									<p className="text-xs uppercase tracking-[0.18em] text-neutral-400 font-semibold">Missing Friends</p>
									<h3 className="mt-1 text-lg sm:text-xl font-black uppercase tracking-[0.08em] text-neutral-100">
										{selectedCosmetic.name}
									</h3>
								</div>
								<span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/45 bg-cyan-500/15 px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] text-cyan-200 font-semibold">
									<FaUsers className="w-3 h-3" />
									{missingFriends.length} found
								</span>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
								{missingFriends.map((friend) => (
									<Link
										key={friend.id}
										href={`/profile/${friend.username}`}
										className="group flex items-center gap-3 rounded-2xl border border-neutral-700 bg-neutral-900/70 p-3 sm:p-4 transition-all duration-300 hover:border-cyan-300 hover:bg-neutral-900"
									>
										<div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-neutral-700 bg-neutral-950">
											<Image
												src={getUserAvatarUrl(friend)}
												alt={friend.username}
												fill
												className="object-cover transition-transform duration-500 group-hover:scale-110"
												sizes="48px"
											/>
										</div>
										<div className="min-w-0">
											<p className="truncate text-sm font-semibold text-neutral-100 group-hover:text-cyan-100">
												{friend.username}
											</p>
											<p className="mt-0.5 text-[10px] uppercase tracking-[0.16em] text-neutral-500 group-hover:text-cyan-200/80">
												Open profile
											</p>
										</div>
									</Link>
								))}
							</div>
						</div>
					)}
				</div>
			</div>
		</main>
	);
}

export default function MissingCosmeticsPage() {
	return (
		<Suspense
			fallback={
				<main className="min-h-screen text-neutral-200 flex flex-col items-center py-12 px-6 relative z-10 selection:bg-neutral-800/50 selection:text-neutral-200">
					<div className="w-full h-full flex flex-col items-center justify-center space-y-4 py-12">
						<span className="text-xs text-neutral-500 font-bold uppercase tracking-widest">Loading...</span>
					</div>
				</main>
			}
		>
			<MissingCosmeticsContent />
		</Suspense>
	);
}
