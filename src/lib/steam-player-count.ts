import { STEAM_CURRENT_PLAYERS_URL } from "@/constants/steam";

export type ActivityTier = "peak" | "busy" | "steady" | "quiet";

export type PlayerActivityLevel = {
	label: string;
	hint: string;
	tier: ActivityTier;
};

type SteamPlayerCountResponse = {
	response?: {
		player_count?: number;
		result?: number;
	};
};

type SteamFetchOptions = RequestInit & {
	next?: {
		revalidate?: number;
	};
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
			hint: "A solid crowd is in-game, good time to find matches.",
			tier: "steady",
		};
	}
	return {
		label: "Quieter session",
		hint: "Fewer players online, calmer lobbies.",
		tier: "quiet",
	};
}

function parseSteamPlayerCount(data: SteamPlayerCountResponse): number | null {
	const result = data.response?.result;
	const count = data.response?.player_count;
	if (typeof result === "number" && result !== 1) return null;
	if (typeof count !== "number" || count < 0) return null;
	return count;
}

async function fetchSteamPlayerCount(options?: SteamFetchOptions): Promise<number | null> {
	const res = await fetch(STEAM_CURRENT_PLAYERS_URL, options);
	if (!res.ok) return null;

	const data = (await res.json()) as SteamPlayerCountResponse;
	return parseSteamPlayerCount(data);
}

export async function getSteamCurrentPlayerCount(): Promise<number | null> {
	try {
		const cachedCount = await fetchSteamPlayerCount({ next: { revalidate: 60 } });
		if (cachedCount === null) {
			return await fetchSteamPlayerCount({ cache: "no-store" });
		}

		if (cachedCount === 0) {
			const freshCount = await fetchSteamPlayerCount({ cache: "no-store" });
			return freshCount ?? cachedCount;
		}

		return cachedCount;
	} catch {
		return null;
	}
}
