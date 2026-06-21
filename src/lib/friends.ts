export interface FriendUser {
	id: string;
	username: string;
	profilePictureId: string | null;
	steamAvatarUrl: string | null;
	useSteamAvatar: boolean;
	discordAvatarUrl: string | null;
	useDiscordAvatar: boolean;
	isAdministrator: boolean;
}

export const FRIEND_USER_COLUMNS = {
	id: true,
	username: true,
	profilePictureId: true,
	steamAvatarUrl: true,
	useSteamAvatar: true,
	discordAvatarUrl: true,
	useDiscordAvatar: true,
	isAdministrator: true,
} as const;
