"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import ProfileCommentActionModal, {
	type ProfileCommentActionModalState,
} from "./ProfileCommentActionModal";
import {
	PROFILE_COMMENT_MAX_LENGTH as COMMENT_MAX_LENGTH,
	PROFILE_COMMENT_REPORT_REASON_MAX_LENGTH as REPORT_REASON_MAX_LENGTH,
	PROFILE_COMMENT_REPORT_REASON_MIN_LENGTH as REPORT_REASON_MIN_LENGTH,
} from "../constants/profile-comments";
import { PROFILE_COMMENTS_PAGE_SIZE as COMMENTS_PAGE_SIZE } from "../constants/pagination";
import { useApi } from "../hooks/useApi";
import { useToast } from "../hooks/useToast";
import { getUserAvatarUrl } from "../lib/avatar";

type WallComment = {
	id: string;
	content: string;
	isPinned: boolean;
	isEdited: boolean;
	isHidden: boolean;
	likeCount: number;
	currentUserLiked: boolean;
	createdAt: string;
	updatedAt: string;
	author: {
		id: string;
		username: string;
		profilePictureId: string | null;
		steamAvatarUrl: string | null;
		useSteamAvatar: boolean;
		discordAvatarUrl: string | null;
		useDiscordAvatar: boolean;
	};
	permissions: {
		canEdit: boolean;
		canDelete: boolean;
		canHide: boolean;
		canPin: boolean;
		canReport: boolean;
	};
};

type CommentHistoryItem = {
	id: string;
	content: string;
	createdAt: string;
	profileUsername: string;
};

interface ProfileCommentsSectionProps {
	profileUsername: string;
	isOwnProfile: boolean;
	isLoggedIn: boolean;
	historyItems: CommentHistoryItem[];
}

interface CommentsApiResponse {
	comments: WallComment[];
	policy: {
		visibility: "everyone" | "friends_only" | "no_one";
		canCurrentUserComment: boolean;
	};
	pagination: {
		page: number;
		limit: number;
		totalItems: number;
		totalPages: number;
		hasNextPage: boolean;
		hasPreviousPage: boolean;
	};
}



function formatTime(dateValue: string): string {
	return new Date(dateValue).toLocaleString();
}

function getErrorMessage(error: unknown, fallback: string): string {
	if (error instanceof Error && error.message) {
		return error.message;
	}

	return fallback;
}

