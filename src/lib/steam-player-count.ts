import { STEAM_CURRENT_PLAYERS_URL } from "@/constants/steam";

export type ActivityTier = "peak" | "busy" | "steady" | "quiet";

export type PlayerActivityLevel = {
	label: string;
	hint: string;
	tier: ActivityTier;
};

export function getPlayerActivityLevel(count: number): PlayerActivityLevel {
	if (count >= 500) {
		return {
			label: "Peak activity",
			hint: "One of the busiest windows right now.",
			tier: "peak",
		};
	}
	if (count >= 300) {
		return {
			label: "Squads rolling",
			hint: "Plenty of teams playing, good time to jump in.",
			tier: "busy",
		};
	}
	if (count >= 150) {
		return {
			label: "Steady traffic",
			hint: "A solid crowd is in-game — good time to find matches.",
			tier: "steady",
		};
	}
	return {
		label: "Quieter session",
		hint: "Fewer players online — calmer lobbies.",
		tier: "quiet",
	};
}

export async function getSteamCurrentPlayerCount(): Promise<number | null> {
	try {
		const res = await fetch(STEAM_CURRENT_PLAYERS_URL, { next: { revalidate: 60 } });
		if (!res.ok) return null;

		const data = (await res.json()) as { response?: { player_count?: number } };
		const count = data.response?.player_count;
		if (typeof count !== "number" || count < 0) return null;

		return count;
	} catch {
		return null;
	}
}
