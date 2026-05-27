import { and, asc, desc, eq, inArray, or } from "drizzle-orm";
import { getServerSession } from "next-auth";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
	FaDiscord,
	FaLightbulb,
	FaPuzzlePiece,
	FaShirt,
	FaSteam,
	FaUserGroup,
} from "react-icons/fa6";
import EditProfileButton from "../../../components/EditProfileButton";
import FriendActions from "../../../components/FriendActions";
import ProfileAchievementsPanel from "../../../components/ProfileAchievementsPanel";
import ProfileCommentsSection from "../../../components/ProfileCommentsSection";
import { getBannerImageById } from "../../../data/profile-banners";
import { db } from "../../../db";
import {
	friendRequests,
	profileComments,
	puzzleScores,
	userCosmetics,
	users,
} from "../../../db/schema";
import { authOptions } from "../../../lib/auth";
import { getUserAvatarUrl } from "../../../lib/avatar";
import { allCosmetics, categories, getCosmeticById } from "../../../lib/cosmetics";
import { buildProfileAchievements } from "../../../lib/profile-achievements";
import { normalizeProfileCommentVisibility } from "../../../lib/profile-comments";

interface ProfilePageProps {
	params: {
		username: string;
	};
}

export default async function ProfilePage({ params }: ProfilePageProps) {
	const formatDuration = (durationMs: number) => {
		const totalSeconds = Math.floor(durationMs / 1000);
		const minutes = Math.floor(totalSeconds / 60);
		const seconds = totalSeconds % 60;
		return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
	};

	const { username } = await params;
	const session = await getServerSession(authOptions);

	// Fetch the target profile user
	const targetUserResult = await db
		.select()
		.from(users)
		.where(eq(users.username, username))
		.limit(1);

	const targetUser = targetUserResult[0];

	if (!targetUser) {
		notFound();
	}

	const sessionUser = session?.user as { id?: string } | undefined;
	const currentUserId = sessionUser?.id || null;
	const isOwnProfile = currentUserId === targetUser.id;

	// Default profile picture logic
	const profilePictureUrl = getUserAvatarUrl({
		profilePictureId: targetUser.profilePictureId,
		steamAvatarUrl: targetUser.steamAvatarUrl,
		useSteamAvatar: targetUser.useSteamAvatar,
		discordAvatarUrl: targetUser.discordAvatarUrl,
		useDiscordAvatar: targetUser.useDiscordAvatar,
	});
	const profileBannerUrl = getBannerImageById(targetUser.profileBannerId);
	const profileCommentVisibility = normalizeProfileCommentVisibility(
		targetUser.profileCommentVisibility
	);
	const favoriteCosmetic = targetUser.favoriteCosmeticId
		? getCosmeticById(targetUser.favoriteCosmeticId)
		: null;

	// Determine Friend Status if viewing someone else's profile
	let friendStatus: "none" | "pending_sent" | "pending_received" | "friends" = "none";
	let activeRequestId: string | null = null;

	if (currentUserId && !isOwnProfile) {
		const existingRequestResult = await db
			.select()
			.from(friendRequests)
			.where(
				or(
					and(
						eq(friendRequests.senderId, currentUserId),
						eq(friendRequests.receiverId, targetUser.id)
					),
					and(
						eq(friendRequests.senderId, targetUser.id),
						eq(friendRequests.receiverId, currentUserId)
					)
				)
			)
			.limit(1);

		const request = existingRequestResult[0];

		if (request) {
			activeRequestId = request.id;
			if (request.status === "accepted") {
				friendStatus = "friends";
			} else if (request.senderId === currentUserId) {
				friendStatus = "pending_sent";
			} else {
				friendStatus = "pending_received";
			}
		}
	}

	// Get Friends Count
	const friendsResult = await db
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
		);
	const friendsCount = friendsResult.length;

	// Get Unlocked Cosmetics Count
	const unlockedCosmeticsResult = await db
		.select({ id: userCosmetics.id, cosmeticId: userCosmetics.cosmeticId })
		.from(userCosmetics)
		.where(eq(userCosmetics.userId, targetUser.id));
	const unlockedCount = unlockedCosmeticsResult.length;

	const [lightsOutBestResult, sliderPuzzleBestResult] = await Promise.all([
		db
			.select({ durationMs: puzzleScores.durationMs, moves: puzzleScores.moves })
			.from(puzzleScores)
			.where(
				and(
					eq(puzzleScores.userId, targetUser.id),
					eq(puzzleScores.puzzleType, "lights-out")
				)
			)
			.orderBy(asc(puzzleScores.durationMs), asc(puzzleScores.moves))
			.limit(1),
		db
			.select({ durationMs: puzzleScores.durationMs, moves: puzzleScores.moves })
			.from(puzzleScores)
			.where(
				and(
					eq(puzzleScores.userId, targetUser.id),
					eq(puzzleScores.puzzleType, "slider-puzzle")
				)
			)
			.orderBy(asc(puzzleScores.durationMs), asc(puzzleScores.moves))
			.limit(1),
	]);

	const lightsOutBest = lightsOutBestResult[0] ?? null;
	const sliderPuzzleBest = sliderPuzzleBestResult[0] ?? null;

	const unlockedCosmeticIds = new Set(
		unlockedCosmeticsResult.map((row) => row.cosmeticId)
	);
	const totalCosmeticsCount = allCosmetics.length;
	const categoryEntries = Object.entries(categories);
	const completedCategoryCount = categoryEntries.filter(([, items]) =>
		items.every((item) => unlockedCosmeticIds.has(item.id))
	).length;
	const totalCategoryCount = categoryEntries.length;
	const { achievements, unlockedAchievementsCount } = buildProfileAchievements({
		unlockedCount,
		friendsCount,
		completedCategoryCount,
		totalCosmeticsCount,
		lightsOutBest,
		sliderPuzzleBest,
		favoriteCosmeticId: targetUser.favoriteCosmeticId,
		formatDuration,
	});

	const rawCommentHistory = await db
		.select({
			id: profileComments.id,
			content: profileComments.content,
			createdAt: profileComments.createdAt,
			profileUserId: profileComments.profileUserId,
		})
		.from(profileComments)
		.where(
			and(
				eq(profileComments.authorUserId, targetUser.id),
				eq(profileComments.isHidden, false)
			)
		)
		.orderBy(desc(profileComments.createdAt))
		.limit(5);

	const historyProfileIds = Array.from(
		new Set(rawCommentHistory.map((item) => item.profileUserId))
	);
	const historyProfiles = historyProfileIds.length
		? await db
				.select({ id: users.id, username: users.username })
				.from(users)
				.where(inArray(users.id, historyProfileIds))
		: [];
	const historyProfileMap = new Map(
		historyProfiles.map((item) => [item.id, item.username])
	);

	const commentHistory = rawCommentHistory.map((item) => ({
		id: item.id,
		content: item.content,
		createdAt: item.createdAt.toISOString(),
		profileUsername: historyProfileMap.get(item.profileUserId) || "Unknown",
	}));

	return (
		<main className="min-h-screen text-neutral-200 flex flex-col items-center py-5 sm:py-10 px-2 sm:px-5 relative z-10 selection:bg-cyan-400/20 selection:text-cyan-100">
			<div className="w-full max-w-7xl rounded-[2rem] border border-neutral-800/90 bg-neutral-950/80 backdrop-blur-xl shadow-[0_40px_120px_rgba(0,0,0,0.55)] overflow-hidden relative">
				<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_12%,rgba(16,185,129,0.12),transparent_36%),radial-gradient(circle_at_86%_16%,rgba(56,189,248,0.16),transparent_34%),radial-gradient(circle_at_50%_90%,rgba(168,85,247,0.14),transparent_38%)]" />

				<section className="relative min-h-[280px] sm:min-h-[340px] border-b border-neutral-800/80">
					<Image
						src={profileBannerUrl}
						alt={`${targetUser.username}'s banner`}
						fill
						className="object-cover object-center"
						sizes="(max-width: 640px) 100vw, 1280px"
					/>
					<div className="absolute inset-0 bg-linear-to-b from-black/15 via-black/40 to-neutral-950/95" />

					<div className="absolute left-4 top-4 sm:left-8 sm:top-8 z-20">
						<Link
							href="/dashboard"
							className="inline-flex items-center gap-2 rounded-full border border-neutral-600/90 bg-black/55 px-4 py-2 text-[11px] uppercase tracking-[0.16em] font-semibold text-neutral-200 hover:border-cyan-500/60 hover:text-cyan-100 transition-colors"
						>
							&larr; Back to Dashboard
						</Link>
					</div>

					<div className="absolute inset-x-4 bottom-4 sm:inset-x-8 sm:bottom-8 z-20">
						<div className="rounded-2xl border border-neutral-700/80 bg-neutral-950/70 backdrop-blur-xl px-4 py-4 sm:px-6 sm:py-5">
							<div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
								<div className="flex items-end gap-4 sm:gap-5">
									<div className="h-20 w-20 sm:h-28 sm:w-28 lg:h-32 lg:w-32 rounded-2xl overflow-hidden border border-neutral-600/80 ring-2 ring-neutral-950/80 shadow-[0_8px_28px_rgba(0,0,0,0.45)] relative shrink-0">
										<Image
											src={profilePictureUrl}
											alt={`${targetUser.username}'s avatar`}
											fill
											className="object-cover"
											sizes="(max-width: 640px) 80px, (max-width: 1024px) 112px, 128px"
										/>
									</div>
									<div className="pb-1">
										<div className="flex flex-wrap items-center gap-2 sm:gap-3">
											<h1 className="text-2xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-white">
												{targetUser.username}
											</h1>
											{targetUser.isAdministrator && (
												<span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.14em] border border-red-500/70 bg-red-950/70 text-red-100">
													Admin
												</span>
											)}
										</div>
										<p className="mt-1 text-xs sm:text-sm text-neutral-400 font-medium">
											Surviving the fog since {targetUser.createdAt.toLocaleDateString()}
										</p>
									</div>
								</div>
								<div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
									<div className="rounded-xl border border-neutral-700/80 bg-neutral-900/70 px-3 py-2 text-center">
										<p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-bold">
											Friends
										</p>
										<p className="text-lg font-black text-white">{friendsCount}</p>
									</div>
									<div className="rounded-xl border border-neutral-700/80 bg-neutral-900/70 px-3 py-2 text-center">
										<p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-bold">
											Unlocked
										</p>
										<p className="text-lg font-black text-emerald-400">{unlockedCount}</p>
									</div>
									<div className="rounded-xl border border-neutral-700/80 bg-neutral-900/70 px-3 py-2 text-center">
										<p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-bold">
											Categories
										</p>
										<p className="text-lg font-black text-cyan-300">
											{completedCategoryCount}/{totalCategoryCount}
										</p>
									</div>
									<div className="rounded-xl border border-neutral-700/80 bg-neutral-900/70 px-3 py-2 text-center">
										<p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-bold">
											Achievements
										</p>
										<p className="text-lg font-black text-amber-300">
											{unlockedAchievementsCount}/{achievements.length}
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				</section>

				<section className="relative z-10 p-4 sm:p-8 lg:p-10">
					<div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_350px] gap-6 lg:gap-8">
						<div className="space-y-6">
							<div className="rounded-2xl border border-neutral-800 bg-neutral-900/35 p-4 sm:p-6">
								<p className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em] mb-2">
									About
								</p>
								<p className="text-sm sm:text-[15px] text-neutral-200 leading-relaxed max-w-3xl">
									{targetUser.bio || "No survivor bio yet. Edit profile to add one."}
								</p>
							</div>

							<div className="rounded-2xl border border-neutral-800 bg-neutral-900/35 p-4 sm:p-6">
								<div className="flex items-center justify-between gap-3 mb-4">
									<h3 className="text-[11px] font-bold text-neutral-500 uppercase tracking-[0.2em] flex items-center gap-2">
										<FaShirt /> Collection
									</h3>
									<span className="text-[11px] font-bold text-emerald-400 uppercase tracking-[0.17em]">
										{unlockedCount} Unlocked
									</span>
								</div>

								<div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
									<Link
										href={`/profile/${targetUser.username}/missing`}
										className="rounded-xl border border-neutral-700 bg-neutral-900/65 px-4 py-3 hover:border-cyan-500/60 hover:bg-neutral-800/70 transition-colors group"
									>
										<p className="text-sm font-bold uppercase tracking-[0.13em] text-neutral-100">
											Missing Cosmetics
										</p>
										<p className="text-xs text-neutral-500 mt-1">
											View items yet to be discovered
										</p>
										<p className="text-xs text-cyan-300 mt-3 group-hover:translate-x-1 transition-transform">
											Open collection gap &rarr;
										</p>
									</Link>
									<div className="rounded-xl border border-neutral-700 bg-neutral-900/65 px-4 py-3">
										<p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500">
											Favorite Cosmetic
										</p>
										<p className="text-sm font-bold uppercase tracking-[0.12em] text-neutral-100 mt-2">
											{favoriteCosmetic?.name || "No favorite cosmetic selected"}
										</p>
									</div>
								</div>
							</div>

							<div className="rounded-2xl border border-neutral-800 bg-neutral-900/35 p-4 sm:p-6">
								<p className="text-[11px] font-bold text-neutral-500 uppercase tracking-[0.2em] mb-4">
									Puzzle Records
								</p>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
									<div className="rounded-xl border border-neutral-700 bg-neutral-900/65 px-4 py-3">
										<div className="flex items-center justify-between gap-3">
											<div className="flex items-center gap-2 text-neutral-100">
												<FaLightbulb className="text-amber-400" />
												<span className="text-xs font-bold uppercase tracking-[0.14em]">
													Lights Out
												</span>
											</div>
											<span className="text-xs text-neutral-300 font-semibold">
												{lightsOutBest
													? `${formatDuration(lightsOutBest.durationMs)} (${lightsOutBest.moves} moves)`
													: "No record"}
											</span>
										</div>
									</div>
									<div className="rounded-xl border border-neutral-700 bg-neutral-900/65 px-4 py-3">
										<div className="flex items-center justify-between gap-3">
											<div className="flex items-center gap-2 text-neutral-100">
												<FaPuzzlePiece className="text-sky-400" />
												<span className="text-xs font-bold uppercase tracking-[0.14em]">
													Slider Puzzle
												</span>
											</div>
											<span className="text-xs text-neutral-300 font-semibold">
												{sliderPuzzleBest
													? `${formatDuration(sliderPuzzleBest.durationMs)} (${sliderPuzzleBest.moves} moves)`
													: "No record"}
											</span>
										</div>
									</div>
								</div>
							</div>

							<ProfileAchievementsPanel
								achievements={achievements}
								unlockedAchievementsCount={unlockedAchievementsCount}
								completedCategoryCount={completedCategoryCount}
								totalCategoryCount={totalCategoryCount}
							/>
						</div>

						<aside className="space-y-6">
							<div className="rounded-2xl border border-neutral-800 bg-neutral-900/35 p-4 sm:p-5">
								<div className="space-y-3">
									<Link
										href={`/profile/${targetUser.username}/friends`}
										className="inline-flex items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-900/70 px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-neutral-200 hover:border-cyan-500/60 hover:text-cyan-200 transition-colors"
									>
										<FaUserGroup className="text-neutral-400" />
										View Friends
									</Link>
									<div className="flex flex-col gap-2.5">
										{isOwnProfile ? (
											<EditProfileButton
												initialData={{
													bio: targetUser.bio,
													discordUsername: targetUser.discordUsername,
													discordAvatarUrl: targetUser.discordAvatarUrl,
													useDiscordAvatar: targetUser.useDiscordAvatar,
													steamUsername: targetUser.steamUsername,
													steamAvatarUrl: targetUser.steamAvatarUrl,
													useSteamAvatar: targetUser.useSteamAvatar,
													steamProfileUrl: targetUser.steamProfileUrl,
													profileCommentVisibility,
													profilePictureId: targetUser.profilePictureId,
													profileBannerId: targetUser.profileBannerId,
													favoriteCosmeticId: targetUser.favoriteCosmeticId,
												}}
											/>
										) : currentUserId ? (
											<>
												<FriendActions
													targetUsername={targetUser.username}
													initialStatus={friendStatus}
													initialRequestId={activeRequestId}
												/>
												{friendStatus === "friends" && (
													<Link
														href={`/compare/${targetUser.username}`}
														className="w-full flex items-center justify-center px-4 py-2.5 rounded-lg border border-neutral-700 bg-neutral-900/70 text-neutral-100 text-xs font-bold uppercase tracking-[0.14em] hover:border-cyan-500/60 hover:text-cyan-200 transition-colors"
													>
														Compare Collections
													</Link>
												)}
											</>
										) : (
											<Link
												href="/login"
												className="w-full flex items-center justify-center px-4 py-2.5 rounded-lg border border-neutral-700 bg-neutral-900/60 text-neutral-300 text-xs font-bold uppercase tracking-[0.14em] hover:border-cyan-500/60 hover:text-cyan-200 transition-colors"
											>
												Login to Add Friend
											</Link>
										)}
									</div>
								</div>
							</div>

							<div className="rounded-2xl border border-neutral-800 bg-neutral-900/35 p-4 sm:p-5">
								<h3 className="text-[11px] font-bold text-neutral-500 uppercase tracking-[0.2em] mb-4">
									Connections
								</h3>
								<div className="space-y-3">
									{targetUser.steamProfileUrl ? (
										<a
											href={targetUser.steamProfileUrl}
											target="_blank"
											rel="noopener noreferrer"
											className="flex items-center gap-3 rounded-lg border border-neutral-700 bg-neutral-900/65 px-3 py-2 text-neutral-200 hover:border-blue-500/60 hover:text-white transition-colors"
										>
											<FaSteam className="text-lg text-neutral-400" />
											<span className="text-sm truncate">
												{targetUser.steamUsername || "Steam Profile"}
											</span>
										</a>
									) : (
										<div className="flex items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-900/40 px-3 py-2 text-neutral-500">
											<FaSteam className="text-lg opacity-60" />
											<span className="text-sm italic">Steam not connected</span>
										</div>
									)}
									{targetUser.discordUsername ? (
										<div className="flex items-center gap-3 rounded-lg border border-neutral-700 bg-neutral-900/65 px-3 py-2 text-neutral-200">
											<FaDiscord className="text-lg text-[#5865F2]" />
											<span className="text-sm select-all truncate">
												{targetUser.discordUsername}
											</span>
										</div>
									) : (
										<div className="flex items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-900/40 px-3 py-2 text-neutral-500">
											<FaDiscord className="text-lg opacity-60" />
											<span className="text-sm italic">Discord not connected</span>
										</div>
									)}
								</div>
							</div>
						</aside>
					</div>

					<ProfileCommentsSection
						profileUsername={targetUser.username}
						isOwnProfile={isOwnProfile}
						isLoggedIn={Boolean(currentUserId)}
						historyItems={commentHistory}
					/>
				</section>
			</div>
		</main>
	);
}
