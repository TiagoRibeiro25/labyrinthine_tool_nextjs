import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
    FaMagnifyingGlass,
    FaArrowLeft,
    FaUserGroup,
    FaShirt,
    FaUser,
    FaTrophy,
} from "react-icons/fa6";
import LogoutButton from "../../components/LogoutButton";
import { db } from "../../db";
import { users, friendRequests, userCosmetics } from "../../db/schema";
import { eq, and, or } from "drizzle-orm";

export default async function DashboardPage() {
    const session = await getServerSession(authOptions);

    const sessionUser = session?.user as
        | { id?: string; name?: string | null }
        | undefined;

    if (!session || !sessionUser || !sessionUser.id) {
        redirect("/login");
    }

    const currentUserId = sessionUser.id;
    const targetUserResult = await db
        .select()
        .from(users)
        .where(eq(users.id, currentUserId))
        .limit(1);

    const targetUser = targetUserResult[0];

    if (!targetUser) {
        redirect("/login");
    }

    // Get stats
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

    const unlockedCosmeticsResult = await db
        .select({ id: userCosmetics.id })
        .from(userCosmetics)
        .where(eq(userCosmetics.userId, targetUser.id));
    const unlockedCount = unlockedCosmeticsResult.length;

    return (
        <main className="min-h-screen text-neutral-200 flex flex-col items-center justify-center py-12 px-4 sm:px-6 relative z-10 selection:bg-neutral-800/50 selection:text-neutral-200">
            <div className="w-full max-w-5xl bg-black/80 backdrop-blur-md border border-neutral-800 border-t-4 border-t-neutral-600 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative p-6 sm:p-10 flex flex-col items-center">
                <div className="text-center mb-10 border-b border-neutral-800/80 pb-8 w-full">
                    <h1 className="text-4xl sm:text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-linear-to-b from-neutral-100 to-neutral-700 drop-shadow-[0_5px_5px_rgba(0,0,0,1)] mb-4 uppercase">
                        The Safehouse
                    </h1>
                    <h2 className="text-lg sm:text-xl font-bold tracking-widest text-emerald-500 uppercase flex items-center justify-center gap-3">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                        </span>
                        Welcome back, {targetUser.username}
                    </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12 w-full max-w-4xl">
                    {/* Wardrobe Card */}
                    <Link
                        href="/cosmetics"
                        className="group relative flex flex-col items-center sm:items-start p-6 bg-neutral-900/40 border border-neutral-800 rounded-sm hover:bg-neutral-900 hover:border-neutral-600 transition-all duration-300"
                    >
                        <div className="w-12 h-12 rounded-full bg-black/50 border border-neutral-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(255,255,255,0.05)]">
                            <FaShirt className="w-5 h-5 text-neutral-400 group-hover:text-emerald-400 transition-colors" />
                        </div>
                        <h3 className="text-xl font-black uppercase tracking-widest text-neutral-200 mb-1 group-hover:text-white transition-colors">
                            The Wardrobe
                        </h3>
                        <p className="text-sm text-neutral-500 font-medium mb-4 text-center sm:text-left">
                            Manage your collection and track your cosmetic
                            items.
                        </p>
                        <div className="mt-auto flex items-center gap-2 px-3 py-1.5 bg-black/60 border border-neutral-800 rounded-sm w-fit">
                            <span className="text-lg font-black text-emerald-500 leading-none">
                                {unlockedCount}
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                                Unlocked
                            </span>
                        </div>
                    </Link>

                    {/* Connections Card */}
                    <Link
                        href="/friends"
                        className="group relative flex flex-col items-center sm:items-start p-6 bg-neutral-900/40 border border-neutral-800 rounded-sm hover:bg-neutral-900 hover:border-neutral-600 transition-all duration-300"
                    >
                        <div className="w-12 h-12 rounded-full bg-black/50 border border-neutral-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(255,255,255,0.05)]">
                            <FaUserGroup className="w-5 h-5 text-neutral-400 group-hover:text-blue-400 transition-colors" />
                        </div>
                        <h3 className="text-xl font-black uppercase tracking-widest text-neutral-200 mb-1 group-hover:text-white transition-colors">
                            Connections
                        </h3>
                        <p className="text-sm text-neutral-500 font-medium mb-4 text-center sm:text-left">
                            Manage your fellow survivors and friend requests.
                        </p>
                        <div className="mt-auto flex items-center gap-2 px-3 py-1.5 bg-black/60 border border-neutral-800 rounded-sm w-fit">
                            <span className="text-lg font-black text-blue-500 leading-none">
                                {friendsCount}
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                                Friends
                            </span>
                        </div>
                    </Link>

                    {/* Public Profile Card */}
                    <Link
                        href={`/profile/${targetUser.username}`}
                        className="group relative flex flex-col items-center sm:items-start p-6 bg-neutral-900/40 border border-neutral-800 rounded-sm hover:bg-neutral-900 hover:border-neutral-600 transition-all duration-300"
                    >
                        <div className="w-12 h-12 rounded-full bg-black/50 border border-neutral-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(255,255,255,0.05)]">
                            <FaUser className="w-5 h-5 text-neutral-400 group-hover:text-purple-400 transition-colors" />
                        </div>
                        <h3 className="text-xl font-black uppercase tracking-widest text-neutral-200 mb-1 group-hover:text-white transition-colors">
                            Public Profile
                        </h3>
                        <p className="text-sm text-neutral-500 font-medium text-center sm:text-left">
                            View and edit your public profile, connections, and
                            missing items.
                        </p>
                    </Link>

                    {/* Find Survivors Card */}
                    <Link
                        href="/search"
                        className="group relative flex flex-col items-center sm:items-start p-6 bg-neutral-900/40 border border-neutral-800 rounded-sm hover:bg-neutral-900 hover:border-neutral-600 transition-all duration-300"
                    >
                        <div className="w-12 h-12 rounded-full bg-black/50 border border-neutral-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(255,255,255,0.05)]">
                            <FaMagnifyingGlass className="w-5 h-5 text-neutral-400 group-hover:text-amber-400 transition-colors" />
                        </div>
                        <h3 className="text-xl font-black uppercase tracking-widest text-neutral-200 mb-1 group-hover:text-white transition-colors">
                            Find Survivors
                        </h3>
                        <p className="text-sm text-neutral-500 font-medium text-center sm:text-left">
                            Search the fog for other players and view their
                            collections.
                        </p>
                    </Link>

                    {/* Missing Cosmetics Card */}
                    <Link
                        href="/missing-cosmetics"
                        className="group relative flex flex-col items-center sm:items-start p-6 bg-neutral-900/40 border border-neutral-800 rounded-sm hover:bg-neutral-900 hover:border-neutral-600 transition-all duration-300"
                    >
                        <div className="w-12 h-12 rounded-full bg-black/50 border border-neutral-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(255,255,255,0.05)]">
                            <FaShirt className="w-5 h-5 text-neutral-400 group-hover:text-emerald-400 transition-colors" />
                        </div>
                        <h3 className="text-xl font-black uppercase tracking-widest text-neutral-200 mb-1 group-hover:text-white transition-colors">
                            Missing Cosmetics
                        </h3>
                        <p className="text-sm text-neutral-500 font-medium text-center sm:text-left">
                            Search for a cosmetic and see which of your friends
                            don&apos;t have it.
                        </p>
                    </Link>

                    {/* Leaderboard Card */}
                    <Link
                        href="/leaderboard"
                        className="group relative flex flex-col items-center sm:items-start p-6 bg-neutral-900/40 border border-neutral-800 rounded-sm hover:bg-neutral-900 hover:border-neutral-600 transition-all duration-300"
                    >
                        <div className="w-12 h-12 rounded-full bg-black/50 border border-neutral-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(255,255,255,0.05)]">
                            <FaTrophy className="w-5 h-5 text-neutral-400 group-hover:text-yellow-400 transition-colors" />
                        </div>
                        <h3 className="text-xl font-black uppercase tracking-widest text-neutral-200 mb-1 group-hover:text-white transition-colors">
                            Top Collectors
                        </h3>
                        <p className="text-sm text-neutral-500 font-medium text-center sm:text-left">
                            See who has the largest cosmetic collection in the
                            leaderboard.
                        </p>
                    </Link>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link
                        href="/"
                        className="group inline-flex items-center justify-center gap-3 px-8 py-4 rounded-sm bg-neutral-900 text-neutral-100 font-bold text-base uppercase tracking-widest border border-neutral-700 hover:bg-neutral-800 hover:border-neutral-400 transition-all duration-300 shadow-[0_0_15px_rgba(255,255,255,0.05)] hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:-translate-y-1 active:translate-y-0 w-full sm:w-auto"
                    >
                        <FaArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        Return to Home
                    </Link>
                    <LogoutButton />
                </div>
            </div>
        </main>
    );
}
