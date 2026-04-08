"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { FaBell, FaCheck, FaXmark } from "react-icons/fa6";
import { REALTIME_TOPICS, type RealtimeStreamSnapshot } from "../constants/realtime";
import { useApi } from "../hooks/useApi";
import { useOnClickOutside } from "../hooks/useOnClickOutside";
import { useRealtimeStream } from "../hooks/useRealtimeStream";
import RealtimeStatusBadge from "./RealtimeStatusBadge";

interface NotificationPreview {
	id: string;
	title: string;
	message: string;
	href: string | null;
	isRead: boolean;
	createdAt: string;
}

interface NotificationsResponse {
	data: NotificationPreview[];
	unreadCount: number;
}

export default function NotificationsCenter() {
	const [isOpen, setIsOpen] = useState(false);
	const panelRef = useRef<HTMLDivElement>(null);
	const { data, loading, execute } = useApi<NotificationsResponse>();
	const { execute: executeMarkRead } = useApi<{ message: string }>();
	const notifications = data?.data ?? [];
	const unreadCount = data?.unreadCount ?? 0;

	useOnClickOutside(panelRef, () => setIsOpen(false));

	const refresh = useCallback(async () => {
		try {
			await execute("/api/notifications?limit=12");
		} catch {
			// Ignore fetch errors for floating center.
		}
	}, [execute]);

	const handleRealtimeUpdate = useCallback(() => {
		if (document.visibilityState !== "visible") {
			return;
		}

		refresh().catch(() => {});
	}, [refresh]);

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
			await refresh();
		} catch {
			// Keep UX resilient if the request fails.
		}
	};

	const markOneRead = async (notificationId: string) => {
		try {
			await executeMarkRead("/api/notifications", {
				method: "PATCH",
				body: JSON.stringify({ notificationId }),
			});
			await refresh();
		} catch {
			// Keep UX resilient if the request fails.
		}
	};

	useEffect(() => {
		refresh().catch(() => {});

		const handleVisibilityChange = () => {
			if (document.visibilityState === "visible") {
				refresh().catch(() => {});
			}
		};

		document.addEventListener("visibilitychange", handleVisibilityChange);

		return () => {
			document.removeEventListener("visibilitychange", handleVisibilityChange);
		};
	}, [refresh]);

	return (
		<div className="fixed top-5 right-5 z-40">
			<button
				type="button"
				onClick={() => setIsOpen((prev) => !prev)}
				className="relative flex items-center justify-center w-11 h-11 rounded-sm bg-black/80 backdrop-blur-md border border-neutral-700 text-neutral-300 hover:text-white hover:border-neutral-400 transition-all duration-300 shadow-[0_0_20px_rgba(0,0,0,0.5)]"
				aria-label="Open notifications"
			>
				<FaBell className="w-4 h-4" />
				{unreadCount > 0 && (
					<span className="absolute -top-2 -right-2 min-w-5 h-5 px-1 rounded-full bg-amber-500 text-black text-[10px] font-black flex items-center justify-center border border-black">
						{unreadCount > 99 ? "99+" : unreadCount}
					</span>
				)}
			</button>

			{isOpen && (
				<div
					ref={panelRef}
					className="absolute right-0 mt-3 w-[min(92vw,24rem)] bg-neutral-950 border border-neutral-800 border-t-4 border-t-neutral-600 shadow-[0_0_50px_rgba(0,0,0,0.8)] rounded-sm overflow-hidden"
				>
					<div className="px-4 py-3 border-b border-neutral-800 flex items-center justify-between gap-3">
						<div>
							<p className="text-xs font-bold uppercase tracking-widest text-neutral-300">
								Notifications
							</p>
							<p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold mt-1">
								{unreadCount} unread
							</p>
							<div className="mt-1">
								<RealtimeStatusBadge
									status={realtimeStatus}
									onReconnect={reconnectRealtime}
								/>
							</div>
						</div>
						<div className="flex items-center gap-2">
							<button
								type="button"
								onClick={markAllRead}
								className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-widest text-neutral-300 border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 transition-colors rounded-sm"
							>
								Mark all
							</button>
							<button
								type="button"
								onClick={() => setIsOpen(false)}
								className="p-1.5 text-neutral-500 hover:text-neutral-300 transition-colors"
								aria-label="Close notifications"
							>
								<FaXmark className="w-4 h-4" />
							</button>
						</div>
					</div>

					<div className="max-h-96 overflow-y-auto">
						{loading && (
							<div className="py-8 text-center text-xs font-bold uppercase tracking-widest text-neutral-500">
								Loading...
							</div>
						)}

						{!loading && notifications.length === 0 && (
							<div className="py-8 px-4 text-center text-xs font-bold uppercase tracking-widest text-neutral-500">
								All quiet in the fog.
							</div>
						)}

						{!loading && notifications.length > 0 && (
							<div className="divide-y divide-neutral-800">
								{notifications.map((notification) => {
									const content = (
										<div
											className={`px-4 py-3 transition-colors ${
												notification.isRead ? "bg-neutral-950" : "bg-neutral-900/50"
											}`}
										>
											<div className="flex items-start justify-between gap-2">
												<div className="min-w-0">
													<p className="text-[11px] font-bold uppercase tracking-widest text-neutral-200">
														{notification.title}
													</p>
													<p className="text-xs text-neutral-400 mt-1 line-clamp-2">
														{notification.message}
													</p>
													<p className="text-[10px] text-neutral-600 uppercase tracking-widest font-bold mt-2">
														{new Date(notification.createdAt).toLocaleString()}
													</p>
												</div>
												{!notification.isRead && (
													<button
														type="button"
														onClick={(event) => {
															event.preventDefault();
															event.stopPropagation();
															markOneRead(notification.id).catch(() => {});
														}}
														className="shrink-0 p-1.5 border border-neutral-700 rounded-sm text-neutral-400 hover:text-emerald-400 hover:border-emerald-600 transition-colors"
														aria-label="Mark notification as read"
													>
														<FaCheck className="w-3 h-3" />
													</button>
												)}
											</div>
										</div>
									);

									if (notification.href) {
										return (
											<Link
												key={notification.id}
												href={notification.href}
												onClick={() => {
													if (!notification.isRead) {
														markOneRead(notification.id).catch(() => {});
													}
													setIsOpen(false);
												}}
												className="block hover:bg-neutral-900/40"
											>
												{content}
											</Link>
										);
									}

									return <div key={notification.id}>{content}</div>;
								})}
							</div>
						)}
					</div>

					<div className="px-4 py-3 border-t border-neutral-800">
						<Link
							href="/notifications"
							onClick={() => setIsOpen(false)}
							className="block text-center px-4 py-2 rounded-sm bg-neutral-900 border border-neutral-700 text-neutral-300 text-[10px] font-bold uppercase tracking-widest hover:bg-neutral-800 hover:border-neutral-500 transition-colors"
						>
							Open Notifications Center
						</Link>
					</div>
				</div>
			)}
		</div>
	);
}