export default function ProfileCommentsSection({
	profileUsername,
	isOwnProfile,
	isLoggedIn,
	historyItems,
}: ProfileCommentsSectionProps) {
	const toast = useToast();
	const { loading: commentsLoading, execute: executeComments } =
		useApi<CommentsApiResponse>();
	const { loading: createCommentLoading, execute: executeCreateComment } = useApi<{
		message: string;
		id: string | null;
	}>();
	const { execute: executeMutateComment } = useApi<{ message: string }>();
	const { execute: executeReportComment } = useApi<{ message: string }>();

	const [comments, setComments] = useState<WallComment[]>([]);
	const [error, setError] = useState<string>("");
	const [content, setContent] = useState<string>("");
	const [page, setPage] = useState<number>(1);
	const [sort, setSort] = useState<"newest" | "top">("newest");
	const [pagination, setPagination] = useState<CommentsApiResponse["pagination"]>({
		page: 1,
		limit: COMMENTS_PAGE_SIZE,
		totalItems: 0,
		totalPages: 1,
		hasNextPage: false,
		hasPreviousPage: false,
	});
	const [policy, setPolicy] = useState<CommentsApiResponse["policy"]>({
		visibility: "everyone",
		canCurrentUserComment: false,
	});
	const [actionModal, setActionModal] = useState<ProfileCommentActionModalState | null>(
		null
	);

	const wallPolicyLabel = useMemo(() => {
		if (policy.visibility === "no_one") {
			return "Comments disabled by profile owner.";
		}

		if (policy.visibility === "friends_only") {
			return "Friends only can comment.";
		}

		return "Public wall comments enabled.";
	}, [policy]);

	const fetchComments = useCallback(async () => {
		setError("");

		try {
			const params = new URLSearchParams({
				page: String(page),
				limit: String(COMMENTS_PAGE_SIZE),
				sort,
			});

			const payload = await executeComments(
				`/api/profile/${encodeURIComponent(profileUsername)}/comments?${params.toString()}`
			);

			if (!payload) {
				throw new Error("Failed to load comments.");
			}

			setComments(payload.comments);
			setPolicy(payload.policy);
			setPagination(payload.pagination);
		} catch (err) {
			setError(getErrorMessage(err, "Failed to load comments."));
		}
	}, [executeComments, page, profileUsername, sort]);

	useEffect(() => {
		void fetchComments();
	}, [fetchComments]);

	const performCommentAction = useCallback(
		async (commentId: string, action: string, actionContent?: string) => {
			await executeMutateComment(`/api/profile/comments/${commentId}`, {
				method: "PATCH",
				body: JSON.stringify(
					action === "edit"
						? { action, content: actionContent }
						: {
								action,
							}
				),
			});
		},
		[executeMutateComment]
	);

	const handleSubmitComment = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		if (!content.trim()) {
			setError("Comment cannot be empty.");
			return;
		}

		setError("");
		try {
			await executeCreateComment(
				`/api/profile/${encodeURIComponent(profileUsername)}/comments`,
				{
					method: "POST",
					body: JSON.stringify({ content }),
				}
			);

			setContent("");
			toast.success("Comment posted", "Your message is now on the wall.");
			setPage(1);
			void fetchComments();
		} catch (err) {
			const message = getErrorMessage(err, "Could not post comment.");
			setError(message);
			toast.error("Could not post comment", message);
		}
	};

	const openEditModal = (comment: WallComment) => {
		setActionModal({
			type: "edit",
			commentId: comment.id,
			originalContent: comment.content,
			input: comment.content,
			error: "",
			submitting: false,
		});
	};

	const openDeleteModal = (commentId: string) => {
		setActionModal({
			type: "delete",
			commentId,
			error: "",
			submitting: false,
		});
	};

	const openReportModal = (commentId: string) => {
		setActionModal({
			type: "report",
			commentId,
			input: "Spam",
			error: "",
			submitting: false,
		});
	};

	const closeActionModal = () => {
		setActionModal((current) => {
			if (current?.submitting) {
				return current;
			}

			return null;
		});
	};

	const updateModalInput = (value: string) => {
		setActionModal((current) => {
			if (!current || (current.type !== "edit" && current.type !== "report")) {
				return current;
			}

			return {
				...current,
				input: value,
				error: "",
			};
		});
	};

	const handleConfirmModalAction = async () => {
		if (!actionModal) {
			return;
		}

		setActionModal((current) =>
			current
				? {
						...current,
						error: "",
						submitting: true,
					}
				: current
		);

		try {
			if (actionModal.type === "edit") {
				const nextContent = actionModal.input.trim();

				if (!nextContent) {
					setActionModal((current) =>
						current && current.type === "edit"
							? {
									...current,
									error: "Comment cannot be empty.",
									submitting: false,
								}
							: current
					);
					return;
				}

				if (nextContent === actionModal.originalContent) {
					setActionModal((current) =>
						current && current.type === "edit"
							? {
									...current,
									error: "No changes detected.",
									submitting: false,
								}
							: current
					);
					return;
				}

				await performCommentAction(actionModal.commentId, "edit", nextContent);
				toast.success("Comment updated", "Your changes were saved.");
				setActionModal(null);
				void fetchComments();
				return;
			}

			if (actionModal.type === "delete") {
				await performCommentAction(actionModal.commentId, "delete");
				toast.success("Comment deleted", "The wall comment has been removed.");
				setActionModal(null);
				void fetchComments();
				return;
			}

			const reason = actionModal.input.trim();
			if (reason.length < REPORT_REASON_MIN_LENGTH) {
				setActionModal((current) =>
					current && current.type === "report"
						? {
								...current,
								error: `Report reason must be at least ${REPORT_REASON_MIN_LENGTH} characters.`,
								submitting: false,
							}
						: current
				);
				return;
			}

			await executeReportComment(
				`/api/profile/comments/${actionModal.commentId}/report`,
				{
					method: "POST",
					body: JSON.stringify({ reason }),
				}
			);

			toast.success("Comment reported", "Thanks for helping keep profiles safe.");
			setActionModal(null);
		} catch (err) {
			const message = getErrorMessage(err, "Could not complete this action.");
			setActionModal((current) =>
				current
					? {
							...current,
							error: message,
							submitting: false,
						}
					: current
			);

			if (actionModal.type === "edit") {
				toast.error("Update failed", message);
			} else if (actionModal.type === "delete") {
				toast.error("Delete failed", message);
			} else {
				toast.error("Report failed", message);
			}
		}
	};

	const handlePin = async (commentId: string) => {
		try {
			await performCommentAction(commentId, "pin");
			void fetchComments();
		} catch (err) {
			const message = getErrorMessage(err, "Failed to pin comment.");
			toast.error("Pin action failed", message);
		}
	};

	const handleHideToggle = async (comment: WallComment) => {
		try {
			await performCommentAction(comment.id, comment.isHidden ? "unhide" : "hide");
			void fetchComments();
		} catch (err) {
			const message = getErrorMessage(err, "Moderation action failed.");
			toast.error("Moderation failed", message);
		}
	};

	const handleLikeToggle = async (comment: WallComment) => {
		try {
			await performCommentAction(
				comment.id,
				comment.currentUserLiked ? "unlike" : "like"
			);
			setComments((previous) =>
				previous.map((item) => {
					if (item.id !== comment.id) {
						return item;
					}

					const nextLiked = !item.currentUserLiked;
					return {
						...item,
						currentUserLiked: nextLiked,
						likeCount: nextLiked ? item.likeCount + 1 : Math.max(0, item.likeCount - 1),
					};
				})
			);
		} catch (err) {
			const message = getErrorMessage(err, "Failed to toggle like.");
			toast.error("Like action failed", message);
		}
	};

	return (
		<>
			<section className="mt-8 bg-black/50 border border-neutral-800 p-5 rounded-sm">
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-neutral-800/60 pb-3 mb-4">
					<div>
						<h3 className="text-xs font-bold text-neutral-600 uppercase tracking-widest">
							Profile Wall
						</h3>
						<p className="text-[11px] text-neutral-500 mt-1">{wallPolicyLabel}</p>
					</div>
					<label className="text-xs font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-2">
						Sort
						<select
							value={sort}
							onChange={(event) => {
								setPage(1);
								setSort(event.target.value as "newest" | "top");
							}}
							className="bg-neutral-900 border border-neutral-700 text-neutral-200 px-2 py-1 rounded-sm"
						>
							<option value="newest">Newest</option>
							<option value="top">Top liked</option>
						</select>
					</label>
				</div>

				{isLoggedIn && policy.canCurrentUserComment ? (
					<form onSubmit={handleSubmitComment} className="space-y-2 mb-5">
						<textarea
							value={content}
							onChange={(event) => setContent(event.target.value)}
							maxLength={COMMENT_MAX_LENGTH}
							rows={3}
							placeholder="Leave a note on this profile wall..."
							className="w-full resize-none bg-neutral-900/60 border border-neutral-800 text-neutral-100 px-4 py-3 rounded-sm focus:outline-none focus:border-neutral-500"
						/>
						<div className="flex items-center justify-between">
							<p className="text-[10px] text-neutral-600 font-bold uppercase tracking-widest">
								{content.length}/{COMMENT_MAX_LENGTH}
							</p>
							<button
								type="submit"
								disabled={createCommentLoading}
								className="px-4 py-2 rounded-sm bg-neutral-800 text-neutral-100 text-xs font-bold uppercase tracking-widest border border-neutral-600 hover:bg-neutral-700 hover:border-neutral-400 disabled:opacity-50 cursor-pointer"
							>
								{createCommentLoading ? "Posting..." : "Post Comment"}
							</button>
						</div>
					</form>
				) : (
					<p className="text-xs text-neutral-500 mb-5">
						{isLoggedIn
							? "You do not have permission to post on this wall."
							: "Log in to post profile comments."}
					</p>
				)}

				{error && (
					<div className="mb-4 p-3 border border-red-900 bg-red-950/40 text-red-200 text-xs">
						{error}
					</div>
				)}

				<div className="space-y-3">
					{commentsLoading ? (
						<p className="text-sm text-neutral-500">Loading comments...</p>
					) : comments.length === 0 ? (
						<p className="text-sm text-neutral-500">
							No comments yet. Be the first to leave a message.
						</p>
					) : (
						comments.map((comment) => {
							const avatarUrl = getUserAvatarUrl({
								profilePictureId: comment.author.profilePictureId,
								steamAvatarUrl: comment.author.steamAvatarUrl,
								useSteamAvatar: comment.author.useSteamAvatar,
								discordAvatarUrl: comment.author.discordAvatarUrl,
								useDiscordAvatar: comment.author.useDiscordAvatar,
							});

							return (
								<article
									key={comment.id}
									className={`p-4 rounded-sm border ${
										comment.isPinned
											? "bg-amber-950/15 border-amber-800/60"
											: "bg-neutral-900/30 border-neutral-800"
									}`}
								>
									<div className="flex items-start justify-between gap-3">
										<div className="flex items-start gap-3 min-w-0">
											<div className="w-9 h-9 rounded-sm overflow-hidden border border-neutral-700 relative shrink-0">
												<Image
													src={avatarUrl}
													alt={`${comment.author.username} avatar`}
													fill
													className="object-cover"
													sizes="36px"
												/>
											</div>
											<div className="min-w-0">
												<div className="flex items-center gap-2 flex-wrap">
													<Link
														href={`/profile/${comment.author.username}`}
														className="text-sm font-bold text-neutral-100 hover:text-white"
													>
														{comment.author.username}
													</Link>
													{comment.isPinned && (
														<span className="text-[10px] font-bold uppercase tracking-widest text-amber-300">
															Pinned
														</span>
													)}
													{comment.isHidden && isOwnProfile && (
														<span className="text-[10px] font-bold uppercase tracking-widest text-red-300">
															Hidden
														</span>
													)}
												</div>
												<p className="text-[11px] text-neutral-500 mt-1">
													{formatTime(comment.createdAt)}
													{comment.isEdited ? " · edited" : ""}
												</p>
											</div>
										</div>

										<div className="flex items-center gap-2 shrink-0">
											<button
												onClick={() => void handleLikeToggle(comment)}
												className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 border rounded-sm cursor-pointer ${
													comment.currentUserLiked
														? "text-emerald-300 border-emerald-700"
														: "text-neutral-400 border-neutral-700"
												}`}
											>
												Like {comment.likeCount}
											</button>
										</div>
									</div>

									<p className="mt-3 text-sm text-neutral-200 leading-relaxed whitespace-pre-wrap">
										{comment.content}
									</p>

									<div className="mt-3 flex flex-wrap gap-2">
										{comment.permissions.canEdit && (
											<button
												onClick={() => openEditModal(comment)}
												className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 border border-neutral-700 text-neutral-400 rounded-sm hover:text-neutral-200 cursor-pointer"
											>
												Edit
											</button>
										)}
										{comment.permissions.canDelete && (
											<button
												onClick={() => openDeleteModal(comment.id)}
												className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 border border-red-800 text-red-300 rounded-sm hover:text-red-200 cursor-pointer"
											>
												Delete
											</button>
										)}
										{comment.permissions.canPin && (
											<button
												onClick={() => void handlePin(comment.id)}
												className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 border border-amber-800 text-amber-300 rounded-sm hover:text-amber-200 cursor-pointer"
											>
												{comment.isPinned ? "Unpin" : "Pin"}
											</button>
										)}
										{comment.permissions.canHide && (
											<button
												onClick={() => void handleHideToggle(comment)}
												className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 border border-neutral-700 text-neutral-300 rounded-sm hover:text-white cursor-pointer"
											>
												{comment.isHidden ? "Unhide" : "Hide"}
											</button>
										)}
										{comment.permissions.canReport && (
											<button
												onClick={() => openReportModal(comment.id)}
												className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 border border-neutral-700 text-neutral-400 rounded-sm hover:text-neutral-200 cursor-pointer"
											>
												Report
											</button>
										)}
									</div>
								</article>
							);
						})
					)}
				</div>

				<div className="mt-4 flex items-center justify-between">
					<p className="text-[10px] text-neutral-600 font-bold uppercase tracking-widest">
						{pagination.totalItems} total comments
					</p>
					<div className="flex gap-2">
						<button
							onClick={() => setPage((prev) => Math.max(1, prev - 1))}
							disabled={!pagination.hasPreviousPage || commentsLoading}
							className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest border border-neutral-700 text-neutral-300 rounded-sm disabled:opacity-40"
						>
							Prev
						</button>
						<button
							onClick={() => setPage((prev) => prev + 1)}
							disabled={!pagination.hasNextPage || commentsLoading}
							className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest border border-neutral-700 text-neutral-300 rounded-sm disabled:opacity-40"
						>
							Next
						</button>
					</div>
				</div>

				<div className="mt-6 border-t border-neutral-800/70 pt-4">
					<h4 className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest mb-3">
						Comment History
					</h4>
					{historyItems.length === 0 ? (
						<p className="text-xs text-neutral-500">
							No recent wall comments from this user.
						</p>
					) : (
						<ul className="space-y-2">
							{historyItems.map((item) => (
								<li
									key={item.id}
									className="text-xs text-neutral-400 border border-neutral-800 bg-neutral-900/30 rounded-sm p-2"
								>
									<p className="text-neutral-300 line-clamp-2">{item.content}</p>
									<p className="mt-1 text-[10px] uppercase tracking-widest text-neutral-600">
										On {item.profileUsername}&apos;s wall · {formatTime(item.createdAt)}
									</p>
								</li>
							))}
						</ul>
					)}
				</div>
			</section>

			<ProfileCommentActionModal
				state={actionModal}
				onClose={closeActionModal}
				onConfirm={() => void handleConfirmModalAction()}
				onInputChange={updateModalInput}
				commentMaxLength={COMMENT_MAX_LENGTH}
				reportReasonMaxLength={REPORT_REASON_MAX_LENGTH}
			/>
		</>
	);
}
