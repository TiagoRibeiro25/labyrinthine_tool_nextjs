import { and, eq, or } from "drizzle-orm";
import { PROFILE_COMMENT_BANNED_PHRASES } from "../constants/profile-comments";
import { db } from "../db";
import { friendRequests, userBlocks, users } from "../db/schema";

export type ProfileCommentVisibility = "everyone" | "friends_only" | "no_one";

export function normalizeProfileCommentVisibility(
	value: string | null | undefined
): ProfileCommentVisibility {
	if (value === "friends_only" || value === "no_one") {
		return value;
	}

	return "everyone";
}

export interface ProfileCommentPermissionInput {
	profileUserId: string;
	authorUserId: string;
	visibility: string;
}

export function normalizeCommentContent(content: string): string {
	return content.replace(/\s+/g, " ").trim();
}

export function containsDisallowedCommentText(content: string): boolean {
	const normalized = content.toLowerCase();
	return PROFILE_COMMENT_BANNED_PHRASES.some((phrase) =>
		normalized.includes(phrase)
	);
}

export async function areUsersFriends(
	aUserId: string,
	bUserId: string
): Promise<boolean> {
	if (aUserId === bUserId) {
		return true;
	}

	const rows = await db
		.select({ id: friendRequests.id })
		.from(friendRequests)
		.where(
			and(
				eq(friendRequests.status, "accepted"),
				or(
					and(
						eq(friendRequests.senderId, aUserId),
						eq(friendRequests.receiverId, bUserId)
					),
					and(
						eq(friendRequests.senderId, bUserId),
						eq(friendRequests.receiverId, aUserId)
					)
				)
			)
		)
		.limit(1);

	return rows.length > 0;
}

export async function areUsersBlocked(
	aUserId: string,
	bUserId: string
): Promise<boolean> {
	if (aUserId === bUserId) {
		return false;
	}

	const rows = await db
		.select({ id: userBlocks.id })
		.from(userBlocks)
		.where(
			or(
				and(eq(userBlocks.blockerUserId, aUserId), eq(userBlocks.blockedUserId, bUserId)),
				and(eq(userBlocks.blockerUserId, bUserId), eq(userBlocks.blockedUserId, aUserId))
			)
		)
		.limit(1);

	return rows.length > 0;
}

export async function canUserCommentOnProfile(
	input: ProfileCommentPermissionInput
): Promise<boolean> {
	if (input.profileUserId === input.authorUserId) {
		return true;
	}

	const visibility = (input.visibility || "everyone") as ProfileCommentVisibility;

	if (visibility === "no_one") {
		return false;
	}

	const blocked = await areUsersBlocked(input.profileUserId, input.authorUserId);
	if (blocked) {
		return false;
	}

	const friends = await areUsersFriends(input.profileUserId, input.authorUserId);

	if (visibility === "friends_only") {
		return friends;
	}

	return true;
}

export async function getUserCommentSettings(userId: string): Promise<{
	visibility: ProfileCommentVisibility;
} | null> {
	const rows = await db
		.select({
			visibility: users.profileCommentVisibility,
		})
		.from(users)
		.where(eq(users.id, userId))
		.limit(1);

	const settings = rows[0];
	if (!settings) {
		return null;
	}

	const visibility = ["everyone", "friends_only", "no_one"].includes(settings.visibility)
		? (settings.visibility as ProfileCommentVisibility)
		: "everyone";

	return {
		visibility,
	};
}
