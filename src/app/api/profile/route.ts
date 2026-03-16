import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { db } from "../../../db";
import { users } from "../../../db/schema";
import { eq } from "drizzle-orm";

export async function PUT(req: Request) {
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
        const { discordUsername, steamProfileUrl, profilePictureId } = body;

        if (steamProfileUrl) {
            const steamRegex =
                /^https?:\/\/(www\.)?steamcommunity\.com\/(id|profiles)\/[a-zA-Z0-9_-]+\/?$/;
            if (!steamRegex.test(steamProfileUrl)) {
                return NextResponse.json(
                    {
                        message:
                            "Invalid Steam Profile URL. Must be a valid steamcommunity.com link.",
                    },
                    { status: 400 },
                );
            }
        }

        await db
            .update(users)
            .set({
                discordUsername: discordUsername || null,
                steamProfileUrl: steamProfileUrl || null,
                profilePictureId: profilePictureId || null,
                updatedAt: new Date(),
            })
            .where(eq(users.id, userId));

        return NextResponse.json(
            { message: "Profile updated successfully." },
            { status: 200 },
        );
    } catch (error) {
        console.error("Error updating profile:", error);
        return NextResponse.json(
            { message: "An internal server error occurred." },
            { status: 500 },
        );
    }
}
