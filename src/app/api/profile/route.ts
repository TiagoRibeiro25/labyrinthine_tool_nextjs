import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "../../../db";
import { users } from "../../../db/schema";
import { requireSession, parseBody } from "../../../lib/api-helpers";
import {
	deleteAccountBodySchema,
	profileUpdateSchema,
} from "../../../lib/validation";

export async function PUT(req: Request) {
	try {
		const auth = await requireSession();
		if ("error" in auth) return auth.error;

		const userId = auth.userId;

		const parsed = await parseBody(req, profileUpdateSchema);
		if ("error" in parsed) return parsed.error;

		const steamProfileUrl = parsed.data.steamProfileUrl?.trim();
		const profilePictureId = parsed.data.profilePictureId?.trim() || null;
		const useDiscordAvatar = parsed.data.useDiscordAvatar;
		const useSteamAvatar = parsed.data.useSteamAvatar;
		const profileBannerId = parsed.data.profileBannerId?.trim() || null;
		const bio = parsed.data.bio?.trim() || null;
		const favoriteCosmeticId = parsed.data.favoriteCosmeticId ?? null;
		const profileCommentVisibility = parsed.data.profileCommentVisibility ?? undefined;

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

export async function DELETE(req: Request) {
	try {
		const auth = await requireSession();
		if ("error" in auth) return auth.error;

		const parsed = await parseBody(req, deleteAccountBodySchema);
		if ("error" in parsed) return parsed.error;

		await db.delete(users).where(eq(users.id, auth.userId));

		return NextResponse.json(
			{ message: "Account deleted successfully." },
			{ status: 200 }
		);
	} catch (error) {
		console.error("Error deleting account:", error);
		return NextResponse.json(
			{ message: "An internal server error occurred." },
			{ status: 500 }
		);
	}
}
