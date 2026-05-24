import { LABYRINTHINE_STEAM_APP_ID, STEAM_NEWS_API_URL } from "../constants/steam";

export interface SteamNewsItem {
	id: string;
	title: string;
	url: string;
	author: string;
	contents: string;
	date: Date;
	feedLabel: string;
}

interface SteamNewsApiItem {
	gid: string;
	title: string;
	url: string;
	author: string;
	contents: string;
	feedlabel: string;
	date: number;
}

interface SteamNewsApiResponse {
	appnews?: {
		newsitems?: SteamNewsApiItem[];
	};
}

export function formatSteamNewsContent(raw: string): string {
	return raw
		.replace(/\[\/p\]/gi, "\n")
		.replace(/\[p\]/gi, "")
		.replace(/\[dynamiclink href="([^"]+)"\]\[\/dynamiclink\]/gi, "$1")
		.replace(/\[url=([^\]]+)\]([^\[]*)\[\/url\]/gi, "$2 ($1)")
		.replace(/\[[^\]]+\]/g, "")
		.replace(/\n{3,}/g, "\n\n")
		.trim();
}

export async function getLabyrinthineSteamNews(count = 6): Promise<SteamNewsItem[]> {
	try {
		const url = new URL(STEAM_NEWS_API_URL);
		url.searchParams.set("appid", String(LABYRINTHINE_STEAM_APP_ID));
		url.searchParams.set("count", String(count));
		url.searchParams.set("maxlength", "0");
		url.searchParams.set("feeds", "steam_community_announcements");

		const response = await fetch(url, { next: { revalidate: 3600 } });
		if (!response.ok) {
			return [];
		}

		const data = (await response.json()) as SteamNewsApiResponse;
		const items = data.appnews?.newsitems ?? [];

		return items.map((item) => ({
			id: item.gid,
			title: item.title,
			url: item.url,
			author: item.author,
			contents: formatSteamNewsContent(item.contents),
			date: new Date(item.date * 1000),
			feedLabel: item.feedlabel,
		}));
	} catch {
		return [];
	}
}
