"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FaArrowLeft, FaMedal, FaTrophy } from "react-icons/fa6";
import { LEADERBOARD_PAGE_SIZE } from "../../constants/pagination";
import { useApi } from "../../hooks/useApi";
import { getUserAvatarUrl } from "../../lib/avatar";

interface LeaderboardEntry {
	id: string;
	username: string;
	profilePictureId: string | null;
	steamAvatarUrl: string | null;
	useSteamAvatar: boolean;
	discordAvatarUrl: string | null;
	useDiscordAvatar: boolean;
	cosmeticsCount: number;
}

interface LeaderboardPagination {
	page: number;
	limit: number;
	totalItems: number;
	totalPages: number;
	hasNextPage: boolean;
	hasPreviousPage: boolean;
}

interface LeaderboardResponse {
	data: LeaderboardEntry[];
	pagination: LeaderboardPagination;
}

export default function LeaderboardPage() {
	const [currentPage, setCurrentPage] = useState<number>(1);
	const { data, loading, error, execute } = useApi<LeaderboardResponse>();
	const leaderboard = data?.data || [];
	const pagination = data?.pagination;

	const totalPages = pagination?.totalPages ?? 1;
	const hasNextPage = pagination?.hasNextPage ?? false;
	const hasPreviousPage = pagination?.hasPreviousPage ?? currentPage > 1;
	const currentPageFromApi = pagination?.page ?? currentPage;
	const pageSize = pagination?.limit ?? LEADERBOARD_PAGE_SIZE;

	useEffect(() => {
		execute(
			`/api/leaderboard?page=${currentPage}&limit=${LEADERBOARD_PAGE_SIZE}`
		).catch(() => {});
	}, [currentPage, execute]);

	const getRankColor = (index: number) => {
		switch (index) {
			case 0:
				return "text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]";
			case 1:
				return "text-neutral-300 drop-shadow-[0_0_10px_rgba(212,212,216,0.5)]";
			case 2:
				return "text-amber-600 drop-shadow-[0_0_10px_rgba(217,119,6,0.5)]";
			default:
				return "text-neutral-500";
		}
	};

	return (
		<main className="min-h-screen text-neutral-200 flex flex-col items-center py-8 sm:py-12 px-4 sm:px-6 relative z-10 selection:bg-neutral-800/50 selection:text-neutral-200">
			<div className="w-full max-w-5xl rounded-3xl bg-[linear-gradient(145deg,rgba(11,10,8,0.95),rgba(29,24,15,0.9))] backdrop-blur-md border border-neutral-800/80 shadow-[0_24px_80px_rgba(0,0,0,0.45)] relative p-4 sm:p-6 lg:p-8 flex flex-col">
				<div className="mb-6">
					<Link
						href="/dashboard"
						className="inline-flex items-center gap-2 rounded-full border border-neutral-700 bg-black/35 px-4 py-2 text-[11px] uppercase tracking-[0.16em] font-semibold text-neutral-300 hover:border-neutral-500 hover:text-neutral-100 transition-colors"
					>
						<FaArrowLeft /> Return to Safehouse
					</Link>
				</div>

				<div className="mb-8 text-center border-b border-neutral-800/80 pb-6">
					<div className="flex justify-center mb-4">
						<div className="w-16 h-16 rounded-full bg-neutral-900 border border-neutral-700 flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.05)]">
							<FaTrophy className="w-8 h-8 text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
						</div>
					</div>
					<h1 className="text-3xl sm:text-5xl font-black tracking-tight text-neutral-100 uppercase mb-2">
						Top Collectors
					</h1>
					<p className="text-sm text-neutral-400 font-medium tracking-wide">
						The most dedicated survivors in the fog, ranked by their wardrobe size.
					</p>
				</div>

				<div className="flex-1 min-h-[50vh]">
					{loading && (
						<div className="w-full h-full flex flex-col items-center justify-center space-y-4 py-20">
							<span className="relative flex h-4 w-4">
								<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neutral-400 opacity-75"></span>
								<span className="relative inline-flex rounded-full h-4 w-4 bg-neutral-300"></span>
							</span>
							<span className="text-xs text-neutral-500 font-bold uppercase tracking-widest">
								Compiling ranks...
							</span>
						</div>
					)}

					{error && !loading && (
						<div className="w-full text-center py-10 text-red-500 text-sm font-bold uppercase tracking-widest">
							{error}
						</div>
					)}

					{!loading && !error && leaderboard.length === 0 && (
						<div className="w-full text-center py-12 border border-dashed border-neutral-800 rounded-2xl">
							<p className="text-neutral-500 font-medium italic">
								The leaderboard is currently empty.
							</p>
						</div>
					)}

					{!loading && !error && leaderboard.length > 0 && (
						<div className="flex flex-col space-y-3">
							{leaderboard.map((user, index) => {
								const rank = (currentPageFromApi - 1) * pageSize + index + 1;
								const rankColorClass =
									rank <= 3 ? getRankColor(rank - 1) : "text-neutral-600";

								return (
									<Link
										key={user.id}
										href={`/profile/${user.username}`}
										className="group relative flex items-center gap-4 p-4 bg-neutral-900/40 border border-neutral-800 rounded-2xl hover:bg-neutral-800 hover:border-neutral-500 transition-all duration-300"
									>
										{/* Rank Indicator */}
										<div className="flex flex-col items-center justify-center w-8 shrink-0">
											{rank <= 3 && (
												<FaMedal className={`w-6 h-6 mb-1 ${getRankColor(rank - 1)}`} />
											)}
											<span className={`text-xl font-black ${rankColorClass}`}>
												#{rank}
											</span>
										</div>

										{/* Profile Picture */}
										<div className="relative w-12 h-12 shrink-0 border border-black shadow-md overflow-hidden bg-neutral-950">
											<Image
												src={getUserAvatarUrl(user)}
												alt={user.username}
												fill
												className="object-cover group-hover:scale-110 transition-transform duration-500"
												sizes="200px"
											/>
										</div>

										{/* User Info */}
										<div className="flex flex-col min-w-0 flex-1">
											<span className="text-neutral-200 font-bold text-lg truncate group-hover:text-white transition-colors">
												{user.username}
											</span>
											<span className="text-[10px] text-neutral-500 uppercase tracking-widest font-semibold mt-0.5 group-hover:text-neutral-400 transition-colors">
												View Profile &rarr;
											</span>
										</div>

										{/* Score */}
										<div className="flex flex-col items-end shrink-0 pl-4 border-l border-neutral-800/80">
											<span className="text-2xl font-black text-emerald-500 leading-none group-hover:text-emerald-400 transition-colors">
												{user.cosmeticsCount}
											</span>
											<span className="text-[9px] font-bold uppercase tracking-widest text-neutral-500 mt-1">
												Unlocked
											</span>
										</div>
									</Link>
								);
							})}

							<div className="mt-4 flex items-center justify-between gap-3 border-t border-neutral-800/80 pt-4">
								<button
									type="button"
									onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
									disabled={loading || !hasPreviousPage}
									className="px-4 py-2 rounded-full bg-neutral-900 border border-neutral-700 text-neutral-300 text-xs font-bold uppercase tracking-[0.14em] hover:bg-neutral-800 hover:border-neutral-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
								>
									Previous
								</button>

								<div className="text-xs font-bold uppercase tracking-widest text-neutral-500">
									Page {currentPageFromApi} of {totalPages}
								</div>

								<button
									type="button"
									onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
									disabled={loading || !hasNextPage}
									className="px-4 py-2 rounded-full bg-neutral-900 border border-neutral-700 text-neutral-300 text-xs font-bold uppercase tracking-[0.14em] hover:bg-neutral-800 hover:border-neutral-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
								>
									Next
								</button>
							</div>
						</div>
					)}
				</div>
			</div>
		</main>
	);
}
