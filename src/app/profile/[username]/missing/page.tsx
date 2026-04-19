import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FaArrowLeft } from "react-icons/fa6";
import MissingCosmeticsList from "../../../../components/MissingCosmeticsList";
import { db } from "../../../../db";
import { userCosmetics, users } from "../../../../db/schema";
import { categories } from "../../../../lib/cosmetics";

interface MissingCosmeticsPageProps {
	params: {
		username: string;
	};
}

export default async function MissingCosmeticsPage({
	params,
}: MissingCosmeticsPageProps) {
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
	const missingByCategory: Record<string, (typeof categories)[string]> = {};
	let totalMissing = 0;

	for (const [categoryName, items] of Object.entries(categories)) {
		const missingItems = items.filter((item) => !unlockedIds.has(item.id));
		if (missingItems.length > 0) {
			missingByCategory[categoryName] = missingItems;
			totalMissing += missingItems.length;
		}
	}

	return (
		<main className="min-h-screen text-neutral-200 flex flex-col items-center py-8 sm:py-12 px-4 sm:px-6 relative z-10 selection:bg-neutral-800/50 selection:text-neutral-200">
			<div className="w-full max-w-6xl mb-8 sm:mb-10">
				<div className="rounded-3xl border border-neutral-800/80 bg-[linear-gradient(150deg,rgba(15,8,8,0.95),rgba(31,15,18,0.9))] p-4 sm:p-6 lg:p-8 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
					<div className="flex flex-col gap-4 sm:gap-6">
						<div>
							<Link
								href={`/profile/${targetUser.username}`}
								className="group inline-flex items-center gap-2 rounded-full border border-neutral-700 bg-black/35 px-4 py-2 text-[11px] uppercase tracking-[0.16em] font-semibold text-neutral-300 hover:border-neutral-500 hover:text-neutral-100 transition-colors"
							>
								<FaArrowLeft className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform" />
								Back to Profile
							</Link>
						</div>
						<div>
							<p className="text-[11px] uppercase tracking-[0.2em] text-rose-200/80 font-semibold mb-3">
								Missing Cosmetics
							</p>
							<h1 className="text-3xl sm:text-5xl font-black tracking-tight text-neutral-100 leading-tight">
								Everything {targetUser.username} still needs
							</h1>
							<p className="text-sm sm:text-base text-neutral-400 mt-3 max-w-3xl">
								Review the remaining collection with focused filters and a clearer visual
								map of what is left to unlock.
							</p>
						</div>
					</div>
				</div>
			</div>

			<MissingCosmeticsList
				missingByCategory={missingByCategory}
				totalMissing={totalMissing}
			/>
		</main>
	);
}
