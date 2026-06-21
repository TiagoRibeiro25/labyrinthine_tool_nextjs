import { type CosmeticItem } from "../lib/cosmetics";

export function filterCosmeticsByCategory(
	data: Record<string, CosmeticItem[]>,
	activeCategory: string,
	activeType: string,
	normalizedQuery: string,
): Record<string, CosmeticItem[]> {
	const output: Record<string, CosmeticItem[]> = {};

	Object.entries(data).forEach(([categoryName, items]) => {
		if (activeCategory !== "All" && activeCategory !== categoryName) {
			return;
		}

		const filteredItems = items.filter((item) => {
			const matchesType = activeType === "All" || item.type === activeType;
			const matchesSearch =
				normalizedQuery.length === 0 ||
				item.name.toLowerCase().includes(normalizedQuery);
			return matchesType && matchesSearch;
		});

		if (filteredItems.length > 0) {
			output[categoryName] = filteredItems;
		}
	});

	return output;
}

export function flattenCategoryMap(map: Record<string, CosmeticItem[]>): CosmeticItem[] {
	return Object.values(map).flat();
}
