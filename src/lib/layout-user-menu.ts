import { eq } from "drizzle-orm";
import { cache } from "react";
import { db } from "../db";
import { users } from "../db/schema";
import { getUserAvatarUrl } from "./avatar";

export const getUserQuickMenuData = cache(async (userId: string) => {
	const userResult = await db
		.select({
			username: users.username,
			profilePictureId: users.profilePictureId,
			steamAvatarUrl: users.steamAvatarUrl,
			useSteamAvatar: users.useSteamAvatar,
			discordAvatarUrl: users.discordAvatarUrl,
			useDiscordAvatar: users.useDiscordAvatar,
		})
		.from(users)
		.where(eq(users.id, userId))
		.limit(1);

	const user = userResult[0];
	if (!user) {
		return null;
	}

	return {
		username: user.username,
		avatarUrl: getUserAvatarUrl(user),
	};
});
