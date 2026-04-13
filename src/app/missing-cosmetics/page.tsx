"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { FaArrowLeft, FaMagnifyingGlass, FaShirt } from "react-icons/fa6";
import { useDebounce } from "use-debounce";
import { useApi } from "../../hooks/useApi";
import { useOnClickOutside } from "../../hooks/useOnClickOutside";
import { getUserAvatarUrl } from "../../lib/avatar";
import { allCosmetics, CosmeticItem } from "../../lib/cosmetics";

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

	const initialCosmetic = initialCosmeticId
		? allCosmetics.find((c) => c.id === parseInt(initialCosmeticId, 10)) || null
		: null;

	const [searchQuery, setSearchQuery] = useState<string>(initialCosmetic?.name || "");
	const [debouncedQuery] = useDebounce(searchQuery, 300);
	const [selectedCosmetic, setSelectedCosmetic] = useState<CosmeticItem | null>(
		initialCosmetic
	);
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

	// Reset selection if user starts typing again
	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchQuery(e.target.value);
		setIsDropdownOpen(true);
		if (selectedCosmetic && e.target.value !== selectedCosmetic.name) {
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
					.filter((c) => c.name.toLowerCase().includes(debouncedQuery.toLowerCase()))
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
		<main className="min-h-screen text-neutral-200 flex flex-col items-center py-12 px-6 relative z-10 selection:bg-neutral-800/50 selection:text-neutral-200">
			<div className="w-full max-w-3xl bg-black/80 backdrop-blur-md border border-neutral-800 border-t-4 border-t-neutral-600 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative p-6 sm:p-10 flex flex-col">
				<div className="mb-6">
					<Link
						href="/dashboard"
						className="text-xs text-neutral-500 font-bold uppercase tracking-widest hover:text-neutral-300 transition-colors flex items-center justify-center sm:justify-start gap-2"
					>
						<FaArrowLeft /> Return to Safehouse
					</Link>
				</div>

				<div className="mb-8 text-center sm:text-left border-b border-neutral-800/80 pb-6">
					<h1 className="text-3xl sm:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-linear-to-b from-neutral-100 to-neutral-500 uppercase mb-2 flex items-center justify-center sm:justify-start gap-4">
						Missing Cosmetics
					</h1>
					<p className="text-sm text-neutral-400 font-medium tracking-wide">
						Search for a cosmetic to see which of your friends still need it.
					</p>
				</div>

				<div className="relative mb-8 z-20" ref={dropdownRef}>
					<div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
						<FaMagnifyingGlass className="text-neutral-500 w-5 h-5" />
					</div>
					<input
						type="text"
						placeholder="Search for a cosmetic..."
						value={searchQuery}
						onChange={handleSearchChange}
						onFocus={() => setIsDropdownOpen(true)}
						className="w-full bg-neutral-900/50 border-2 border-neutral-800 text-neutral-100 pl-12 pr-4 py-4 rounded-sm focus:outline-none focus:border-neutral-500 focus:bg-neutral-900 transition-all font-medium tracking-wide placeholder:text-neutral-600 shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)]"
					/>

					{/* Autocomplete Dropdown */}
					{isDropdownOpen && filteredCosmetics.length > 0 && (
						<div className="absolute top-full left-0 right-0 mt-2 bg-neutral-900 border border-neutral-700 rounded-sm shadow-2xl overflow-hidden max-h-64 overflow-y-auto">
							{filteredCosmetics.map((cosmetic) => (
								<button
									key={cosmetic.id}
									onClick={() => handleSelectCosmetic(cosmetic)}
									className="w-full text-left px-4 py-3 border-b border-neutral-800 hover:bg-neutral-800 transition-colors flex items-center gap-3 cursor-pointer"
								>
									<div className="w-8 h-8 relative bg-black border border-neutral-700 rounded-sm overflow-hidden shrink-0 p-1">
										<Image
											src={`/images/cosmetics/${cosmetic.id}.png`}
											alt={cosmetic.name}
											fill
											className="object-contain"
											sizes="32px"
										/>
									</div>
									<span className="text-sm font-bold uppercase tracking-widest text-neutral-300">
										{cosmetic.name}
									</span>
								</button>
							))}
						</div>
					)}
				</div>

				<div className="flex-1 min-h-75">
					{loading && (
						<div className="w-full h-full flex flex-col items-center justify-center space-y-4 py-12">
							<span className="relative flex h-4 w-4">
								<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neutral-400 opacity-75"></span>
								<span className="relative inline-flex rounded-full h-4 w-4 bg-neutral-300"></span>
							</span>
							<span className="text-xs text-neutral-500 font-bold uppercase tracking-widest">
								Checking wardrobes...
							</span>
						</div>
					)}

					{error && !loading && (
						<div className="w-full text-center py-10 text-red-500 text-sm font-bold uppercase tracking-widest">
							{error}
						</div>
					)}

					{!loading && !error && selectedCosmetic && missingFriends.length === 0 && (
						<div className="w-full text-center py-12 border border-dashed border-neutral-800 rounded-sm bg-neutral-900/20">
							<div className="w-16 h-16 mx-auto mb-4 bg-emerald-950/50 border border-emerald-900 rounded-full flex items-center justify-center">
								<FaShirt className="w-8 h-8 text-emerald-500" />
							</div>
							<p className="text-emerald-500 font-medium tracking-wide">
								All of your friends already have this cosmetic!
							</p>
						</div>
					)}

					{!loading && !error && selectedCosmetic && missingFriends.length > 0 && (
						<div>
							<div className="mb-4 flex items-center justify-between border-b border-neutral-800/50 pb-2">
								<h3 className="text-sm font-bold uppercase tracking-widest text-neutral-400">
									Friends missing{" "}
									<span className="text-white">{selectedCosmetic.name}</span>
								</h3>
								<span className="text-xs font-bold bg-neutral-800 px-2 py-1 rounded-sm text-neutral-300">
									{missingFriends.length} Found
								</span>
							</div>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								{missingFriends.map((friend) => (
									<Link
										key={friend.id}
										href={`/profile/${friend.username}`}
										className="group flex items-center gap-4 p-4 bg-neutral-900/40 border border-neutral-800 rounded-sm hover:bg-neutral-800 hover:border-neutral-500 transition-all duration-300"
									>
										<div className="relative w-12 h-12 shrink-0 border border-black shadow-md overflow-hidden bg-neutral-950">
											<Image
												src={getUserAvatarUrl(friend)}
												alt={friend.username}
												fill
												className="object-cover group-hover:scale-110 transition-transform duration-500"
												sizes="200px"
											/>
										</div>
										<div className="flex flex-col min-w-0">
											<span className="text-neutral-200 font-bold truncate group-hover:text-white transition-colors">
												{friend.username}
											</span>
											<span className="text-[10px] text-neutral-500 uppercase tracking-widest font-semibold mt-0.5 group-hover:text-neutral-400 transition-colors">
												View Profile &rarr;
											</span>
										</div>
									</Link>
								))}
							</div>
						</div>
					)}

					{!loading && !selectedCosmetic && (
						<div className="w-full text-center py-12 border border-dashed border-neutral-800 rounded-sm">
							<p className="text-neutral-500 font-medium italic">
								Search and select a cosmetic to see who needs it.
							</p>
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
						<span className="text-xs text-neutral-500 font-bold uppercase tracking-widest">
							Loading...
						</span>
					</div>
				</main>
			}
		>
			<MissingCosmeticsContent />
		</Suspense>
	);
}
