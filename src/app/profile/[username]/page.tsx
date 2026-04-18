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
	const historyProfileMap = new Map(historyProfiles.map((item) => [item.id, item.username]));

	const commentHistory = rawCommentHistory.map((item) => ({
		id: item.id,
		content: item.content,
		createdAt: item.createdAt.toISOString(),
		profileUsername: historyProfileMap.get(item.profileUserId) || "Unknown",
	}));

	return (
		<main className="min-h-screen text-neutral-200 flex flex-col items-center py-8 sm:py-12 px-4 sm:px-6 relative z-10 selection:bg-neutral-800/50 selection:text-neutral-200">
			<div className="w-full max-w-5xl rounded-3xl bg-[linear-gradient(145deg,rgba(9,11,13,0.95),rgba(18,23,29,0.9))] backdrop-blur-md border border-neutral-800/80 shadow-[0_24px_80px_rgba(0,0,0,0.45)] relative overflow-hidden flex flex-col">
				{/* --- HEADER BANNER --- */}
				<div className="h-36 sm:h-56 border-b border-neutral-800 relative overflow-hidden bg-neutral-950">
					<Image
						src={profileBannerUrl}
						alt={`${targetUser.username}'s banner`}
						fill
						className="object-cover object-center"
						sizes="(max-width: 640px) 100vw, 1024px"
					/>
					<div className="absolute inset-0 bg-linear-to-b from-black/20 via-black/35 to-black/85" />
				</div>

				{/* --- PROFILE CONTENT --- */}
				<div className="px-6 sm:px-10 pb-10 -mt-16 sm:-mt-20 relative z-10 flex flex-col sm:flex-row gap-8">
					{/* Left Column: Avatar & Actions */}
					<div className="flex flex-col items-center sm:items-start shrink-0">
						{/* Avatar */}
						<div className="w-32 h-32 sm:w-40 sm:h-40 border-4 border-black shadow-2xl bg-neutral-900 overflow-hidden rounded-sm relative">
							<Image
								src={profilePictureUrl}
								alt={`${targetUser.username}'s Avatar`}
								fill
								className="object-cover"
								sizes="(max-width: 640px) 128px, 160px"
							/>
						</div>

						{/* Actions */}
						<div className="w-full mt-6 flex flex-col gap-3">
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
											className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-sm bg-neutral-900/50 text-neutral-300 font-bold text-xs uppercase tracking-widest border border-neutral-700 hover:bg-neutral-800 hover:text-white hover:border-neutral-500 transition-all duration-300"
										>
											Compare Collections
										</Link>
									)}
								</>
							) : (
								<Link
									href="/login"
									className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-sm bg-neutral-900/50 text-neutral-400 font-bold text-xs uppercase tracking-widest border border-neutral-800 hover:bg-neutral-800 hover:text-neutral-200 transition-all duration-300"
								>
									Login to Add Friend
								</Link>
							)}
						</div>
					</div>

					{/* Right Column: Info & Stats */}
					<div className="flex-1 pt-2 sm:pt-20 flex flex-col text-center sm:text-left">
						{/* Username & Badges */}
						<div className="flex flex-col sm:flex-row items-center sm:items-end gap-3 mb-6">
							<h1 className="text-3xl sm:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-linear-to-b from-neutral-100 to-neutral-400 uppercase leading-none">
								{targetUser.username}
							</h1>
							{targetUser.isAdministrator && (
								<span className="px-3 py-1 bg-red-900 text-red-100 text-[10px] font-black uppercase tracking-widest border border-red-500 rounded-sm mb-1 shadow-[0_0_10px_rgba(220,38,38,0.3)]">
									Admin
								</span>
							)}
						</div>

						{/* Bio / Member Since */}
						<div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-8 mb-8">
							<div className="space-y-2">
								<p className="text-sm text-neutral-500 font-medium tracking-wide">
									Surviving the fog since {targetUser.createdAt.toLocaleDateString()}
								</p>
								<p className="max-w-2xl text-sm text-neutral-300 font-medium leading-relaxed">
									{targetUser.bio || "No survivor bio yet. Edit profile to add one."}
								</p>
							</div>
							<Link
								href={`/profile/${targetUser.username}/friends`}
								className="flex items-center gap-2 text-sm text-neutral-400 font-bold tracking-widest uppercase bg-neutral-900/50 px-3 py-1 rounded-sm border border-neutral-800 hover:bg-neutral-800/60 hover:border-neutral-500 transition-all duration-300"
							>
								<FaUserGroup className="text-neutral-500" />
								{friendsCount} {friendsCount === 1 ? "Friend" : "Friends"}
							</Link>
						</div>

						{/* Social Links Panel */}
						<div className="bg-black/50 border border-neutral-800 p-5 rounded-sm">
							<h3 className="text-xs font-bold text-neutral-600 uppercase tracking-widest mb-4 border-b border-neutral-800/50 pb-2">
								Connections
							</h3>
							<div className="space-y-3">
								{/* Steam Link */}
								{targetUser.steamProfileUrl ? (
									<a
										href={targetUser.steamProfileUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="flex items-center gap-3 text-neutral-300 hover:text-white transition-colors group w-fit"
									>
										<FaSteam className="text-xl text-neutral-500 group-hover:text-blue-400 transition-colors" />
										<span className="text-sm font-medium tracking-wide truncate">
											{targetUser.steamUsername || "Steam Profile"}
										</span>
									</a>
								) : (
									<div className="flex items-center gap-3 text-neutral-600">
										<FaSteam className="text-xl opacity-50" />
										<span className="text-sm font-medium tracking-wide italic">
											Not connected
										</span>
									</div>
								)}

								{/* Discord Username */}
								{targetUser.discordUsername ? (
									<div className="flex items-center gap-3 text-neutral-300">
										<FaDiscord className="text-xl text-[#5865F2]" />
										<span className="text-sm font-medium tracking-wide select-all">
											{targetUser.discordUsername}
										</span>
									</div>
								) : (
									<div className="flex items-center gap-3 text-neutral-600">
										<FaDiscord className="text-xl opacity-50" />
										<span className="text-sm font-medium tracking-wide italic">
											Not connected
										</span>
									</div>
								)}
							</div>
						</div>

						{/* Cosmetics Preview Panel */}
						<div className="mt-8 bg-black/50 border border-neutral-800 p-5 rounded-sm">
							<div className="flex justify-between items-end border-b border-neutral-800/50 pb-2 mb-4">
								<h3 className="text-xs font-bold text-neutral-600 uppercase tracking-widest flex items-center gap-2">
									<FaShirt /> Collection
								</h3>
								<span className="text-xs font-bold text-emerald-500 tracking-widest">
									{unlockedCount} Unlocked
								</span>
							</div>

							<Link
								href={`/profile/${targetUser.username}/missing`}
								className="w-full flex items-center justify-between p-4 bg-neutral-900/30 border border-neutral-800 rounded-sm hover:bg-neutral-800/60 hover:border-neutral-500 transition-all duration-300 group"
							>
								<div className="flex flex-col text-left">
									<span className="text-sm font-bold text-neutral-200 uppercase tracking-widest group-hover:text-white transition-colors">
										Missing Cosmetics
									</span>
									<span className="text-xs text-neutral-500 font-medium italic mt-1">
										View items yet to be discovered
									</span>
								</div>
								<span className="text-neutral-600 group-hover:translate-x-1 group-hover:text-neutral-400 transition-all">
									&rarr;
								</span>
							</Link>

							<div className="mt-4 p-4 bg-neutral-900/30 border border-neutral-800 rounded-sm">
								<p className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest mb-2">
									Favorite Cosmetic
								</p>
								<p className="text-sm font-bold text-neutral-200 uppercase tracking-wide">
									{favoriteCosmetic?.name || "No favorite cosmetic selected"}
								</p>
							</div>

							<div className="mt-4 p-4 bg-neutral-900/30 border border-neutral-800 rounded-sm">
								<p className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest mb-3">
									Puzzle Records
								</p>
								<div className="space-y-3">
									<div className="flex items-center justify-between gap-3">
										<div className="flex items-center gap-2 text-neutral-300">
											<FaLightbulb className="text-amber-400" />
											<span className="text-xs font-bold uppercase tracking-widest">
												Lights Out
											</span>
										</div>
										<span className="text-xs font-bold text-neutral-200 uppercase tracking-widest">
											{lightsOutBest
												? `${formatDuration(lightsOutBest.durationMs)} (${lightsOutBest.moves} moves)`
												: "No record"}
										</span>
									</div>
									<div className="flex items-center justify-between gap-3">
										<div className="flex items-center gap-2 text-neutral-300">
											<FaPuzzlePiece className="text-sky-400" />
											<span className="text-xs font-bold uppercase tracking-widest">
												Slider Puzzle
											</span>
										</div>
										<span className="text-xs font-bold text-neutral-200 uppercase tracking-widest">
											{sliderPuzzleBest
												? `${formatDuration(sliderPuzzleBest.durationMs)} (${sliderPuzzleBest.moves} moves)`
												: "No record"}
										</span>
									</div>
								</div>
							</div>

							<ProfileAchievementsPanel
								achievements={achievements}
								unlockedAchievementsCount={unlockedAchievementsCount}
								completedCategoryCount={completedCategoryCount}
								totalCategoryCount={totalCategoryCount}
							/>

							<ProfileCommentsSection
								profileUsername={targetUser.username}
								isOwnProfile={isOwnProfile}
								isLoggedIn={Boolean(currentUserId)}
								historyItems={commentHistory}
							/>
						</div>
					</div>
				</div>
			</div>

			<Link
				href="/dashboard"
				className="mt-8 inline-flex items-center gap-2 rounded-full border border-neutral-700 bg-black/35 px-4 py-2 text-[11px] uppercase tracking-[0.16em] font-semibold text-neutral-300 hover:border-neutral-500 hover:text-neutral-100 transition-colors"
			>
				&larr; Back to Dashboard
			</Link>
		</main>
	);
}
