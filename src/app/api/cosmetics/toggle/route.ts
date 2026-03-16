import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { db } from "../../../../db";
import { userCosmetics } from "../../../../db/schema";
import { eq, and } from "drizzle-orm";

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
        const { cosmeticId } = body;

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
