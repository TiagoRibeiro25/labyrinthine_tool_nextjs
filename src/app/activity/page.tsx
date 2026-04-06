"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { FaArrowLeft, FaClockRotateLeft } from "react-icons/fa6";
import RealtimeStatusBadge from "../../components/RealtimeStatusBadge";
import { REALTIME_TOPICS, type RealtimeStreamSnapshot } from "../../constants/realtime";
import { useApi } from "../../hooks/useApi";
import { useRealtimeStream } from "../../hooks/useRealtimeStream";

interface ActivityItem {
	id: string;
	actor: {
		id: string;
		username: string;
		profilePictureId: string | null;
	};
	title: string;
	description: string;
	createdAt: string;
}

interface ActivityResponse {
	data: ActivityItem[];
	pagination: {
		page: number;
		limit: number;
		totalItems: number;
		totalPages: number;
		hasNextPage: boolean;
		hasPreviousPage: boolean;
	};
}

const PAGE_SIZE = 20;

export default function ActivityPage() {
	const [currentPage, setCurrentPage] = useState(1);
	const { data, loading, error, execute } = useApi<ActivityResponse>();
	const items = data?.data ?? [];
	const pagination = data?.pagination;
	const currentPageFromApi = pagination?.page ?? currentPage;
	const totalPages = pagination?.totalPages ?? 1;
	const hasPreviousPage = pagination?.hasPreviousPage ?? currentPageFromApi > 1;
	const hasNextPage = pagination?.hasNextPage ?? false;

	const fetchActivity = useCallback(async () => {
		await execute(`/api/activity?page=${currentPage}&limit=${PAGE_SIZE}`);
	}, [currentPage, execute]);

	const handleRealtimeUpdate = useCallback(() => {
		if (document.visibilityState !== "visible") {
			return;
		}

		fetchActivity().catch(() => {});
	}, [fetchActivity]);

	const handleRealtimeStreamPayload = useCallback(
		(payload: RealtimeStreamSnapshot) => {
			if (!payload.activity) {
				return;
			}

			handleRealtimeUpdate();
		},
		[handleRealtimeUpdate],
	);

	const { status: realtimeStatus, reconnect: reconnectRealtime } = useRealtimeStream({
		topics: [REALTIME_TOPICS.ACTIVITY],
		onUpdate: handleRealtimeStreamPayload,
	});

	useEffect(() => {
		fetchActivity().catch(() => {});
	}, [fetchActivity]);

	return (
		<main className="min-h-screen text-neutral-200 flex flex-col items-center py-12 px-4 sm:px-6 relative z-10 selection:bg-neutral-800/50 selection:text-neutral-200">
			<div className="w-full max-w-4xl bg-black/80 backdrop-blur-md border border-neutral-800 border-t-4 border-t-neutral-600 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative p-6 sm:p-10 flex flex-col">
				<div className="mb-6">
					<Link
						href="/dashboard"
						className="text-xs text-neutral-500 font-bold uppercase tracking-widest hover:text-neutral-300 transition-colors flex items-center justify-center sm:justify-start gap-2 w-fit"
					>
						<FaArrowLeft /> Return to Safehouse
					</Link>
				</div>

				<div className="mb-8 text-center sm:text-left border-b border-neutral-800/80 pb-6">
					<h1 className="text-3xl sm:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-linear-to-b from-neutral-100 to-neutral-500 uppercase mb-2 flex items-center justify-center sm:justify-start gap-3">
						<FaClockRotateLeft className="text-neutral-500" />
						Friend Activity
					</h1>
					<p className="text-sm text-neutral-400 font-medium tracking-wide">
						Live updates from your friends&apos; collection and puzzle progress.
					</p>
					<div className="mt-2">
						<RealtimeStatusBadge
							status={realtimeStatus}
							onReconnect={reconnectRealtime}
						/>
					</div>
				</div>

				{loading && (
					<div className="w-full text-center py-12 text-neutral-500 text-xs font-bold uppercase tracking-widest">
						Loading activity...
					</div>
				)}

				{error && !loading && (
					<div className="w-full text-center py-12 text-red-500 text-xs font-bold uppercase tracking-widest">
						{error}
					</div>
				)}

				{!loading && !error && items.length === 0 && (
					<div className="w-full text-center py-12 border border-dashed border-neutral-800 rounded-sm">
						<p className="text-neutral-500 font-medium italic">
							No recent friend activity yet.
						</p>
					</div>
				)}

				{!loading && !error && items.length > 0 && (
					<div className="space-y-3">
						{items.map((item) => (
							<div
								key={item.id}
								className="flex items-start gap-4 p-4 bg-neutral-900/40 border border-neutral-800 rounded-sm"
							>
								<Link
									href={`/profile/${item.actor.username}`}
									className="relative w-11 h-11 shrink-0 border border-black shadow-md overflow-hidden bg-neutral-950"
								>
									<Image
										src={
											item.actor.profilePictureId
												? `/images/profile_pictures/${item.actor.profilePictureId}.webp`
												: "/images/profile_pictures/1.webp"
										}
										alt={item.actor.username}
										fill
										className="object-cover"
										sizes="120px"
									/>
								</Link>

								<div className="min-w-0 flex-1">
									<Link
										href={`/profile/${item.actor.username}`}
										className="text-sm font-bold uppercase tracking-widest text-neutral-200 hover:text-white transition-colors"
									>
										{item.actor.username}
									</Link>
									<p className="text-sm text-neutral-200 mt-1">{item.title}</p>
									<p className="text-xs text-neutral-500 mt-1">{item.description}</p>
									<p className="text-[10px] text-neutral-600 uppercase tracking-widest font-bold mt-2">
										{new Date(item.createdAt).toLocaleString()}
									</p>
								</div>
							</div>
						))}

						<div className="mt-4 flex items-center justify-between gap-3 border-t border-neutral-800/80 pt-4">
							<button
								type="button"
								onClick={() => setCurrentPage(Math.max(1, currentPageFromApi - 1))}
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
								onClick={() =>
									setCurrentPage(Math.min(totalPages, currentPageFromApi + 1))
								}
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
