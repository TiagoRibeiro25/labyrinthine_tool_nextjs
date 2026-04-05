import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { db } from "../../../../db";
import { userCosmetics } from "../../../../db/schema";
import { eq, and, inArray } from "drizzle-orm";
import {
    cosmeticsToggleBodySchema,
    getFirstZodErrorMessage,
} from "../../../../lib/validation";

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
        let body: unknown;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json(
                { message: "Invalid JSON body." },
                { status: 400 },
            );
        }

        const parsed = cosmeticsToggleBodySchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { message: getFirstZodErrorMessage(parsed.error) },
                { status: 400 },
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
        const { cosmeticId } = parsed.data;

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
