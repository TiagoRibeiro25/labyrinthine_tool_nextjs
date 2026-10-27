import { and, eq, or } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
	FaArrowLeft,
	FaBell,
	FaClockRotateLeft,
	FaMagnifyingGlass,
	FaPuzzlePiece,
	FaShield,
	FaShirt,
	FaTrophy,
	FaUser,
	FaUserGroup,
} from "react-icons/fa6";
import LogoutButton from "../../components/LogoutButton";
import { db } from "../../db";
import { friendRequests, userCosmetics, users } from "../../db/schema";
import { getValidatedServerSession } from "../../lib/session-user";
import ContactDeveloperInfo from "@/components/ContactDeveloperInfo";

export default async function DashboardPage() {
	const session = await getValidatedServerSession();

	const sessionUser = session?.user as { id?: string; name?: string | null } | undefined;

	if (!session || !sessionUser?.id) {
		redirect("/login");
	}

	const targetUserResult = await db
		.select()
		.from(users)
		.where(eq(users.id, sessionUser.id))
		.limit(1);

	const targetUser = targetUserResult[0];

	if (!targetUser) {
		redirect("/login");
	}

	const [friendsResult, unlockedCosmeticsResult, pendingIncomingResult] =
		await Promise.all([
			db
				.select({ id: friendRequests.id })
				.from(friendRequests)
				.where(
					and(
						or(
							eq(friendRequests.senderId, targetUser.id),
							eq(friendRequests.receiverId, targetUser.id)
						),
						eq(friendRequests.status, "accepted")
					)
				),
			db
				.select({ id: userCosmetics.id })
				.from(userCosmetics)
				.where(eq(userCosmetics.userId, targetUser.id)),
			db
				.select({ id: friendRequests.id })
				.from(friendRequests)
				.where(
					and(
						eq(friendRequests.receiverId, targetUser.id),
						eq(friendRequests.status, "pending")
					)
				),
		]);

	const friendsCount = friendsResult.length;
	const unlockedCount = unlockedCosmeticsResult.length;
	const pendingIncomingCount = pendingIncomingResult.length;

	const quickLinks = [
		{
			href: "/cosmetics",
			title: "Wardrobe",
			description: "Manage cosmetics, favorites, and collection progress.",
			icon: <FaShirt className="h-5 w-5" />,
			accent: "emerald",
			metric: { value: unlockedCount, label: "Unlocked" },
		},
		{
			href: "/friends",
			title: "Connections",
			description: "Friends list, requests, and social tools.",
			icon: <FaUserGroup className="h-5 w-5" />,
			accent: "sky",
			metric: { value: friendsCount, label: "Friends" },
		},
		{
			href: "/notifications",
			title: "Notifications",
			description: "Friend requests, accepts, and updates.",
			icon: <FaBell className="h-5 w-5" />,
			accent: "amber",
			metric: { value: pendingIncomingCount, label: "Incoming" },
		},
		{
			href: `/profile/${targetUser.username}`,
			title: "Public Profile",
			description: "Your banner, bio, achievements, and comments.",
			icon: <FaUser className="h-5 w-5" />,
			accent: "purple",
		},
	] as const;

	const tools = [
		{
			href: "/search",
			title: "Find Survivors",
			description: "Search players and browse their collections.",
			icon: <FaMagnifyingGlass className="h-4 w-4" />,
		},
		{
			href: "/leaderboard",
			title: "Top Collectors",
			description: "See who leads the cosmetic leaderboard.",
			icon: <FaTrophy className="h-4 w-4" />,
		},
		{
			href: "/activity",
			title: "Activity Feed",
			description: "Watch recent unlocks and puzzle completions.",
			icon: <FaClockRotateLeft className="h-4 w-4" />,
		},
		{
			href: "/puzzles",
			title: "Puzzles",
			description: "Test your skills with puzzles.",
			icon: <FaPuzzlePiece className="h-4 w-4" />,
		},
		{
			href: "/puzzles/leaderboard",
			title: "Puzzle Leaderboards",
			description: "Global rankings for puzzle runs.",
			icon: <FaPuzzlePiece className="h-4 w-4" />,
		},
	] as const;

	const featured = [quickLinks[0], quickLinks[1], quickLinks[2]] as const;
	const secondary = [quickLinks[3], ...tools] as const;

	return (
		<main className="relative z-10 min-h-screen px-4 py-6 text-neutral-200 selection:bg-cyan-400/20 selection:text-cyan-100 sm:px-8 sm:py-10">
			<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(16,185,129,0.1),transparent_34%),radial-gradient(circle_at_85%_15%,rgba(56,189,248,0.1),transparent_32%)]" />

			<div className="relative mx-auto w-full max-w-6xl overflow-hidden rounded-3xl border border-neutral-800/90 bg-neutral-950/80 shadow-[0_30px_90px_rgba(0,0,0,0.5)] backdrop-blur-xl">
				<header className="border-b border-neutral-800/80 px-5 py-7 sm:px-10 sm:py-9">
					<div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
						<div className="min-w-0">
							<div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-neutral-500">
								<span className="inline-flex items-center gap-2">
									<span className="h-2 w-2 rounded-full bg-emerald-400" />
									Dashboard
								</span>
								{targetUser.isAdministrator && (
									<span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-950/40 px-2.5 py-1 text-amber-200">
										<FaShield className="h-3 w-3" />
										Admin
									</span>
								)}
							</div>
							<h1 className="mt-3 truncate text-3xl font-black tracking-tight text-white sm:text-5xl">
								Welcome back, {targetUser.username}
							</h1>
							<p className="mt-2 text-sm text-neutral-400 sm:text-base">
								Everything you need, in one place.
							</p>
						</div>

						<div className="flex flex-col gap-2 sm:flex-row">
							<Link
								href="/"
								className="group inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-700 bg-neutral-900/70 px-4 py-2.5 text-sm font-bold text-neutral-200 transition-colors hover:border-neutral-500 hover:bg-neutral-800"
							>
								<FaArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
								Home
							</Link>
							<LogoutButton />
						</div>
					</div>

					<div className="mt-7 grid grid-cols-3 divide-x divide-neutral-800 rounded-2xl border border-neutral-800 bg-neutral-900/35">
						<div className="px-3 py-3 sm:px-5 sm:py-4">
							<p className="text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-500 sm:text-xs">
								Friends
							</p>
							<p className="mt-1 text-2xl font-black text-white">{friendsCount}</p>
						</div>
						<div className="px-3 py-3 sm:px-5 sm:py-4">
							<p className="text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-500 sm:text-xs">
								Unlocked
							</p>
							<p className="mt-1 text-2xl font-black text-emerald-400">{unlockedCount}</p>
						</div>
						<div className="px-3 py-3 sm:px-5 sm:py-4">
							<p className="text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-500 sm:text-xs">
								Incoming
							</p>
							<p className="mt-1 text-2xl font-black text-amber-300">
								{pendingIncomingCount}
							</p>
						</div>
					</div>
				</header>

				<div className="space-y-10 px-5 py-8 sm:px-10 sm:py-10">
					<section>
						<div className="mb-4">
							<p className="text-xs font-bold uppercase tracking-[0.16em] text-neutral-500">
								Start here
							</p>
							<h2 className="mt-1 text-xl font-bold text-white">Your essentials</h2>
						</div>
						<div className="grid gap-3 md:grid-cols-3">
							{featured.map((item) => (
								<Link
									key={item.href}
									href={item.href}
									className="group flex items-center gap-4 rounded-2xl border border-neutral-800 bg-neutral-900/45 p-4 transition-colors hover:border-neutral-600 hover:bg-neutral-800/70"
								>
									<span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-neutral-700 bg-neutral-950/60 text-neutral-200 transition-colors group-hover:text-emerald-300">
										{item.icon}
									</span>
									<span className="min-w-0 flex-1">
										<span className="block font-bold text-neutral-100">{item.title}</span>
										<span className="mt-1 block text-xs text-neutral-500">
											{item.metric
												? `${item.metric.value} ${item.metric.label.toLowerCase()}`
												: "View your profile"}
										</span>
									</span>
									<span className="text-lg text-neutral-600 transition-colors group-hover:text-neutral-200">
										&rarr;
									</span>
								</Link>
							))}
						</div>
					</section>

					<section>
						<div className="mb-4 flex items-end justify-between gap-4">
							<div>
								<p className="text-xs font-bold uppercase tracking-[0.16em] text-neutral-500">
									Explore
								</p>
								<h2 className="mt-1 text-xl font-bold text-white">
									All tools and options
								</h2>
							</div>
							<span className="hidden text-xs text-neutral-500 sm:block">
								All dashboard options
							</span>
						</div>
						<div className="divide-y divide-neutral-800 rounded-2xl border border-neutral-800 bg-neutral-900/25">
							{secondary.map((item) => (
								<Link
									key={item.href}
									href={item.href}
									className="group flex items-center gap-4 px-4 py-3.5 transition-colors first:rounded-t-2xl last:rounded-b-2xl hover:bg-neutral-800/60 sm:px-5"
								>
									<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-800/70 text-neutral-400 transition-colors group-hover:text-cyan-300">
										{"icon" in item ? item.icon : null}
									</span>
									<span className="min-w-0 flex-1">
										<span className="block font-semibold text-neutral-200">
											{item.title}
										</span>
										<span className="block truncate text-xs text-neutral-500">
											{item.description}
										</span>
									</span>
									<span className="text-neutral-600 transition-colors group-hover:text-neutral-200">
										&rarr;
									</span>
								</Link>
							))}
							{targetUser.isAdministrator && (
								<Link
									href="/admin"
									className="group flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-amber-950/30 sm:px-5"
								>
									<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-950/40 text-amber-200">
										<FaShield className="h-4 w-4" />
									</span>
									<span className="min-w-0 flex-1">
										<span className="block font-semibold text-neutral-200">
											Admin Panel
										</span>
										<span className="block truncate text-xs text-neutral-500">
											Operations tools and cleanup utilities.
										</span>
									</span>
									<span className="text-amber-200/70 transition-colors group-hover:text-amber-100">
										&rarr;
									</span>
								</Link>
							)}
						</div>
					</section>
				</div>

				<footer className="border-t border-neutral-800/80 px-5 py-6 sm:px-10">
					<ContactDeveloperInfo />
				</footer>
			</div>
		</main>
	);
}
