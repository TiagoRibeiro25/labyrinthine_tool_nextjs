import { and, eq, inArray } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { db } from "../../../../db";
import { userCosmetics, users } from "../../../../db/schema";
import { authOptions } from "../../../../lib/auth";
import { getCosmeticById } from "../../../../lib/cosmetics";
import {
	createNotifications,
	getAcceptedFriendIds,
	recordActivityEvent,
} from "../../../../lib/social";
import {
	cosmeticsToggleBodySchema,
	getFirstZodErrorMessage,
} from "../../../../lib/validation";

export async function POST(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		const sessionUser = session?.user as { id?: string } | undefined;

		if (!session || !sessionUser || !sessionUser.id) {
			return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
		}

		const userId = sessionUser.id;
		const actorResult = await db
			.select({ username: users.username })
			.from(users)
			.where(eq(users.id, userId))
			.limit(1);

		const actor = actorResult[0];

		if (!actor) {
			return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
		}

		let body: unknown;
		try {
			body = await req.json();
		} catch {
			return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
		}

		const parsed = cosmeticsToggleBodySchema.safeParse(body);

		if (!parsed.success) {
			return NextResponse.json(
				{ message: getFirstZodErrorMessage(parsed.error) },
				{ status: 400 }
			);
		}

		// --- BULK TOGGLE LOGIC ---
		if ("cosmeticIds" in parsed.data) {
			const { cosmeticIds, action } = parsed.data;

			if (action === "unlock") {
				// To avoid unique constraint errors, we first need to find which ones the user ALREADY has
				const existingRecords = await db
					.select({ cosmeticId: userCosmetics.cosmeticId })
					.from(userCosmetics)
					.where(eq(userCosmetics.userId, userId));

				const existingSet = new Set(existingRecords.map((r) => r.cosmeticId));

				// Filter out the ones they already have
				const toInsert = cosmeticIds
					.filter((id) => !existingSet.has(id))
					.map((id) => ({
						userId,
						cosmeticId: id,
					}));

				if (toInsert.length > 0) {
					await db.insert(userCosmetics).values(toInsert);

					await recordActivityEvent({
						actorUserId: userId,
						eventType: "cosmetic_bulk_unlocked",
						scoreValue: toInsert.length,
						metadata: `${actor.username} unlocked ${toInsert.length} cosmetics.`,
					});

					const friendIds = await getAcceptedFriendIds(userId);
					await createNotifications(
						friendIds.map((friendId) => ({
							userId: friendId,
							actorUserId: userId,
							type: "friend_bulk_unlock",
							title: `${actor.username} unlocked cosmetics`,
							message: `${toInsert.length} new items were added to their collection.`,
							href: `/profile/${actor.username}`,
						}))
					);
				}

				return NextResponse.json(
					{ message: "Cosmetics bulk unlocked." },
					{ status: 200 }
				);
			} else if (action === "lock") {
				await db
					.delete(userCosmetics)
					.where(
						and(
							eq(userCosmetics.userId, userId),
							inArray(userCosmetics.cosmeticId, cosmeticIds)
						)
					);

				return NextResponse.json({ message: "Cosmetics bulk locked." }, { status: 200 });
			}

			return NextResponse.json({ message: "Invalid bulk action." }, { status: 400 });
		}

		// --- SINGLE TOGGLE LOGIC ---
		const { cosmeticId } = parsed.data;

		// Check if the cosmetic is already unlocked
		const existing = await db
			.select()
			.from(userCosmetics)
			.where(
				and(eq(userCosmetics.userId, userId), eq(userCosmetics.cosmeticId, cosmeticId))
			)
			.limit(1);

		if (existing.length > 0) {
			// Delete it to lock
			await db
				.delete(userCosmetics)
				.where(
					and(eq(userCosmetics.userId, userId), eq(userCosmetics.cosmeticId, cosmeticId))
				);

			return NextResponse.json(
				{ message: "Cosmetic locked.", unlocked: false },
				{ status: 200 }
			);
		} else {
			// Insert it to unlock
			await db.insert(userCosmetics).values({
				userId,
				cosmeticId,
			});

			const cosmeticName = getCosmeticById(cosmeticId)?.name;

			await recordActivityEvent({
				actorUserId: userId,
				eventType: "cosmetic_unlocked",
				cosmeticId,
				metadata: cosmeticName
					? `${actor.username} unlocked ${cosmeticName}.`
					: `${actor.username} unlocked a cosmetic.`,
			});

			const friendIds = await getAcceptedFriendIds(userId);
			await createNotifications(
				friendIds.map((friendId) => ({
					userId: friendId,
					actorUserId: userId,
					type: "friend_unlock",
					title: `${actor.username} found something new`,
					message: cosmeticName
						? `${cosmeticName} was unlocked.`
						: "A new cosmetic was unlocked.",
					href: `/profile/${actor.username}`,
				}))
			);

			return NextResponse.json(
				{ message: "Cosmetic unlocked.", unlocked: true },
				{ status: 200 }
			);
		}
	} catch (error) {
		console.error("Error toggling cosmetic:", error);
		return NextResponse.json(
			{ message: "An internal server error occurred." },
			{ status: 500 }
		);
	}
}
