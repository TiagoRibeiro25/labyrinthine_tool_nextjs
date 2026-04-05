import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { db } from "../../../db";
import { users } from "../../../db/schema";
import { eq } from "drizzle-orm";
import {
    getFirstZodErrorMessage,
    profileUpdateSchema,
} from "../../../lib/validation";

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

        let body: unknown;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json(
                { message: "Invalid JSON body." },
                { status: 400 },
            );
        }

        const parsed = profileUpdateSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { message: getFirstZodErrorMessage(parsed.error) },
                { status: 400 },
            );
        }

        const discordUsername = parsed.data.discordUsername?.trim() || null;
        const steamProfileUrl = parsed.data.steamProfileUrl?.trim() || null;
        const profilePictureId = parsed.data.profilePictureId?.trim() || null;

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
