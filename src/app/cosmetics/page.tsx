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

	const initialUnlockedIds = unlockedRecords.map((record) => record.cosmeticId);

	return (
		<main className="min-h-screen text-neutral-200 flex flex-col items-center py-8 sm:py-12 px-4 sm:px-6 relative z-10 selection:bg-neutral-800/50 selection:text-neutral-200">
			<div className="w-full max-w-6xl mb-8 sm:mb-10">
				<div className="rounded-3xl border border-neutral-800/80 bg-[linear-gradient(150deg,rgba(8,11,13,0.95),rgba(16,27,24,0.9))] p-4 sm:p-6 lg:p-8 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
					<div className="flex flex-col gap-4 sm:gap-6">
						<div>
							<Link
								href="/dashboard"
								className="group inline-flex items-center gap-2 rounded-full border border-neutral-700 bg-black/35 px-4 py-2 text-[11px] uppercase tracking-[0.16em] font-semibold text-neutral-300 hover:border-neutral-500 hover:text-neutral-100 transition-colors"
							>
								<FaArrowLeft className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform" />
								Return to Safehouse
							</Link>
						</div>
						<div>
							<p className="text-[11px] uppercase tracking-[0.2em] text-teal-200/80 font-semibold mb-3">
								The Wardrobe
							</p>
							<h1 className="text-3xl sm:text-5xl font-black tracking-tight text-neutral-100 leading-tight">
								A cleaner way to manage every cosmetic
							</h1>
							<p className="text-sm sm:text-base text-neutral-400 mt-3 max-w-3xl">
								Tap any item to lock or unlock it, then use filters to focus on exactly what you
								want to complete next.
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Pass the IDs securely fetched from the server to the client component */}
			<CosmeticsTracker initialUnlockedIds={initialUnlockedIds} />
		</main>
	);
}
