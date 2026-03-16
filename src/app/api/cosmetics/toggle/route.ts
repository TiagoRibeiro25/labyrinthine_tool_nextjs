import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { db } from "../../../../db";
import { userCosmetics } from "../../../../db/schema";
import { eq, and, inArray } from "drizzle-orm";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        const sessionUser = session?.user as { id?: string } | undefined;

        if (!session || !sessionUser || !sessionUser.id) {
            return NextResponse.json(
                { message: "Unauthorized." },
                { status: 401 },
            );
        }

        const userId = sessionUser.id;
        const body = await req.json();
        const { cosmeticId, cosmeticIds, action } = body;

        // --- BULK TOGGLE LOGIC ---
        if (Array.isArray(cosmeticIds) && typeof action === "string") {
            if (cosmeticIds.length === 0) {
                return NextResponse.json(
                    { message: "No cosmetic IDs provided." },
                    { status: 400 },
                );
            }

            if (action === "unlock") {
                // To avoid unique constraint errors, we first need to find which ones the user ALREADY has
                const existingRecords = await db
                    .select({ cosmeticId: userCosmetics.cosmeticId })
                    .from(userCosmetics)
                    .where(eq(userCosmetics.userId, userId));

                const existingSet = new Set(
                    existingRecords.map((r) => r.cosmeticId),
                );

                // Filter out the ones they already have
                const toInsert = cosmeticIds
                    .filter((id) => !existingSet.has(id))
                    .map((id) => ({
                        userId,
                        cosmeticId: id,
                    }));

                if (toInsert.length > 0) {
                    await db.insert(userCosmetics).values(toInsert);
                }

                return NextResponse.json(
                    { message: "Cosmetics bulk unlocked." },
                    { status: 200 },
                );
            } else if (action === "lock") {
                await db
                    .delete(userCosmetics)
                    .where(
                        and(
                            eq(userCosmetics.userId, userId),
                            inArray(userCosmetics.cosmeticId, cosmeticIds),
                        ),
                    );

                return NextResponse.json(
                    { message: "Cosmetics bulk locked." },
                    { status: 200 },
                );
            }

            return NextResponse.json(
                { message: "Invalid bulk action." },
                { status: 400 },
            );
        }

        // --- SINGLE TOGGLE LOGIC ---
        if (typeof cosmeticId !== "number") {
            return NextResponse.json(
                { message: "Invalid cosmetic ID." },
                { status: 400 },
            );
        }

        // Check if the cosmetic is already unlocked
        const existing = await db
            .select()
            .from(userCosmetics)
            .where(
                and(
                    eq(userCosmetics.userId, userId),
                    eq(userCosmetics.cosmeticId, cosmeticId),
                ),
            )
            .limit(1);

        if (existing.length > 0) {
            // Delete it to lock
            await db
                .delete(userCosmetics)
                .where(
                    and(
                        eq(userCosmetics.userId, userId),
                        eq(userCosmetics.cosmeticId, cosmeticId),
                    ),
                );

            return NextResponse.json(
                { message: "Cosmetic locked.", unlocked: false },
                { status: 200 },
            );
        } else {
            // Insert it to unlock
            await db.insert(userCosmetics).values({
                userId,
                cosmeticId,
            });

            return NextResponse.json(
                { message: "Cosmetic unlocked.", unlocked: true },
                { status: 200 },
            );
        }
    } catch (error) {
        console.error("Error toggling cosmetic:", error);
        return NextResponse.json(
            { message: "An internal server error occurred." },
            { status: 500 },
        );
    }
}
