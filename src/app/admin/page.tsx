import { desc, eq, sql } from "drizzle-orm";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FaArrowLeft, FaShield, FaUsers } from "react-icons/fa6";
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

export default async function AdminPage() {
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

	const [
		totalUsersResult,
		totalUnlocksResult,
		totalActivityResult,
		totalNotificationsResult,
		pendingFriendRequestsResult,
		totalPuzzleRunsResult,
		recentSignups,
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
				createdAt: users.createdAt,
			})
			.from(users)
			.orderBy(desc(users.createdAt))
			.limit(12),
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
	];

	return (
		<main className="min-h-screen text-neutral-200 flex flex-col items-center py-12 px-4 sm:px-6 relative z-10 selection:bg-neutral-800/50 selection:text-neutral-200">
			<div className="w-full max-w-5xl bg-black/80 backdrop-blur-md border border-neutral-800 border-t-4 border-t-neutral-600 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative p-6 sm:p-10 flex flex-col">
				<div className="mb-6">
					<Link
						href="/dashboard"
						className="text-xs text-neutral-500 font-bold uppercase tracking-widest hover:text-neutral-300 transition-colors flex items-center justify-center sm:justify-start gap-2 w-fit"
					>
						<FaArrowLeft /> Return to Safehouse
					</Link>
				</div>

				<div className="mb-8 border-b border-neutral-800/80 pb-6 text-center sm:text-left">
					<h1 className="text-3xl sm:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-linear-to-b from-neutral-100 to-neutral-500 uppercase mb-2 flex items-center justify-center sm:justify-start gap-3">
						<FaShield className="text-amber-500" />
						Admin Panel
					</h1>
					<p className="text-sm text-neutral-400 font-medium tracking-wide">
						Operational overview and platform metrics.
					</p>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
					{metrics.map((metric) => (
						<div
							key={metric.label}
							className="p-4 bg-neutral-900/50 border border-neutral-800 rounded-sm"
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

				<div className="mt-8 p-5 bg-black/50 border border-neutral-800 rounded-sm">
					<h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-4 border-b border-neutral-800/50 pb-2 flex items-center gap-2">
						<FaUsers /> Recent Signups
					</h3>
					<div className="space-y-3">
						{recentSignups.map((user) => (
							<Link
								key={user.id}
								href={`/profile/${user.username}`}
								className="flex items-center justify-between gap-3 p-3 bg-neutral-900/40 border border-neutral-800 rounded-sm hover:bg-neutral-800/60 hover:border-neutral-500 transition-colors"
							>
								<div className="min-w-0">
									<p className="text-sm font-bold uppercase tracking-widest text-neutral-200 truncate">
										{user.username}
									</p>
									<p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold mt-1">
										Joined {user.createdAt.toLocaleDateString()}
									</p>
								</div>
								{user.isAdministrator ? (
									<span className="px-2 py-1 bg-amber-900/40 text-amber-300 text-[10px] font-bold uppercase tracking-widest border border-amber-700 rounded-sm">
										Admin
									</span>
								) : null}
							</Link>
						))}
					</div>
				</div>
			</div>
		</main>
	);
}
