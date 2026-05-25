import { DISCORD_INVITE_API_URL, VALKO_DISCORD_INVITE_CODE } from "../constants/discord";

export interface DiscordInviteStats {
	guildName: string;
	description: string | null;
	memberCount: number;
	onlineCount: number;
}

interface DiscordInviteApiResponse {
	guild?: {
		name?: string;
		description?: string | null;
	};
	approximate_member_count?: number;
	approximate_presence_count?: number;
}

export async function getValkoDiscordInviteStats(): Promise<DiscordInviteStats | null> {
	try {
		const url = new URL(`${DISCORD_INVITE_API_URL}/${VALKO_DISCORD_INVITE_CODE}`);
		url.searchParams.set("with_counts", "true");

		const response = await fetch(url, {
			next: { revalidate: 300 },
			headers: {
				"User-Agent": "labyrinthine-tool",
			},
		});

		if (!response.ok) {
			return null;
		}

		const data = (await response.json()) as DiscordInviteApiResponse;
		const memberCount = data.approximate_member_count;
		const onlineCount = data.approximate_presence_count;

		if (
			typeof memberCount !== "number" ||
			typeof onlineCount !== "number" ||
			!data.guild?.name
		) {
			return null;
		}

		return {
			guildName: data.guild.name,
			description: data.guild.description ?? null,
			memberCount,
			onlineCount,
		};
	} catch {
		return null;
	}
}
