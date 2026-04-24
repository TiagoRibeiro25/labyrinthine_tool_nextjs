"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { FaArrowLeft, FaBell } from "react-icons/fa6";
import RealtimeStatusBadge from "../../components/RealtimeStatusBadge";
import { NOTIFICATIONS_PAGE_SIZE } from "../../constants/pagination";
import { REALTIME_TOPICS, type RealtimeStreamSnapshot } from "../../constants/realtime";
import { useApi } from "../../hooks/useApi";
import { useRealtimeStream } from "../../hooks/useRealtimeStream";
import { getUserAvatarUrl } from "../../lib/avatar";

interface NotificationItem {
	id: string;
	type: string;
	title: string;
	message: string;
	href: string | null;
	isRead: boolean;
	createdAt: string;
	actor: {
		id: string;
		username: string;
		profilePictureId: string | null;
		steamAvatarUrl: string | null;
		useSteamAvatar: boolean;
		discordAvatarUrl: string | null;
		useDiscordAvatar: boolean;
	} | null;
}

interface NotificationsResponse {
	data: NotificationItem[];
	unreadCount: number;
	pagination: {
		page: number;
		limit: number;
		totalItems: number;
		totalPages: number;
		hasNextPage: boolean;
		hasPreviousPage: boolean;
	};
}

