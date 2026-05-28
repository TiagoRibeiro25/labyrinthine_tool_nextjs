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
		<main className="min-h-screen text-neutral-200 px-3 sm:px-6 py-6 sm:py-10 relative z-10 selection:bg-cyan-400/20 selection:text-cyan-100">
			<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(16,185,129,0.12),transparent_36%),radial-gradient(circle_at_86%_18%,rgba(56,189,248,0.16),transparent_34%),radial-gradient(circle_at_45%_92%,rgba(168,85,247,0.14),transparent_38%)]" />

			<div className="relative w-full max-w-7xl mx-auto">
				<div className="rounded-4xl border border-neutral-800/90 bg-neutral-950/75 backdrop-blur-xl shadow-[0_40px_120px_rgba(0,0,0,0.55)] overflow-hidden">
					<header className="relative px-4 sm:px-8 pt-6 sm:pt-8 pb-5 border-b border-neutral-800/80">
						<div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
							<div className="min-w-0">
								<div className="flex items-center gap-3">
									<span className="inline-flex items-center gap-2 rounded-full border border-neutral-700/80 bg-neutral-900/60 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-neutral-300">
										<span className="relative flex h-2 w-2">
											<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60"></span>
											<span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
										</span>
										Dashboard
									</span>
									{targetUser.isAdministrator && (
										<span className="inline-flex items-center gap-2 rounded-full border border-amber-500/50 bg-amber-950/50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-amber-200">
											<FaShield className="h-3.5 w-3.5" />
											Admin
										</span>
									)}
								</div>

								<h1 className="mt-4 text-3xl sm:text-5xl font-black uppercase tracking-tight text-white truncate">
									The Safehouse
								</h1>
								<p className="mt-2 text-sm sm:text-base text-neutral-400 font-medium">
									Welcome back,{" "}
									<span className="text-neutral-200 font-bold">
										{targetUser.username}
									</span>
									. Pick your next move.
								</p>
							</div>

							<div className="flex flex-col sm:flex-row gap-3 sm:items-center">
								<Link
									href="/"
									className="group inline-flex items-center justify-center gap-3 px-5 py-3 rounded-full bg-neutral-900/80 text-neutral-100 font-bold text-xs sm:text-sm uppercase tracking-[0.14em] border border-neutral-700/90 hover:bg-neutral-800 hover:border-neutral-400 transition-all duration-300 shadow-[0_0_15px_rgba(255,255,255,0.05)] hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] w-full sm:w-auto"
								>
									<FaArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
									Return Home
								</Link>
								<LogoutButton />
							</div>
						</div>

						<div className="mt-6 grid grid-cols-3 gap-2.5 sm:gap-3">
							<div className="rounded-2xl border border-neutral-800 bg-neutral-900/35 px-3 py-3 sm:px-4 sm:py-4">
								<p className="text-[10px] sm:text-[11px] font-bold text-neutral-500 uppercase tracking-[0.2em]">
									Friends
								</p>
								<p className="mt-2 text-xl sm:text-2xl font-black text-white">
									{friendsCount}
								</p>
							</div>
							<div className="rounded-2xl border border-neutral-800 bg-neutral-900/35 px-3 py-3 sm:px-4 sm:py-4">
								<p className="text-[10px] sm:text-[11px] font-bold text-neutral-500 uppercase tracking-[0.2em]">
									Unlocked
								</p>
								<p className="mt-2 text-xl sm:text-2xl font-black text-emerald-400">
									{unlockedCount}
								</p>
							</div>
							<div className="rounded-2xl border border-neutral-800 bg-neutral-900/35 px-3 py-3 sm:px-4 sm:py-4">
								<p className="text-[10px] sm:text-[11px] font-bold text-neutral-500 uppercase tracking-[0.2em]">
									Incoming
								</p>
								<p className="mt-2 text-xl sm:text-2xl font-black text-amber-300">
									{pendingIncomingCount}
								</p>
							</div>
						</div>
					</header>

					<div className="p-4 sm:p-8 lg:p-10">
						<section className="space-y-6">
							<div className="flex items-end justify-between gap-4">
								<div>
									<p className="text-[11px] font-bold text-neutral-500 uppercase tracking-[0.2em]">
										Featured
									</p>
									<h2 className="mt-2 text-lg sm:text-xl font-black uppercase tracking-tight text-white">
										Your next move
									</h2>
								</div>
								<Link
									href={`/profile/${targetUser.username}`}
									className="hidden sm:inline-flex items-center gap-2 rounded-full border border-neutral-700/80 bg-neutral-900/40 px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-neutral-200 hover:border-purple-500/50 hover:text-purple-200 transition-colors"
								>
									<FaUser className="h-4 w-4" />
									Profile
								</Link>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
								{featured.map((item) => (
									<Link
										key={item.href}
										href={item.href}
										className="group rounded-3xl border border-neutral-800 bg-[linear-gradient(145deg,rgba(10,12,14,0.9),rgba(18,24,22,0.55))] p-5 sm:p-6 hover:border-neutral-700 hover:bg-neutral-900/60 transition-colors relative overflow-hidden"
									>
										<div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-[radial-gradient(circle_at_18%_18%,rgba(56,189,248,0.16),transparent_46%),radial-gradient(circle_at_82%_85%,rgba(16,185,129,0.12),transparent_42%)]" />

										<div className="relative flex items-start justify-between gap-4">
											<span
												className={[
													"inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-neutral-800 bg-neutral-900/60 text-neutral-200 transition-colors",
													item.accent === "emerald" ? "group-hover:text-emerald-300" : "",
													item.accent === "sky" ? "group-hover:text-sky-300" : "",
													item.accent === "amber" ? "group-hover:text-amber-300" : "",
												].join(" ")}
											>
												{item.icon}
											</span>

											{item.metric && (
												<div className="text-right">
													<p className="text-2xl font-black text-white tabular-nums leading-none">
														{item.metric.value}
													</p>
													<p className="mt-1 text-[10px] font-bold uppercase tracking-[0.22em] text-neutral-500">
														{item.metric.label}
													</p>
												</div>
											)}
										</div>

										<p className="relative mt-5 text-base font-black uppercase tracking-[0.12em] text-neutral-100">
											{item.title}
										</p>
										<p className="relative mt-2 text-sm text-neutral-400 leading-relaxed">
											{item.description}
										</p>

										<div className="relative mt-6 flex items-center justify-between text-xs font-bold uppercase tracking-[0.18em] text-neutral-400">
											<span className="group-hover:text-neutral-200 transition-colors">
												Open
											</span>
											<span className="text-neutral-600 group-hover:text-neutral-200 transition-colors">
												&rarr;
											</span>
										</div>
									</Link>
								))}
							</div>

							<div className="rounded-3xl border border-neutral-800 bg-neutral-900/25 p-5 sm:p-6">
								<div className="flex items-center justify-between gap-4">
									<div>
										<p className="text-[11px] font-bold text-neutral-500 uppercase tracking-[0.2em]">
											More
										</p>
										<h3 className="mt-2 text-base sm:text-lg font-black uppercase tracking-tight text-white">
											Explore the fog
										</h3>
									</div>
									<Link
										href="/search"
										className="hidden sm:inline-flex items-center gap-2 rounded-full border border-neutral-700/80 bg-neutral-950/40 px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-neutral-200 hover:border-cyan-500/50 hover:text-cyan-200 transition-colors"
									>
										<FaMagnifyingGlass className="h-4 w-4" />
										Search
									</Link>
								</div>

								<div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
									{secondary.map((item) => (
										<Link
											key={item.href}
											href={item.href}
											className="group rounded-2xl border border-neutral-800 bg-neutral-950/40 p-4 hover:bg-neutral-900/60 hover:border-neutral-700 transition-colors"
										>
											<div className="flex items-start gap-3">
												<span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-neutral-800 bg-neutral-900/60 text-neutral-200 group-hover:text-cyan-200 transition-colors shrink-0">
													{"icon" in item ? item.icon : null}
												</span>
												<div className="min-w-0">
													<p className="text-sm font-black uppercase tracking-[0.12em] text-neutral-100 truncate">
														{item.title}
													</p>
													<p className="mt-1 text-xs text-neutral-500 leading-relaxed">
														{item.description}
													</p>
												</div>
											</div>
											<p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-neutral-400 group-hover:text-neutral-200 transition-colors">
												Open &rarr;
											</p>
										</Link>
									))}

									{targetUser.isAdministrator && (
										<Link
											href="/admin"
											className="group rounded-2xl border border-amber-900/60 bg-amber-950/20 p-4 hover:bg-amber-950/30 hover:border-amber-700/70 transition-colors"
										>
											<div className="flex items-start gap-3">
												<span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-amber-900/60 bg-amber-950/35 text-amber-200 shrink-0">
													<FaShield className="h-5 w-5" />
												</span>
												<div className="min-w-0">
													<p className="text-sm font-black uppercase tracking-[0.12em] text-neutral-100 truncate">
														Admin Panel
													</p>
													<p className="mt-1 text-xs text-neutral-500 leading-relaxed">
														Operations tools and cleanup utilities.
													</p>
												</div>
											</div>
											<p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-amber-200/80 group-hover:text-amber-100 transition-colors">
												Open &rarr;
											</p>
										</Link>
									)}
								</div>
							</div>
						</section>
					</div>

					<footer className="border-t border-neutral-800/80 px-4 sm:px-8 py-6">
						<div className="w-full">
							<ContactDeveloperInfo />
						</div>
					</footer>
				</div>
			</div>
		</main>
	);
}
