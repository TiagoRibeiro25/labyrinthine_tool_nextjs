"use client";

import { useRouter } from "next/navigation";
import { FaClockRotateLeft, FaTrashCan } from "react-icons/fa6";
import { ADMIN_CLEANUP_RETENTION_DAYS } from "../constants/admin";
import { useApi } from "../hooks/useApi";
import { useToast } from "../hooks/useToast";

interface CleanupResponse {
	message: string;
	retentionDays: number;
	deletedActivityEvents: number;
	deletedNotifications: number;
}

export default function AdminCleanupSection() {
	const router = useRouter();
	const { execute, loading } = useApi<CleanupResponse>();
	const { success, error } = useToast();

	const handleCleanup = async () => {
		if (
			!window.confirm(
				`Delete activity and notifications older than ${ADMIN_CLEANUP_RETENTION_DAYS} days? This cannot be undone.`
			)
		) {
			return;
		}

		try {
			const result = await execute("/api/admin/cleanup", {
				method: "POST",
				body: JSON.stringify({ retentionDays: ADMIN_CLEANUP_RETENTION_DAYS }),
			});

			success(
				"Cleanup complete",
				`Deleted ${result?.deletedActivityEvents ?? 0} activity events and ${result?.deletedNotifications ?? 0} notifications.`
			);
			router.refresh();
		} catch (err) {
			const message = err instanceof Error ? err.message : "Failed to run cleanup.";
			error("Cleanup failed", message);
		}
	};

	return (
		<section className="mt-8 p-5 bg-amber-950/10 border border-amber-900/40 rounded-sm">
			<div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
				<div className="max-w-2xl">
					<p className="text-[10px] font-bold uppercase tracking-widest text-amber-400 mb-2 flex items-center gap-2">
						<FaClockRotateLeft /> Data cleanup
					</p>
					<h3 className="text-lg sm:text-xl font-black tracking-tighter uppercase text-neutral-100">
						Delete stale activity and notifications
					</h3>
					<p className="mt-2 text-sm text-neutral-400 leading-relaxed">
						Remove activity events and notifications older than{" "}
						{ADMIN_CLEANUP_RETENTION_DAYS}
						days to keep the admin dataset small. This is permanent and only affects
						historical records, not current user data.
					</p>
				</div>

				<button
					onClick={handleCleanup}
					disabled={loading}
					className="inline-flex items-center justify-center gap-3 px-6 py-3 rounded-sm bg-red-950/40 text-red-200 font-bold text-sm uppercase tracking-widest border border-red-900 hover:bg-red-900/50 hover:border-red-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{loading ? (
						<span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
					) : (
						<FaTrashCan className="h-4 w-4" />
					)}
					Delete {ADMIN_CLEANUP_RETENTION_DAYS} Day History
				</button>
			</div>
		</section>
	);
}
