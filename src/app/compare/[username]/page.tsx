import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { FaArrowLeft } from "react-icons/fa6";
import { and, eq, or } from "drizzle-orm";
import { authOptions } from "../../../lib/auth";
import { db } from "../../../db";
import { friendRequests, userCosmetics, users } from "../../../db/schema";
import CollectionComparison from "../../../components/CollectionComparison";
import { allCosmetics, categories, type CosmeticItem } from "../../../lib/cosmetics";

interface ComparePageProps {
    params: {
        username: string;
    };
}

function groupByCategory(items: CosmeticItem[]): Record<string, CosmeticItem[]> {
    const idSet = new Set(items.map((item) => item.id));
    const grouped: Record<string, CosmeticItem[]> = {};

    for (const [categoryName, categoryItems] of Object.entries(categories)) {
        const filtered = categoryItems.filter((item) => idSet.has(item.id));
        if (filtered.length > 0) {
            grouped[categoryName] = filtered;
        }
    }

    return grouped;
}

export default async function ComparePage({ params }: ComparePageProps) {
    const { username } = await params;

    const session = await getServerSession(authOptions);
    const sessionUser = session?.user as
        | { id?: string; name?: string | null }
        | undefined;

    if (!session || !sessionUser?.id) {
        redirect(`/login?callbackUrl=${encodeURIComponent(`/compare/${username}`)}`);
    }

    const currentUserId = sessionUser.id;

    const [currentUserResult, targetUserResult] = await Promise.all([
        db.select().from(users).where(eq(users.id, currentUserId)).limit(1),
        db.select().from(users).where(eq(users.username, username)).limit(1),
    ]);

    const currentUser = currentUserResult[0];
    const targetUser = targetUserResult[0];

    if (!currentUser || !targetUser) {
        notFound();
    }

    const isOwnProfile = currentUser.id === targetUser.id;

    if (!isOwnProfile) {
        const friendshipResult = await db
            .select({ id: friendRequests.id })
            .from(friendRequests)
            .where(
                and(
                    eq(friendRequests.status, "accepted"),
                    or(
                        and(
                            eq(friendRequests.senderId, currentUser.id),
                            eq(friendRequests.receiverId, targetUser.id),
                        ),
                        and(
                            eq(friendRequests.senderId, targetUser.id),
                            eq(friendRequests.receiverId, currentUser.id),
                        ),
                    ),
                ),
            )
            .limit(1);

        const friendship = friendshipResult[0];

        if (!friendship) {
            redirect(`/profile/${targetUser.username}`);
        }
    }

    const [currentUnlockedRows, targetUnlockedRows] = await Promise.all([
        db
            .select({ cosmeticId: userCosmetics.cosmeticId })
            .from(userCosmetics)
            .where(eq(userCosmetics.userId, currentUser.id)),
        db
            .select({ cosmeticId: userCosmetics.cosmeticId })
            .from(userCosmetics)
            .where(eq(userCosmetics.userId, targetUser.id)),
    ]);

    const currentUnlockedSet = new Set(
        currentUnlockedRows.map((row) => row.cosmeticId),
    );
    const targetUnlockedSet = new Set(targetUnlockedRows.map((row) => row.cosmeticId));

    const onlyYou = allCosmetics.filter(
        (item) => currentUnlockedSet.has(item.id) && !targetUnlockedSet.has(item.id),
    );

    const onlyThem = allCosmetics.filter(
        (item) => targetUnlockedSet.has(item.id) && !currentUnlockedSet.has(item.id),
    );

    const bothMissing = allCosmetics.filter(
        (item) => !currentUnlockedSet.has(item.id) && !targetUnlockedSet.has(item.id),
    );

    const onlyYouByCategory = groupByCategory(onlyYou);
    const onlyThemByCategory = groupByCategory(onlyThem);
    const bothMissingByCategory = groupByCategory(bothMissing);

    return (
        <main className="min-h-screen text-neutral-200 flex flex-col items-center py-12 px-4 sm:px-6 relative z-10 selection:bg-neutral-800/50 selection:text-neutral-200">
            <div className="w-full max-w-6xl mb-8 flex justify-start">
                <Link
                    href={`/profile/${targetUser.username}`}
                    className="group inline-flex items-center gap-2 px-4 py-2 rounded-sm bg-neutral-900 text-neutral-400 font-bold text-xs uppercase tracking-widest border border-neutral-800 hover:bg-neutral-800 hover:text-neutral-100 hover:border-neutral-500 transition-all duration-300"
                >
                    <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
                    Back to Profile
                </Link>
            </div>

            <div className="w-full max-w-6xl mb-8 text-center">
                <h1 className="text-3xl sm:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-linear-to-b from-neutral-100 to-neutral-500 uppercase mb-3">
                    Collection Comparison
                </h1>
                <p className="text-sm sm:text-base text-neutral-400 font-medium tracking-wide max-w-3xl mx-auto">
                    Compare your wardrobe with{" "}
                    <span className="text-neutral-200 font-bold">
                        {targetUser.username}
                    </span>
                    . Find cosmetics that only one of you has and discover which
                    items you&apos;re both still missing.
                </p>
            </div>

            <CollectionComparison
                currentUsername={currentUser.username}
                targetUsername={targetUser.username}
                onlyYouByCategory={onlyYouByCategory}
                onlyThemByCategory={onlyThemByCategory}
                bothMissingByCategory={bothMissingByCategory}
            />
        </main>
    );
}
