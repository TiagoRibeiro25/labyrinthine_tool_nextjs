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
		<main className="min-h-screen text-neutral-200 flex flex-col items-center py-12 px-4 sm:px-6 relative z-10 selection:bg-neutral-800/50 selection:text-neutral-200">
			<div className="w-full max-w-6xl flex flex-col items-center text-center mb-10">
				<h1 className="text-3xl sm:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-linear-to-b from-neutral-100 to-neutral-500 uppercase mb-4">
					Missing Cosmetics
				</h1>
				<p className="text-sm sm:text-base text-neutral-400 font-medium tracking-wide mb-8 max-w-2xl">
					Items that{" "}
					<span className="text-neutral-200 font-bold">{targetUser.username}</span> has
					yet to discover in the fog.
				</p>
				<Link
					href={`/profile/${targetUser.username}`}
					className="group inline-flex items-center justify-center gap-3 px-6 py-3 rounded-sm bg-neutral-900/50 text-neutral-400 font-bold text-xs uppercase tracking-widest border border-neutral-800 hover:bg-neutral-800 hover:text-neutral-200 hover:border-neutral-500 transition-all duration-300"
				>
					<FaArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
					Back to Profile
				</Link>
			</div>

			<MissingCosmeticsList
				missingByCategory={missingByCategory}
				totalMissing={totalMissing}
			/>
		</main>
	);
}
