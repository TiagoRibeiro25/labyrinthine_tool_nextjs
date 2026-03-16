import cosmeticsData from "../data/cosmetics.json";

export interface CosmeticItem {
    id: number;
    name: string;
}

export type CosmeticsCategoryMap = Record<string, CosmeticItem[]>;

// The raw imported JSON
export const categories: CosmeticsCategoryMap = cosmeticsData;

// A flat array of all cosmetics regardless of category
export const allCosmetics: CosmeticItem[] = Object.values(categories).flat();

/**
 * Returns the category name for a given cosmetic ID.
 */
export function getCategoryForCosmetic(id: number): string | null {
    for (const [category, items] of Object.entries(categories)) {
        if (items.some((item) => item.id === id)) {
            return category;
        }
    }
    return null;
}

/**
 * Finds a specific cosmetic by its ID
 */
export function getCosmeticById(id: number): CosmeticItem | undefined {
    return allCosmetics.find((item) => item.id === id);
}