export default function NotificationsPage() {
	const [currentPage, setCurrentPage] = useState<number>(1);
	const { data, loading, error, execute } = useApi<NotificationsResponse>();
	const { execute: executeMarkRead } = useApi<{ message: string }>();
	const notifications = data?.data ?? [];
	const unreadCount = data?.unreadCount ?? 0;
	const pagination = data?.pagination;
	const currentPageFromApi = pagination?.page ?? currentPage;
	const totalPages = pagination?.totalPages ?? 1;
	const hasPreviousPage = pagination?.hasPreviousPage ?? currentPageFromApi > 1;
	const hasNextPage = pagination?.hasNextPage ?? false;

	const fetchNotifications = useCallback(async () => {
		await execute(
			`/api/notifications?page=${currentPage}&limit=${NOTIFICATIONS_PAGE_SIZE}`
		);
	}, [currentPage, execute]);

	const handleRealtimeUpdate = useCallback(() => {
		if (document.visibilityState !== "visible") {
			return;
		}

		fetchNotifications().catch(() => {});
	}, [fetchNotifications]);

	const handleRealtimeStreamPayload = useCallback(
		(payload: RealtimeStreamSnapshot) => {
			if (!payload.notifications) {
				return;
			}

			handleRealtimeUpdate();
		},
		[handleRealtimeUpdate]
	);

	const { status: realtimeStatus, reconnect: reconnectRealtime } = useRealtimeStream({
		topics: [REALTIME_TOPICS.NOTIFICATIONS],
		onUpdate: handleRealtimeStreamPayload,
	});

	const markAllRead = async () => {
		try {
			await executeMarkRead("/api/notifications", {
				method: "PATCH",
				body: JSON.stringify({ markAll: true }),
			});
			await fetchNotifications();
		} catch {
			// Keep UI resilient if mark-all fails
		}
	};

	useEffect(() => {
		fetchNotifications().catch(() => {});
	}, [fetchNotifications]);

	return (
		<main className="min-h-screen text-neutral-200 flex flex-col items-center py-8 sm:py-12 px-4 sm:px-6 relative z-10 selection:bg-neutral-800/50 selection:text-neutral-200">
			<div className="w-full max-w-5xl rounded-3xl bg-[linear-gradient(145deg,rgba(8,11,13,0.95),rgba(20,24,30,0.9))] backdrop-blur-md border border-neutral-800/80 shadow-[0_24px_80px_rgba(0,0,0,0.45)] relative p-4 sm:p-6 lg:p-8 flex flex-col">
				<div className="mb-6">
					<Link
						href="/dashboard"
						className="inline-flex items-center gap-2 rounded-full border border-neutral-700 bg-black/35 px-4 py-2 text-[11px] uppercase tracking-[0.16em] font-semibold text-neutral-300 hover:border-neutral-500 hover:text-neutral-100 transition-colors w-fit"
					>
						<FaArrowLeft /> Return to Safehouse
					</Link>
				</div>

				<div className="mb-8 text-center sm:text-left border-b border-neutral-800/80 pb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
					<div>
						<h1 className="text-3xl sm:text-5xl font-black tracking-tight text-neutral-100 uppercase mb-2 flex items-center justify-center sm:justify-start gap-3">
							<FaBell className="text-amber-300" />
							Notifications
						</h1>
						<p className="text-sm text-neutral-400 font-medium tracking-wide">
							{unreadCount} unread notification{unreadCount === 1 ? "" : "s"}.
						</p>
						<div className="mt-2">
							<RealtimeStatusBadge
								status={realtimeStatus}
								onReconnect={reconnectRealtime}
							/>
						</div>
					</div>
					<button
						type="button"
						onClick={markAllRead}
						className="px-4 py-2 rounded-full bg-neutral-900 text-neutral-300 font-bold text-xs uppercase tracking-[0.14em] border border-neutral-700 hover:bg-neutral-800 hover:border-neutral-500 transition-colors cursor-pointer"
					>
						Mark All Read
					</button>
				</div>

				{loading && (
					<div className="w-full text-center py-12 text-neutral-500 text-xs font-bold uppercase tracking-widest">
						Loading notifications...
					</div>
				)}

				{error && !loading && (
					<div className="w-full text-center py-12 text-red-500 text-xs font-bold uppercase tracking-widest">
						{error}
					</div>
				)}

				{!loading && !error && notifications.length === 0 && (
					<div className="w-full text-center py-12 border border-dashed border-neutral-800 rounded-2xl">
						<p className="text-neutral-500 font-medium italic">You are all caught up.</p>
					</div>
				)}

				{!loading && !error && notifications.length > 0 && (
					<div className="space-y-3">
						{notifications.map((notification) => {
							const card = (
								<div
									className={`flex items-start gap-4 p-4 border rounded-2xl transition-colors ${
										notification.isRead
											? "bg-neutral-900/30 border-neutral-800"
											: "bg-neutral-900/70 border-amber-800/60"
									}`}
								>
									<div className="relative w-10 h-10 shrink-0 border border-black shadow-md overflow-hidden bg-neutral-950">
										<Image
											src={getUserAvatarUrl(notification.actor ?? {})}
											alt={notification.actor?.username || "System"}
											fill
											className="object-cover"
											sizes="100px"
										/>
									</div>
									<div className="flex-1 min-w-0">
										<p className="text-xs font-bold uppercase tracking-widest text-neutral-300">
											{notification.title}
										</p>
										<p className="text-sm text-neutral-200 mt-1">
											{notification.message}
										</p>
										<p className="text-[10px] text-neutral-600 uppercase tracking-widest font-bold mt-2">
											{new Date(notification.createdAt).toLocaleString()}
										</p>
									</div>
								</div>
							);

							if (notification.href) {
								return (
									<Link
										key={notification.id}
										href={notification.href}
										className="block hover:opacity-95 transition-opacity"
									>
										{card}
									</Link>
								);
							}

							return <div key={notification.id}>{card}</div>;
						})}

						<div className="mt-4 flex items-center justify-between gap-3 border-t border-neutral-800/80 pt-4">
							<button
								type="button"
								onClick={() => setCurrentPage(Math.max(1, currentPageFromApi - 1))}
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
								onClick={() =>
									setCurrentPage(Math.min(totalPages, currentPageFromApi + 1))
								}
								disabled={loading || !hasNextPage}
								className="px-4 py-2 rounded-full bg-neutral-900 border border-neutral-700 text-neutral-300 text-xs font-bold uppercase tracking-[0.14em] hover:bg-neutral-800 hover:border-neutral-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
