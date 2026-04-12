"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { FaTriangleExclamation } from "react-icons/fa6";
import { useApi } from "../hooks/useApi";
import { useToast } from "../hooks/useToast";
import type { ReportedCommentRow, ReportedCommentsPagination } from "../lib/admin-reported-comments";

interface AdminReportedCommentsSectionProps {
	items: ReportedCommentRow[];
	pagination: ReportedCommentsPagination;
}

function formatDate(value: Date): string {
	return value.toLocaleString();
}

export default function AdminReportedCommentsSection({
	items,
	pagination,
}: AdminReportedCommentsSectionProps) {
	const router = useRouter();
	const toast = useToast();
	const { execute, loading } = useApi<{ message: string }>();

	const pageLabel = useMemo(() => {
		return `Page ${pagination.page} of ${pagination.totalPages}`;
	}, [pagination.page, pagination.totalPages]);

	const handleModerationAction = async (
		commentId: string,
		action: "hide" | "delete" | "dismiss",
		message: string
	) => {
		try {
			const result = await execute("/api/admin/reported-comments", {
				method: "PATCH",
				body: JSON.stringify({ commentId, action }),
			});

			toast.success("Report handled", result?.message || message);
			router.refresh();
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : message;
			toast.error("Moderation failed", errorMessage);
		}
	};

	return (
		<section className="mt-8 p-5 bg-red-950/10 border border-red-900/40 rounded-sm">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-red-900/30 pb-4 mb-5">
				<div>
					<p className="text-[10px] font-bold uppercase tracking-widest text-red-400 mb-2 flex items-center gap-2">
						<FaTriangleExclamation /> Reported comments
					</p>
					<h3 className="text-lg sm:text-xl font-black tracking-tighter uppercase text-neutral-100">
						Moderation queue
					</h3>
					<p className="mt-2 text-sm text-neutral-400 leading-relaxed">
						Review user-submitted reports. Hide, delete, or dismiss reports directly from
						the admin panel.
					</p>
				</div>
				<div className="text-xs font-bold uppercase tracking-widest text-neutral-500">
					{pagination.totalItems} reported comment{pagination.totalItems === 1 ? "" : "s"}
				</div>
			</div>

			{items.length === 0 ? (
				<div className="py-10 text-center border border-dashed border-neutral-800 rounded-sm bg-black/20">
					<p className="text-neutral-500 font-medium italic">No reports in the queue.</p>
				</div>
			) : (
				<div className="space-y-4">
					{items.map((item) => (
						<article
							key={item.commentId}
							className="p-4 sm:p-5 bg-neutral-950/60 border border-neutral-800 rounded-sm"
						>
							<div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
								<div className="min-w-0 flex-1 space-y-3">
									<div className="flex flex-wrap items-center gap-2">
										<span className="px-2 py-1 text-[10px] font-bold uppercase tracking-widest rounded-sm bg-red-900/40 text-red-200 border border-red-800">
											{item.reportCount} report{item.reportCount === 1 ? "" : "s"}
										</span>
										{item.comment.isHidden && (
											<span className="px-2 py-1 text-[10px] font-bold uppercase tracking-widest rounded-sm bg-amber-900/30 text-amber-200 border border-amber-800">
												Already hidden
											</span>
										)}
									</div>

									<p className="text-xs text-neutral-500 uppercase tracking-widest font-bold">
										Reported comment by <Link href={`/profile/${item.comment.author.username}`} className="text-neutral-300 hover:text-white">{item.comment.author.username}</Link> on <Link href={`/profile/${item.comment.profile.username}`} className="text-neutral-300 hover:text-white">{item.comment.profile.username}</Link>
									</p>

									<p className="text-sm text-neutral-200 leading-relaxed whitespace-pre-wrap bg-black/30 border border-neutral-800 rounded-sm p-3">
										{item.comment.content}
									</p>

									<div className="flex flex-wrap gap-4 text-[10px] uppercase tracking-widest text-neutral-500 font-bold">
										<span>Created {formatDate(item.comment.createdAt)}</span>
										<span>Updated {formatDate(item.comment.updatedAt)}</span>
										{item.latestReason && <span>Latest reason: {item.latestReason}</span>}
									</div>
								</div>

								<div className="flex flex-col gap-2 shrink-0 lg:w-52">
									<button
										type="button"
										disabled={loading}
										onClick={() => void handleModerationAction(item.commentId, "hide", "Comment hidden.")}
										className="px-4 py-2 rounded-sm bg-amber-950/40 text-amber-200 font-bold text-xs uppercase tracking-widest border border-amber-900 hover:bg-amber-900/50 hover:border-amber-600 transition-colors disabled:opacity-50 cursor-pointer"
									>
										Hide
									</button>
									<button
										type="button"
										disabled={loading}
										onClick={() => void handleModerationAction(item.commentId, "delete", "Comment deleted.")}
										className="px-4 py-2 rounded-sm bg-red-950/40 text-red-200 font-bold text-xs uppercase tracking-widest border border-red-900 hover:bg-red-900/50 hover:border-red-600 transition-colors disabled:opacity-50 cursor-pointer"
									>
										Delete
									</button>
									<button
										type="button"
										disabled={loading}
										onClick={() => void handleModerationAction(item.commentId, "dismiss", "Reports dismissed.")}
										className="px-4 py-2 rounded-sm bg-neutral-900 text-neutral-200 font-bold text-xs uppercase tracking-widest border border-neutral-700 hover:bg-neutral-800 hover:border-neutral-500 transition-colors disabled:opacity-50 cursor-pointer"
									>
										Dismiss
									</button>
								</div>
							</div>
						</article>
					))}
				</div>
			)}

			<div className="mt-5 flex items-center justify-between gap-3 border-t border-neutral-800/70 pt-4">
				<div className="text-xs font-bold uppercase tracking-widest text-neutral-500">
					{pageLabel}
				</div>
				<div className="flex gap-2">
					<Link
						href={`/admin?reportedCommentsPage=${Math.max(1, pagination.page - 1)}`}
						aria-disabled={!pagination.hasPreviousPage}
						className={`px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-widest border transition-colors ${
							pagination.hasPreviousPage
								? "bg-neutral-900 text-neutral-300 border-neutral-700 hover:bg-neutral-800 hover:border-neutral-500"
								: "bg-neutral-950 text-neutral-600 border-neutral-800 pointer-events-none"
						}`}
					>
						Previous
					</Link>
					<Link
						href={`/admin?reportedCommentsPage=${Math.min(
							pagination.totalPages,
							pagination.page + 1
						)}`}
						aria-disabled={!pagination.hasNextPage}
						className={`px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-widest border transition-colors ${
							pagination.hasNextPage
								? "bg-neutral-900 text-neutral-300 border-neutral-700 hover:bg-neutral-800 hover:border-neutral-500"
								: "bg-neutral-950 text-neutral-600 border-neutral-800 pointer-events-none"
						}`}
					>
						Next
					</Link>
				</div>
			</div>
		</section>
	);
}
