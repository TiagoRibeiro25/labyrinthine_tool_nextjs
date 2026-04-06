export interface ProfileBannerOption {
	id: "entrance" | "candle" | "chap1" | "house" | "puzzles";
	label: string;
	imageUrl: string;
}

export const PROFILE_BANNER_OPTIONS: ProfileBannerOption[] = [
	{
		id: "entrance",
		label: "Chapter 1 Entrance",
		imageUrl: "/images/Chapter_1_Entrance.webp",
	},
	{
		id: "candle",
		label: "Candlelight",
		imageUrl: "/images/candle.webp",
	},
	{
		id: "chap1",
		label: "Chapter 1 Hall",
		imageUrl: "/images/chap1.jpg",
	},
	{
		id: "house",
		label: "The House",
		imageUrl: "/images/house.jpg",
	},
	{
		id: "puzzles",
		label: "Puzzle Chamber",
		imageUrl: "/images/puzzles.jpg",
	},
];

export function getBannerImageById(id?: string | null): string {
	return (
		PROFILE_BANNER_OPTIONS.find((option) => option.id === id)?.imageUrl ??
		"/images/chap1.jpg"
	);
}
