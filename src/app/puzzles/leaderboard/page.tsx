"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FaArrowLeft, FaLightbulb, FaPuzzlePiece, FaTrophy } from "react-icons/fa6";
import { type PuzzleType } from "../../../constants/puzzles";
import { useApi } from "../../../hooks/useApi";
import { getUserAvatarUrl } from "../../../lib/avatar";

interface PuzzleLeaderboardEntry {
	id: string;
	username: string;
	profilePictureId: string | null;
	discordAvatarUrl: string | null;
	useDiscordAvatar: boolean;
	moves: number;
	durationMs: number;
	rank: number;
}

interface PuzzleLeaderboardPagination {
	page: number;
	limit: number;
	totalItems: number;
	totalPages: number;
	hasNextPage: boolean;
	hasPreviousPage: boolean;
}

interface PuzzleLeaderboardResponse {
	data: PuzzleLeaderboardEntry[];
	pagination: PuzzleLeaderboardPagination;
	puzzleType: PuzzleType;
}

const PAGE_SIZE = 20;

function formatDuration(durationMs: number) {
	const totalSeconds = Math.floor(durationMs / 1000);
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function PuzzleLeaderboardPage() {
	const [puzzleType, setPuzzleType] = useState<PuzzleType>("lights-out");
	const [currentPage, setCurrentPage] = useState<number>(1);
	const { data, loading, error, execute } = useApi<PuzzleLeaderboardResponse>();

	const entries = data?.data ?? [];
	const pagination = data?.pagination;
	const totalPages = pagination?.totalPages ?? 1;
	const hasPreviousPage = pagination?.hasPreviousPage ?? currentPage > 1;
	const hasNextPage = pagination?.hasNextPage ?? false;
	const currentPageFromApi = pagination?.page ?? currentPage;

	useEffect(() => {
		execute(
			`/api/puzzles/leaderboard?puzzleType=${puzzleType}&page=${currentPage}&limit=${PAGE_SIZE}`
		).catch(() => {});
	}, [puzzleType, currentPage, execute]);

	return (
		<main className="min-h-screen text-neutral-200 flex flex-col items-center py-12 px-4 sm:px-6 relative z-10 selection:bg-neutral-800/50 selection:text-neutral-200">
			<div className="w-full max-w-5xl bg-black/80 backdrop-blur-md border border-neutral-800 border-t-4 border-t-neutral-600 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative p-6 sm:p-10 flex flex-col">
				<div className="mb-6">
					<Link
						href="/puzzles"
						className="text-xs text-neutral-500 font-bold uppercase tracking-widest hover:text-neutral-300 transition-colors flex items-center justify-center sm:justify-start gap-2 w-fit"
					>
						<FaArrowLeft /> Back to Puzzles
					</Link>
				</div>

				<div className="mb-8 border-b border-neutral-800/80 pb-6 text-center sm:text-left">
					<h1 className="text-3xl sm:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-linear-to-b from-neutral-100 to-neutral-500 uppercase mb-2 flex items-center justify-center sm:justify-start gap-3">
						<FaTrophy className="text-yellow-500" />
						Puzzle Leaderboards
					</h1>
					<p className="text-sm text-neutral-400 font-medium tracking-wide">
						Global rankings based on each player&apos;s best run.
					</p>
				</div>

				<div className="mb-8 flex flex-wrap items-center gap-3 justify-center sm:justify-start">
					<button
						type="button"
						onClick={() => {
							setPuzzleType("lights-out");
							setCurrentPage(1);
						}}
						className={`px-4 py-2 rounded-sm border text-xs font-bold uppercase tracking-widest transition-all cursor-pointer ${
							puzzleType === "lights-out"
								? "bg-amber-900/40 border-amber-500 text-amber-300"
								: "bg-neutral-900/50 border-neutral-800 text-neutral-500 hover:border-neutral-500 hover:text-neutral-300"
						}`}
					>
						<FaLightbulb className="inline mr-2" />
						Lights Out
					</button>
					<button
						type="button"
						onClick={() => {
							setPuzzleType("slider-puzzle");
							setCurrentPage(1);
						}}
						className={`px-4 py-2 rounded-sm border text-xs font-bold uppercase tracking-widest transition-all cursor-pointer ${
							puzzleType === "slider-puzzle"
								? "bg-sky-900/40 border-sky-500 text-sky-300"
								: "bg-neutral-900/50 border-neutral-800 text-neutral-500 hover:border-neutral-500 hover:text-neutral-300"
						}`}
					>
						<FaPuzzlePiece className="inline mr-2" />
						Slider Puzzle
					</button>
				</div>

				{loading && (
					<div className="w-full text-center py-12 text-neutral-500 text-xs font-bold uppercase tracking-widest">
						Loading leaderboard...
					</div>
				)}

				{error && !loading && (
					<div className="w-full text-center py-12 text-red-500 text-xs font-bold uppercase tracking-widest">
						{error}
					</div>
				)}

				{!loading && !error && entries.length === 0 && (
					<div className="w-full text-center py-12 border border-dashed border-neutral-800 rounded-sm">
						<p className="text-neutral-500 font-medium italic">
							No leaderboard entries yet.
						</p>
					</div>
				)}

				{!loading && !error && entries.length > 0 && (
					<div className="space-y-3">
						{entries.map((entry) => (
							<Link
								key={entry.id}
								href={`/profile/${entry.username}`}
								className="flex items-center gap-4 p-4 bg-neutral-900/40 border border-neutral-800 rounded-sm hover:bg-neutral-800 hover:border-neutral-500 transition-all"
							>
								<div className="w-10 text-lg font-black text-neutral-500">
									#{entry.rank}
								</div>
								<div className="relative w-11 h-11 shrink-0 border border-black shadow-md overflow-hidden bg-neutral-950">
									<Image
										src={getUserAvatarUrl(entry)}
										alt={entry.username}
										fill
										className="object-cover"
										sizes="120px"
									/>
								</div>
								<div className="flex-1 min-w-0">
									<p className="text-sm font-bold uppercase tracking-widest text-neutral-200 truncate">
										{entry.username}
									</p>
									<p className="text-xs text-neutral-500 uppercase tracking-widest mt-1">
										Best Run
									</p>
								</div>
								<div className="text-right">
									<p className="text-sm font-black text-neutral-200 uppercase tracking-widest">
										{formatDuration(entry.durationMs)}
									</p>
									<p className="text-xs text-neutral-500 uppercase tracking-widest mt-1">
										{entry.moves} moves
									</p>
								</div>
							</Link>
						))}

						<div className="mt-4 flex items-center justify-between gap-3 border-t border-neutral-800/80 pt-4">
							<button
								type="button"
								onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
								disabled={loading || !hasPreviousPage}
								className="px-4 py-2 rounded-sm bg-neutral-900 border border-neutral-700 text-neutral-300 text-xs font-bold uppercase tracking-widest hover:bg-neutral-800 hover:border-neutral-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
								className="px-4 py-2 rounded-sm bg-neutral-900 border border-neutral-700 text-neutral-300 text-xs font-bold uppercase tracking-widest hover:bg-neutral-800 hover:border-neutral-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
							>
								Next
							</button>
						</div>
					</div>
				)}
			</div>
		</main>
	);
}
