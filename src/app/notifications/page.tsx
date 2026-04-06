"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect } from "react";
import { FaArrowLeft, FaBell } from "react-icons/fa6";
import { useApi } from "../../hooks/useApi";

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
	} | null;
}

interface NotificationsResponse {
	data: NotificationItem[];
	unreadCount: number;
}

export default function NotificationsPage() {
	const { data, loading, error, execute } = useApi<NotificationsResponse>();
	const notifications = data?.data ?? [];
	const unreadCount = data?.unreadCount ?? 0;

	const fetchNotifications = useCallback(async () => {
		await execute("/api/notifications?limit=80");
	}, [execute]);

	const markAllRead = async () => {
		try {
			await fetch("/api/notifications", {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
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

				<div className="mb-8 text-center sm:text-left border-b border-neutral-800/80 pb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
					<div>
						<h1 className="text-3xl sm:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-linear-to-b from-neutral-100 to-neutral-500 uppercase mb-2 flex items-center justify-center sm:justify-start gap-3">
							<FaBell className="text-amber-400" />
							Notifications
						</h1>
						<p className="text-sm text-neutral-400 font-medium tracking-wide">
							{unreadCount} unread notification{unreadCount === 1 ? "" : "s"}.
						</p>
					</div>
					<button
						type="button"
						onClick={markAllRead}
						className="px-4 py-2 rounded-sm bg-neutral-900 text-neutral-300 font-bold text-xs uppercase tracking-widest border border-neutral-700 hover:bg-neutral-800 hover:border-neutral-500 transition-colors"
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
					<div className="w-full text-center py-12 border border-dashed border-neutral-800 rounded-sm">
						<p className="text-neutral-500 font-medium italic">You are all caught up.</p>
					</div>
				)}

				{!loading && !error && notifications.length > 0 && (
					<div className="space-y-3">
						{notifications.map((notification) => {
							const card = (
								<div
									className={`flex items-start gap-4 p-4 border rounded-sm transition-colors ${
										notification.isRead
											? "bg-neutral-900/30 border-neutral-800"
											: "bg-neutral-900/70 border-amber-800/60"
									}`}
								>
									<div className="relative w-10 h-10 shrink-0 border border-black shadow-md overflow-hidden bg-neutral-950">
										<Image
											src={
												notification.actor?.profilePictureId
													? `/images/profile_pictures/${notification.actor.profilePictureId}.webp`
													: "/images/profile_pictures/1.webp"
											}
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
					</div>
				)}
			</div>
		</main>
	);
}
