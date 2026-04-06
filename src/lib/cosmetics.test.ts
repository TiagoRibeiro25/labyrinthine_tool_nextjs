import { describe, expect, it } from "vitest";
import {
    allCosmetics,
    allTypes,
    categories,
    getCategoryForCosmetic,
    getCosmeticById,
} from "./cosmetics";

describe("cosmetics library", () => {
	it("loads categories and flattened cosmetics", () => {
		expect(Object.keys(categories).length).toBeGreaterThan(0);
		expect(allCosmetics.length).toBeGreaterThan(0);
		expect(allTypes.length).toBeGreaterThan(0);
	});

	it("returns category and item for known cosmetic ids", () => {
		const first = allCosmetics[0];
		expect(first).toBeDefined();
		expect(getCategoryForCosmetic(first!.id)).toBeTruthy();
		expect(getCosmeticById(first!.id)?.id).toBe(first!.id);
	});

	it("returns null/undefined for unknown cosmetic ids", () => {
		expect(getCategoryForCosmetic(-9999)).toBeNull();
		expect(getCosmeticById(-9999)).toBeUndefined();
	});
});
