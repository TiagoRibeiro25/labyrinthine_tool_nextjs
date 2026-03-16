import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { FaArrowLeft, FaLock } from "react-icons/fa6";
import { db } from "../../../../db";
import { users, userCosmetics } from "../../../../db/schema";
import { eq } from "drizzle-orm";
import { categories } from "../../../../lib/cosmetics";

interface MissingCosmeticsPageProps {
    params: {
        username: string;
    };
}

export default async function MissingCosmeticsPage({ params }: MissingCosmeticsPageProps) {
    const { username } = await params;

    // Fetch the target user
    const targetUserResult = await db
        .select()
        .from(users)
        .where(eq(users.username, username))
        .limit(1);

    const targetUser = targetUserResult[0];

    if (!targetUser) {
        notFound();
    }

    // Fetch the user's unlocked cosmetics
    const unlockedRecords = await db
        .select({
            cosmeticId: userCosmetics.cosmeticId,
        })
        .from(userCosmetics)
        .where(eq(userCosmetics.userId, targetUser.id));

    const unlockedIds = new Set(unlockedRecords.map((record) => record.cosmeticId));

    // Calculate missing cosmetics by category
    const missingByCategory: Record<string, typeof categories[string]> = {};
    let totalMissing = 0;

    for (const [categoryName, items] of Object.entries(categories)) {
        const missingItems = items.filter((item) => !unlockedIds.has(item.id));
        if (missingItems.length > 0) {
            missingByCategory[categoryName] = missingItems;
            totalMissing += missingItems.length;
        }
    }

    return (
        <main className="min-h-screen text-neutral-200 flex flex-col items-center py-12 px-4 sm:px-6 relative z-10 selection:bg-neutral-800/50 selection:text-neutral-200">
            <div className="w-full max-w-6xl flex flex-col items-center text-center mb-10">
                <h1 className="text-3xl sm:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-linear-to-b from-neutral-100 to-neutral-500 uppercase mb-4">
                    Missing Cosmetics
                </h1>
                <p className="text-sm sm:text-base text-neutral-400 font-medium tracking-wide mb-8 max-w-2xl">
                    Items that <span className="text-neutral-200 font-bold">{targetUser.username}</span> has yet to discover in the fog.
                </p>
                <Link
                    href={`/profile/${targetUser.username}`}
                    className="group inline-flex items-center justify-center gap-3 px-6 py-3 rounded-sm bg-neutral-900/50 text-neutral-400 font-bold text-xs uppercase tracking-widest border border-neutral-800 hover:bg-neutral-800 hover:text-neutral-200 hover:border-neutral-500 transition-all duration-300"
                >
                    <FaArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                    Back to Profile
                </Link>
            </div>

            <div className="w-full max-w-6xl flex flex-col items-center">
                {/* Statistics */}
                <div className="w-full mb-8 flex justify-end">
                    <div className="px-4 py-2 bg-neutral-900/80 border border-neutral-700 rounded-sm inline-flex items-center gap-3 shadow-md">
                        <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
                            Total Missing
                        </span>
                        <span className="text-lg font-black text-red-500">
                            {totalMissing}
                        </span>
                    </div>
                </div>

                {totalMissing === 0 ? (
                    <div className="w-full text-center py-20 border border-dashed border-neutral-800 rounded-sm bg-neutral-950/30">
                        <p className="text-emerald-500 font-bold tracking-widest uppercase mb-2">
                            Collection Complete!
                        </p>
                        <p className="text-neutral-500 font-medium italic">
                            This survivor has braved the fog and collected every item.
                        </p>
                    </div>
                ) : (
                    <div className="w-full space-y-16">
                        {Object.entries(missingByCategory).map(([categoryName, items]) => (
                            <section key={categoryName} className="w-full">
                                <div className="flex items-end justify-between border-b border-neutral-800/80 pb-3 mb-6">
                                    <h2 className="text-2xl sm:text-3xl font-black tracking-tighter text-transparent bg-clip-text bg-linear-to-b from-neutral-200 to-neutral-600 uppercase">
                                        {categoryName}
                                    </h2>
                                    <span className="text-sm font-bold text-neutral-500 tracking-widest">
                                        {items.length} Missing
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                                    {items.map((item) => (
                                        <div
                                            key={item.id}
                                            className="group relative flex flex-col items-center bg-black border border-neutral-800 rounded-sm overflow-hidden transition-all duration-300 hover:border-neutral-500 hover:-translate-y-1 cursor-default"
                                        >
                                            {/* Top Status Banner */}
                                            <div className="absolute top-0 inset-x-0 h-1 z-20 transition-colors bg-red-900/50 group-hover:bg-red-800" />

                                            {/* Icon Indicator */}
                                            <div className="absolute top-2 right-2 z-20 p-1.5 rounded-sm backdrop-blur-md border bg-black/60 border-neutral-800 text-neutral-500 transition-colors group-hover:border-neutral-600">
                                                <FaLock className="w-3 h-3" />
                                            </div>

                                            {/* Image Container */}
                                            <div className="relative w-full aspect-square bg-neutral-950/50 flex items-center justify-center p-4">
                                                <div className="relative w-full h-full transition-all duration-500 grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100">
                                                    <Image
                                                        src={`/images/cosmetics/${item.id}.png`}
                                                        alt={item.name}
                                                        fill
                                                        className="object-contain"
                                                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                                                    />
                                                </div>
                                            </div>

                                            {/* Title Footer */}
                                            <div className="w-full p-3 bg-neutral-900/80 border-t border-neutral-800/80 mt-auto transition-colors group-hover:bg-neutral-800/80">
                                                <p className="text-center text-[10px] sm:text-xs font-bold uppercase tracking-widest leading-tight text-neutral-500 group-hover:text-neutral-300">
                                                    {item.name}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
