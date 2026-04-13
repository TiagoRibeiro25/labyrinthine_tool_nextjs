import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { db } from "../../../db";
import { users } from "../../../db/schema";
import { authOptions } from "../../../lib/auth";
import { getFirstZodErrorMessage, profileUpdateSchema } from "../../../lib/validation";

export async function PUT(req: Request) {
	try {
		const session = await getServerSession(authOptions);

		const sessionUser = session?.user as { id?: string } | undefined;

		if (!session || !sessionUser || !sessionUser.id) {
			return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
		}

		const userId = sessionUser.id;

		let body: unknown;
		try {
			body = await req.json();
		} catch {
			return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
		}

		const parsed = profileUpdateSchema.safeParse(body);

		if (!parsed.success) {
			return NextResponse.json(
				{ message: getFirstZodErrorMessage(parsed.error) },
				{ status: 400 }
			);
		}

		const steamProfileUrl = parsed.data.steamProfileUrl?.trim();
		const profilePictureId = parsed.data.profilePictureId?.trim() || null;
		const useDiscordAvatar = parsed.data.useDiscordAvatar;
		const useSteamAvatar = parsed.data.useSteamAvatar;
		const profileBannerId = parsed.data.profileBannerId?.trim() || null;
		const bio = parsed.data.bio?.trim() || null;
		const favoriteCosmeticId = parsed.data.favoriteCosmeticId ?? null;
		const profileCommentVisibility =
			parsed.data.profileCommentVisibility ?? undefined;

		await db
			.update(users)
			.set({
				bio,
				...(typeof steamProfileUrl === "string"
					? { steamProfileUrl: steamProfileUrl || null }
					: {}),
				profilePictureId: profilePictureId || null,
				...(typeof useDiscordAvatar === "boolean" ? { useDiscordAvatar } : {}),
				...(typeof useSteamAvatar === "boolean" ? { useSteamAvatar } : {}),
				...(profileCommentVisibility ? { profileCommentVisibility } : {}),
				profileBannerId,
				favoriteCosmeticId,
				updatedAt: new Date(),
			})
			.where(eq(users.id, userId));

		return NextResponse.json(
			{ message: "Profile updated successfully." },
			{ status: 200 }
		);
	} catch (error) {
		console.error("Error updating profile:", error);
		return NextResponse.json(
			{ message: "An internal server error occurred." },
			{ status: 500 }
		);
	}
}
