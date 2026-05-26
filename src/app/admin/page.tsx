import { desc, eq, sql } from "drizzle-orm";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FaArrowLeft, FaShield } from "react-icons/fa6";
import AdminCleanupSection from "../../components/AdminCleanupSection";
import AdminReportedCommentsSection from "../../components/AdminReportedCommentsSection";
import AdminUserManagementSection from "../../components/AdminUserManagementSection";
import { db } from "../../db";
import {
	activityEvents,
	friendRequests,
	notifications,
	puzzleScores,
	userCosmetics,
	users,
} from "../../db/schema";
import { authOptions } from "../../lib/auth";
import { ADMIN_USERS_LIST_LIMIT } from "../../constants/admin";
import { getReportedCommentsPage } from "../../lib/admin-reported-comments";

interface AdminPageProps {
	searchParams?: Promise<{
		reportedCommentsPage?: string;
	}>;
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
	const session = await getServerSession(authOptions);
	const sessionUser = session?.user as { id?: string } | undefined;

	if (!sessionUser?.id) {
		redirect("/login");
	}

	const currentUserResult = await db
		.select({ id: users.id, isAdministrator: users.isAdministrator })
		.from(users)
		.where(eq(users.id, sessionUser.id))
		.limit(1);

	const currentUser = currentUserResult[0];

	if (!currentUser?.isAdministrator) {
		redirect("/dashboard");
	}

	const params = await searchParams;
	const requestedReportedCommentsPage = Number(params?.reportedCommentsPage ?? "1");
	const reportedCommentsPage = await getReportedCommentsPage(
		Number.isFinite(requestedReportedCommentsPage) ? requestedReportedCommentsPage : 1,
		10
	);

	const [
		totalUsersResult,
		totalUnlocksResult,
		totalActivityResult,
		totalNotificationsResult,
		pendingFriendRequestsResult,
		totalPuzzleRunsResult,
		managedUsers,
	] = await Promise.all([
		db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(users),
		db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(userCosmetics),
		db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(activityEvents),
		db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(notifications),
		db
			.select({ count: sql<number>`count(*)`.mapWith(Number) })
			.from(friendRequests)
			.where(eq(friendRequests.status, "pending")),
		db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(puzzleScores),
		db
			.select({
				id: users.id,
				username: users.username,
				isAdministrator: users.isAdministrator,
				createdViaDiscord: users.createdViaDiscord,
				createdAt: users.createdAt,
			})
			.from(users)
			.orderBy(desc(users.createdAt))
			.limit(ADMIN_USERS_LIST_LIMIT),
	]);

	const metrics = [
		{ label: "Total Users", value: totalUsersResult[0]?.count ?? 0 },
		{ label: "Cosmetics Unlocked", value: totalUnlocksResult[0]?.count ?? 0 },
		{ label: "Activity Events", value: totalActivityResult[0]?.count ?? 0 },
		{ label: "Notifications", value: totalNotificationsResult[0]?.count ?? 0 },
		{
			label: "Pending Friend Requests",
			value: pendingFriendRequestsResult[0]?.count ?? 0,
		},
		{ label: "Puzzle Runs", value: totalPuzzleRunsResult[0]?.count ?? 0 },
		{
			label: "Reported Comments",
			value: reportedCommentsPage.pagination.totalItems,
		},
	];

	return (
		<main className="min-h-screen text-neutral-200 flex flex-col items-center py-8 sm:py-12 px-4 sm:px-6 relative z-10 selection:bg-neutral-800/50 selection:text-neutral-200">
			<div className="w-full max-w-6xl rounded-3xl bg-[linear-gradient(145deg,rgba(12,10,8,0.95),rgba(29,22,14,0.9))] backdrop-blur-md border border-neutral-800/80 shadow-[0_24px_80px_rgba(0,0,0,0.45)] relative p-4 sm:p-6 lg:p-8 flex flex-col">
				<div className="mb-6">
					<Link
						href="/dashboard"
						className="inline-flex items-center gap-2 rounded-full border border-neutral-700 bg-black/35 px-4 py-2 text-[11px] uppercase tracking-[0.16em] font-semibold text-neutral-300 hover:border-neutral-500 hover:text-neutral-100 transition-colors w-fit"
					>
						<FaArrowLeft /> Return to Safehouse
					</Link>
				</div>

				<div className="mb-8 border-b border-neutral-800/80 pb-6 text-center sm:text-left">
					<h1 className="text-3xl sm:text-5xl font-black tracking-tight text-neutral-100 uppercase mb-2 flex items-center justify-center sm:justify-start gap-3">
						<FaShield className="text-amber-300" />
						Admin Panel
					</h1>
					<p className="text-sm text-neutral-400 font-medium tracking-wide">
						Operational overview and platform metrics.
					</p>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
					{metrics.map((metric) => (
						<div
							key={metric.label}
							className="p-4 bg-neutral-900/50 border border-neutral-800 rounded-2xl"
						>
							<p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
								{metric.label}
							</p>
							<p className="text-2xl font-black text-neutral-200 mt-2">
								{metric.value.toLocaleString()}
							</p>
						</div>
					))}
				</div>

				<AdminCleanupSection />

				<AdminReportedCommentsSection
					items={reportedCommentsPage.data}
					pagination={reportedCommentsPage.pagination}
				/>

				<AdminUserManagementSection
					users={managedUsers.map((user) => ({
						id: user.id,
						username: user.username,
						isAdministrator: user.isAdministrator,
						createdViaDiscord: user.createdViaDiscord,
						createdAt: user.createdAt.toISOString(),
					}))}
					currentUserId={currentUser.id}
				/>
			</div>
		</main>
	);
}
