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
	const sessionUser = session?.user as { id?: string; name?: string | null } | undefined;

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
							eq(friendRequests.receiverId, targetUser.id)
						),
						and(
							eq(friendRequests.senderId, targetUser.id),
							eq(friendRequests.receiverId, currentUser.id)
						)
					)
				)
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

	const currentUnlockedSet = new Set(currentUnlockedRows.map((row) => row.cosmeticId));
	const targetUnlockedSet = new Set(targetUnlockedRows.map((row) => row.cosmeticId));

	const onlyYou = allCosmetics.filter(
		(item) => currentUnlockedSet.has(item.id) && !targetUnlockedSet.has(item.id)
	);

	const onlyThem = allCosmetics.filter(
		(item) => targetUnlockedSet.has(item.id) && !currentUnlockedSet.has(item.id)
	);

	const bothMissing = allCosmetics.filter(
		(item) => !currentUnlockedSet.has(item.id) && !targetUnlockedSet.has(item.id)
	);

	const onlyYouByCategory = groupByCategory(onlyYou);
	const onlyThemByCategory = groupByCategory(onlyThem);
	const bothMissingByCategory = groupByCategory(bothMissing);

	return (
		<main className="min-h-screen text-neutral-200 flex flex-col items-center py-8 sm:py-12 px-4 sm:px-6 relative z-10 selection:bg-neutral-800/50 selection:text-neutral-200">
			<div className="w-full max-w-6xl mb-8 sm:mb-10">
				<div className="rounded-3xl border border-neutral-800/80 bg-[linear-gradient(150deg,rgba(7,11,15,0.95),rgba(14,31,34,0.9))] p-4 sm:p-6 lg:p-8 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
					<div className="flex flex-col gap-4 sm:gap-6">
						<div>
							<Link
								href={`/profile/${targetUser.username}`}
								className="group inline-flex items-center gap-2 rounded-full border border-neutral-700 bg-black/35 px-4 py-2 text-[11px] uppercase tracking-[0.16em] font-semibold text-neutral-300 hover:border-neutral-500 hover:text-neutral-100 transition-colors"
							>
								<FaArrowLeft className="group-hover:-translate-x-0.5 transition-transform" />
								Back to Profile
							</Link>
						</div>
						<div>
							<p className="text-[11px] uppercase tracking-[0.2em] text-cyan-200/80 font-semibold mb-3">
								Collection Comparison
							</p>
							<h1 className="text-3xl sm:text-5xl font-black tracking-tight text-neutral-100 leading-tight">
								See gaps and overlaps instantly
							</h1>
							<p className="text-sm sm:text-base text-neutral-400 mt-3 max-w-3xl">
								Compare your wardrobe with{" "}
								<span className="text-neutral-200 font-semibold">
									{targetUser.username}
								</span>{" "}
								to find what only one of you owns and what both of you can chase next.
							</p>
						</div>
					</div>
				</div>
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
