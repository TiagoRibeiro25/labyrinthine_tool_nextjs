import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FaArrowLeft } from "react-icons/fa6";
import { db } from "../../db";
import { userCosmetics } from "../../db/schema";
import { eq } from "drizzle-orm";
import CosmeticsTracker from "../../components/CosmeticsTracker";

export default async function CosmeticsPage() {
    const session = await getServerSession(authOptions);
    const sessionUser = session?.user as { id?: string } | undefined;

    if (!session || !sessionUser || !sessionUser.id) {
        redirect("/login");
    }

    const currentUserId = sessionUser.id;

    // Fetch all cosmetics currently unlocked by the user
    const unlockedRecords = await db
        .select({
            cosmeticId: userCosmetics.cosmeticId,
        })
        .from(userCosmetics)
        .where(eq(userCosmetics.userId, currentUserId));

    const initialUnlockedIds = unlockedRecords.map(
        (record) => record.cosmeticId,
    );

    return (
        <main className="min-h-screen text-neutral-200 flex flex-col items-center py-12 px-4 sm:px-6 relative z-10 selection:bg-neutral-800/50 selection:text-neutral-200">
            <div className="w-full max-w-6xl flex flex-col items-center text-center mb-10">
                <h1 className="text-4xl sm:text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-linear-to-b from-neutral-100 to-neutral-500 uppercase mb-4">
                    The Wardrobe
                </h1>
                <p className="text-sm sm:text-base text-neutral-400 font-medium tracking-wide mb-8 max-w-2xl">
                    Keep track of your hard-earned items from the fog. Click on
                    a cosmetic to toggle its locked or unlocked status.
                </p>
                <Link
                    href="/dashboard"
                    className="group inline-flex items-center justify-center gap-3 px-6 py-3 rounded-sm bg-neutral-900/50 text-neutral-400 font-bold text-xs uppercase tracking-widest border border-neutral-800 hover:bg-neutral-800 hover:text-neutral-200 hover:border-neutral-500 transition-all duration-300"
                >
                    <FaArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                    Return to Safehouse
                </Link>
            </div>

            {/* Pass the IDs securely fetched from the server to the client component */}
            <CosmeticsTracker initialUnlockedIds={initialUnlockedIds} />
        </main>
    );
}
