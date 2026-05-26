"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
	FaChevronDown,
	FaChevronUp,
	FaKey,
	FaMagnifyingGlass,
	FaTrashCan,
	FaUsers,
} from "react-icons/fa6";
import { useDebounce } from "use-debounce";
import { ADMIN_USERS_LIST_LIMIT } from "../constants/admin";
import { useApi } from "../hooks/useApi";
import { useToast } from "../hooks/useToast";

export interface AdminManagedUser {
	id: string;
	username: string;
	isAdministrator: boolean;
	createdViaDiscord: boolean;
	createdAt: string;
}

interface AdminUserManagementSectionProps {
	users: AdminManagedUser[];
	currentUserId: string;
}

export default function AdminUserManagementSection({
	users,
	currentUserId,
}: AdminUserManagementSectionProps) {
	const router = useRouter();
	const { success, error } = useToast();
	const { execute: executeAction, loading: actionLoading } = useApi<{ message: string }>();
	const {
		execute: executeSearch,
		loading: searchLoading,
		setData: setSearchResults,
	} = useApi<AdminManagedUser[]>();

	const [searchQuery, setSearchQuery] = useState<string>("");
	const [displayedUsers, setDisplayedUsers] = useState<AdminManagedUser[]>(users);
	const [expandedUserIds, setExpandedUserIds] = useState<Record<string, boolean>>({});
	const [passwordDrafts, setPasswordDrafts] = useState<Record<string, string>>({});
	const [deleteConfirmations, setDeleteConfirmations] = useState<Record<string, string>>({});

	const [debouncedQuery] = useDebounce(searchQuery, 400);
	const isSearching = debouncedQuery.trim().length > 0;

	useEffect(() => {
		setDisplayedUsers(users);
	}, [users]);

	useEffect(() => {
		const trimmedQuery = debouncedQuery.trim();

		if (!trimmedQuery) {
			setSearchResults(null);
			setDisplayedUsers(users);
			return;
		}

		executeSearch(`/api/admin/users?q=${encodeURIComponent(trimmedQuery)}`)
			.then((results) => {
				setDisplayedUsers(results ?? []);
			})
			.catch(() => {
				setDisplayedUsers([]);
			});
	}, [debouncedQuery, executeSearch, setSearchResults, users]);

	const toggleExpanded = (userId: string) => {
		setExpandedUserIds((current) => ({
			...current,
			[userId]: !current[userId],
		}));
	};

	const handlePasswordChange = async (user: AdminManagedUser) => {
		const password = passwordDrafts[user.id]?.trim() ?? "";

		if (password.length < 6) {
			error("Invalid password", "Password must be at least 6 characters long.");
			return;
		}

		if (
			!window.confirm(
				`Set a new password for "${user.username}"? They will need to use it on their next login.`
			)
		) {
			return;
		}

		try {
			const result = await executeAction(`/api/admin/users/${user.id}/password`, {
				method: "PATCH",
				body: JSON.stringify({ password }),
			});

			success("Password updated", result?.message ?? "Password updated successfully.");
			setPasswordDrafts((current) => ({ ...current, [user.id]: "" }));
			router.refresh();
		} catch (err) {
			const message = err instanceof Error ? err.message : "Failed to update password.";
			error("Password update failed", message);
		}
	};

	const handleDeleteUser = async (user: AdminManagedUser) => {
		const confirmationUsername = deleteConfirmations[user.id]?.trim() ?? "";

		if (confirmationUsername !== user.username) {
			error(
				"Confirmation required",
				`Type "${user.username}" exactly to confirm deletion.`
			);
			return;
		}

		if (
			!window.confirm(
				`Permanently delete "${user.username}" and all associated data? This cannot be undone.`
			)
		) {
			return;
		}

		try {
			const result = await executeAction(`/api/admin/users/${user.id}`, {
				method: "DELETE",
				body: JSON.stringify({ confirmationUsername }),
			});

			success("Account deleted", result?.message ?? "Account deleted successfully.");
			setDeleteConfirmations((current) => {
				const next = { ...current };
				delete next[user.id];
				return next;
			});
			setExpandedUserIds((current) => {
				const next = { ...current };
				delete next[user.id];
				return next;
			});
			router.refresh();
		} catch (err) {
			const message = err instanceof Error ? err.message : "Failed to delete account.";
			error("Deletion failed", message);
		}
	};

	const canDeleteUser = (user: AdminManagedUser) =>
		user.id !== currentUserId && !user.isAdministrator;

	return (
		<section className="mt-8 p-5 bg-black/50 border border-neutral-800 rounded-2xl">
			<div className="mb-5 border-b border-neutral-800/50 pb-4">
				<h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-2">
					<FaUsers /> User accounts
				</h3>
				<p className="mt-2 text-sm text-neutral-400 leading-relaxed">
					Showing up to {ADMIN_USERS_LIST_LIMIT} accounts. Search by username to find
					others. Expand a row to manage accounts. Password reset is only available for
					username/password signups.
				</p>
			</div>

			<div className="mb-5">
				<label
					htmlFor="admin-user-search"
					className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 flex items-center gap-2 mb-2"
				>
					<FaMagnifyingGlass /> Search by username
				</label>
				<input
					id="admin-user-search"
					type="search"
					value={searchQuery}
					onChange={(event) => setSearchQuery(event.target.value)}
					placeholder="Search username..."
					className="w-full px-3 py-2.5 bg-neutral-950 border border-neutral-800 rounded-sm text-sm text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-amber-700"
					autoComplete="off"
				/>
				<p className="mt-2 text-[10px] text-neutral-500 uppercase tracking-widest font-bold">
					{searchLoading && isSearching
						? "Searching..."
						: isSearching
							? `${displayedUsers.length} match${displayedUsers.length === 1 ? "" : "es"}`
							: `${displayedUsers.length} recent account${displayedUsers.length === 1 ? "" : "s"}`}
				</p>
			</div>

			<div className="space-y-3">
				{displayedUsers.length === 0 ? (
					<div className="py-8 text-center border border-dashed border-neutral-800 rounded-xl bg-black/20">
						<p className="text-neutral-500 font-medium italic">
							{isSearching ? "No users match that search." : "No users found."}
						</p>
					</div>
				) : (
					displayedUsers.map((user) => {
						const isCurrentUser = user.id === currentUserId;
						const deleteAllowed = canDeleteUser(user);
						const isExpanded = expandedUserIds[user.id] === true;

						return (
							<article
								key={user.id}
								className="bg-neutral-900/40 border border-neutral-800 rounded-xl overflow-hidden"
							>
								<div className="flex items-center justify-between gap-3 p-3 sm:p-4">
									<div className="min-w-0 flex-1">
										<div className="flex flex-wrap items-center gap-2">
											<Link
												href={`/profile/${user.username}`}
												className="text-sm font-bold uppercase tracking-widest text-neutral-200 hover:text-amber-200 transition-colors truncate"
											>
												{user.username}
											</Link>
											{isCurrentUser ? (
												<span className="px-2 py-1 text-[10px] font-bold uppercase tracking-widest rounded-sm bg-neutral-800 text-neutral-300 border border-neutral-700">
													You
												</span>
											) : null}
											{user.isAdministrator ? (
												<span className="px-2 py-1 bg-amber-900/40 text-amber-300 text-[10px] font-bold uppercase tracking-widest border border-amber-700 rounded-sm">
													Admin
												</span>
											) : null}
											{user.createdViaDiscord ? (
												<span className="px-2 py-1 bg-indigo-900/40 text-indigo-300 text-[10px] font-bold uppercase tracking-widest border border-indigo-700 rounded-sm">
													Discord
												</span>
											) : null}
										</div>
										<p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold mt-1">
											Joined {new Date(user.createdAt).toLocaleDateString()}
										</p>
									</div>

									<button
										type="button"
										onClick={() => toggleExpanded(user.id)}
										className="shrink-0 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-sm bg-neutral-950 text-neutral-300 font-bold text-[10px] uppercase tracking-widest border border-neutral-700 hover:border-neutral-500 hover:text-neutral-100 transition-colors"
										aria-expanded={isExpanded}
									>
										{isExpanded ? (
											<>
												Close <FaChevronUp className="h-3 w-3" />
											</>
										) : (
											<>
												Manage <FaChevronDown className="h-3 w-3" />
											</>
										)}
									</button>
								</div>

								{isExpanded ? (
									<div className="px-3 sm:px-4 pb-4 pt-0 border-t border-neutral-800/80">
										<div
											className={`grid grid-cols-1 gap-4 pt-4 ${user.createdViaDiscord ? "" : "xl:grid-cols-2"}`}
										>
											{user.createdViaDiscord ? (
												<div className="p-4 bg-black/30 border border-neutral-800 rounded-xl">
													<p className="text-sm text-neutral-400 leading-relaxed">
														This account was created with Discord and signs in
														with Discord only. There is no password to reset.
													</p>
												</div>
											) : (
												<div className="p-4 bg-black/30 border border-neutral-800 rounded-xl space-y-3">
													<p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 flex items-center gap-2">
														<FaKey /> Reset password
													</p>
													<input
														type="password"
														value={passwordDrafts[user.id] ?? ""}
														onChange={(event) =>
															setPasswordDrafts((current) => ({
																...current,
																[user.id]: event.target.value,
															}))
														}
														placeholder="New password (min. 6 characters)"
														className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-sm text-sm text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-amber-700"
														autoComplete="new-password"
													/>
													<button
														type="button"
														onClick={() => handlePasswordChange(user)}
														disabled={
															actionLoading ||
															(passwordDrafts[user.id]?.trim().length ?? 0) < 6
														}
														className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-sm bg-amber-950/40 text-amber-200 font-bold text-[11px] uppercase tracking-widest border border-amber-900 hover:bg-amber-900/40 hover:border-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
													>
														Update password
													</button>
												</div>
											)}

											<div className="p-4 bg-black/30 border border-neutral-800 rounded-xl space-y-3">
												<p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 flex items-center gap-2">
													<FaTrashCan /> Delete account
												</p>
												{deleteAllowed ? (
													<>
														<input
															type="text"
															value={deleteConfirmations[user.id] ?? ""}
															onChange={(event) =>
																setDeleteConfirmations((current) => ({
																	...current,
																	[user.id]: event.target.value,
																}))
															}
															placeholder={`Type ${user.username} to confirm`}
															className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-sm text-sm text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-red-800"
															autoComplete="off"
														/>
														<button
															type="button"
															onClick={() => handleDeleteUser(user)}
															disabled={
																actionLoading ||
																deleteConfirmations[user.id]?.trim() !==
																	user.username
															}
															className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-sm bg-red-950/40 text-red-200 font-bold text-[11px] uppercase tracking-widest border border-red-900 hover:bg-red-900/50 hover:border-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
														>
															Delete account
														</button>
													</>
												) : (
													<p className="text-sm text-neutral-500 leading-relaxed">
														{isCurrentUser
															? "Use your profile settings to delete your own account."
															: "Administrator accounts cannot be deleted from this panel."}
													</p>
												)}
											</div>
										</div>
									</div>
								) : null}
							</article>
						);
					})
				)}
			</div>
		</section>
	);
}
