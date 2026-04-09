type AvatarSource = {
	profilePictureId?: string | null;
	discordAvatarUrl?: string | null;
	useDiscordAvatar?: boolean | null;
};

export function getUserAvatarUrl(source: AvatarSource): string {
	if (source.useDiscordAvatar && source.discordAvatarUrl) {
		return source.discordAvatarUrl;
	}

	const profilePictureId = source.profilePictureId || "1";
	return `/images/profile_pictures/${profilePictureId}.webp`;
}
