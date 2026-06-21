export interface EditProfileInitialData {
	bio: string | null;
	discordUsername: string | null;
	discordAvatarUrl: string | null;
	useDiscordAvatar: boolean;
	steamUsername: string | null;
	steamAvatarUrl: string | null;
	useSteamAvatar: boolean;
	steamProfileUrl: string | null;
	profileCommentVisibility: "everyone" | "friends_only" | "no_one";
	profilePictureId: string | null;
	profileBannerId: string | null;
	favoriteCosmeticId: number | null;
}
