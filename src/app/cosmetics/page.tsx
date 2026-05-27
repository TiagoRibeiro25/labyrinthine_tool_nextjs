import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FaArrowLeft, FaShirt } from "react-icons/fa6";
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
		<main className="min-h-screen text-neutral-200 relative z-10 selection:bg-neutral-800/50 selection:text-neutral-200">
			{/* Ambient background gradients */}
			<div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_0%_0%,rgba(20,184,166,0.07),transparent_50%),radial-gradient(ellipse_at_100%_100%,rgba(56,189,248,0.06),transparent_50%)]" />

			<div className="relative px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
				{/* Page header */}
				<header className="mb-6 sm:mb-8">
					<div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
						<div>
							<Link
								href="/dashboard"
								className="group inline-flex items-center gap-2 rounded-full border border-neutral-700/80 bg-black/35 px-4 py-1.5 text-[10px] uppercase tracking-[0.18em] font-bold text-neutral-400 hover:border-neutral-500 hover:text-neutral-200 transition-all mb-4"
							>
								<FaArrowLeft className="w-2.5 h-2.5 group-hover:-translate-x-0.5 transition-transform" />
								Safehouse
							</Link>

							<div className="flex items-center gap-3">
								<div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-teal-500/30 bg-teal-500/10 text-teal-300">
									<FaShirt className="w-4 h-4" />
								</div>
								<div>
									<p className="text-[10px] uppercase tracking-[0.22em] text-teal-300/70 font-bold">
										The Wardrobe
									</p>
									<h1 className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-100 leading-tight">
										Cosmetics Collection
									</h1>
								</div>
							</div>
						</div>

						<p className="text-sm text-neutral-500 max-w-sm leading-relaxed">
							Tap any item to lock or unlock it. Use the sidebar filters to focus on
							exactly what you need.
						</p>
					</div>
				</header>

				{/* Dashboard layout — tracker handles its own two-panel layout */}
				<CosmeticsTracker initialUnlockedIds={initialUnlockedIds} />
			</div>
		</main>
	);
}
