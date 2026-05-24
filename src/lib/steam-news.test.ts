import { describe, expect, it } from "vitest";
import { formatSteamNewsContent } from "./steam-news";

describe("formatSteamNewsContent", () => {
	it("strips Steam paragraph and dynamic link tags", () => {
		const raw =
			'[p]Hey Everyone,[/p][p][/p][p]Our new game is now available![/p][dynamiclink href="https://store.steampowered.com/app/2564910/CRYO"][/dynamiclink]';

		expect(formatSteamNewsContent(raw)).toBe(
			"Hey Everyone,\n\nOur new game is now available!\nhttps://store.steampowered.com/app/2564910/CRYO"
		);
	});

	it("leaves plain patch note bullets unchanged", () => {
		const raw =
			"- Updated SteamVR to fix some issues\n- Fixed strong flashlight settings being set to regular flashlight";

		expect(formatSteamNewsContent(raw)).toBe(raw);
	});
});
