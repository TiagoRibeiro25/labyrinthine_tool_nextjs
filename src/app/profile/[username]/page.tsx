import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import Image from "next/image";
import Link from "next/link";
import { FaSteam, FaDiscord, FaUserGroup, FaShirt } from "react-icons/fa6";
import { authOptions } from "../../../lib/auth";
import { db } from "../../../db";
import { users, friendRequests, userCosmetics } from "../../../db/schema";
import { eq, or, and } from "drizzle-orm";
import FriendActions from "../../../components/FriendActions";
import EditProfileButton from "../../../components/EditProfileButton";

interface ProfilePageProps {
    params: {
        username: string;
    };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
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
    const profilePictureUrl = targetUser.profilePictureId
        ? `/images/profile_pictures/${targetUser.profilePictureId}.webp`
        : `/images/profile_pictures/1.webp`;

    // Determine Friend Status if viewing someone else's profile
    let friendStatus: "none" | "pending_sent" | "pending_received" | "friends" =
        "none";
    let activeRequestId: string | null = null;

    if (currentUserId && !isOwnProfile) {
        const existingRequestResult = await db
            .select()
            .from(friendRequests)
            .where(
                or(
                    and(
                        eq(friendRequests.senderId, currentUserId),
                        eq(friendRequests.receiverId, targetUser.id),
                    ),
                    and(
                        eq(friendRequests.senderId, targetUser.id),
                        eq(friendRequests.receiverId, currentUserId),
                    ),
                ),
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
                    eq(friendRequests.receiverId, targetUser.id),
                ),
                eq(friendRequests.status, "accepted"),
            ),
        );
    const friendsCount = friendsResult.length;

    // Get Unlocked Cosmetics Count
    const unlockedCosmeticsResult = await db
        .select({ id: userCosmetics.id })
        .from(userCosmetics)
        .where(eq(userCosmetics.userId, targetUser.id));
    const unlockedCount = unlockedCosmeticsResult.length;

    return (
        <main className="min-h-screen text-neutral-200 flex flex-col items-center py-12 px-4 sm:px-6 relative z-10 selection:bg-neutral-800/50 selection:text-neutral-200">
            <div className="w-full max-w-4xl bg-black/80 backdrop-blur-md border border-neutral-800 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden flex flex-col">
                {/* --- HEADER BANNER --- */}
                <div className="h-32 sm:h-48 bg-neutral-900 border-b border-neutral-800 relative">
                    <div className="absolute inset-0 bg-linear-to-b from-transparent to-black/80" />
                    {/* Optional: Add a specific banner image here if needed in the future */}
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
                                        discordUsername:
                                            targetUser.discordUsername,
                                        steamProfileUrl:
                                            targetUser.steamProfileUrl,
                                        profilePictureId:
                                            targetUser.profilePictureId,
                                    }}
                                />
                            ) : currentUserId ? (
                                <FriendActions
                                    targetUsername={targetUser.username}
                                    initialStatus={friendStatus}
                                    initialRequestId={activeRequestId}
                                />
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
                            <p className="text-sm text-neutral-500 font-medium tracking-wide">
                                Surviving the fog since{" "}
                                {targetUser.createdAt.toLocaleDateString()}
                            </p>
                            {isOwnProfile ? (
                                <Link
                                    href="/friends"
                                    className="flex items-center gap-2 text-sm text-neutral-400 font-bold tracking-widest uppercase bg-neutral-900/50 px-3 py-1 rounded-sm border border-neutral-800 hover:bg-neutral-800/60 hover:border-neutral-500 transition-all duration-300"
                                >
                                    <FaUserGroup className="text-neutral-500" />
                                    {friendsCount}{" "}
                                    {friendsCount === 1 ? "Friend" : "Friends"}
                                </Link>
                            ) : (
                                <div className="flex items-center gap-2 text-sm text-neutral-400 font-bold tracking-widest uppercase bg-neutral-900/50 px-3 py-1 rounded-sm border border-neutral-800">
                                    <FaUserGroup className="text-neutral-500" />
                                    {friendsCount}{" "}
                                    {friendsCount === 1 ? "Friend" : "Friends"}
                                </div>
                            )}
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
                                            Steam Profile
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
                        </div>
                    </div>
                </div>
            </div>

            <Link
                href="/dashboard"
                className="mt-8 text-xs text-neutral-500 font-bold uppercase tracking-widest hover:text-neutral-300 transition-colors flex items-center gap-2"
            >
                &larr; Back to Dashboard
            </Link>
        </main>
    );
}
