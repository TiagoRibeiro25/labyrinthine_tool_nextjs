export interface FeatureBlock {
	title: string;
	description: string;
	accent: string;
}

export interface RunPlanStep {
	step: string;
	title: string;
	text: string;
}

export interface FaqItem {
	question: string;
	answer: string;
}

export const featureBlocks: FeatureBlock[] = [
	{
		title: "Cosmetics Tracker",
		description:
			"Build and maintain your collection with category filters, type filters, and fast cosmetic search.",
		accent: "Track locked and unlocked items from your wardrobe in one place.",
	},
	{
		title: "Puzzle Companion",
		description:
			"Practice core puzzle types and compare your best puzzle results on dedicated leaderboard views.",
		accent: "Train outside runs, then apply what you learned in game.",
	},
	{
		title: "Friends & Compare",
		description:
			"Compare collections with accepted friends and find missing cosmetics across your network.",
		accent: "Use profile and comparison tools to plan who should target what next.",
	},
];

export const quickFacts: string[] = [
	"Your unlocked cosmetics are saved to your account profile.",
	"Practice pages for slider puzzle and lights out.",
	"Activity and leaderboard pages to follow player progress.",
	"Mobile-friendly views for quick checks mid-session.",
];

export const runPlan: RunPlanStep[] = [
	{
		step: "1",
		title: "Prepare",
		text: "Sign in, set your profile, and mark your current unlocked cosmetics to establish your baseline.",
	},
	{
		step: "2",
		title: "Target",
		text: "Use puzzles and cosmetics pages to pick what you want to improve and collect next.",
	},
	{
		step: "3",
		title: "Coordinate",
		text: "Compare collections with friends and assign priorities so every session produces real progress.",
	},
	{
		step: "4",
		title: "Review",
		text: "Check activity and leaderboard pages to monitor progress over time.",
	},
];

export const faqs: FaqItem[] = [
	{
		question: "Do I need an account to browse the site?",
		answer:
			"No. You can browse the site and use all features without an account, but creating a free account allows you to save your unlocked cosmetics to your profile and compare collections with friends.",
	},
	{
		question: "Can I use this with my friends?",
		answer:
			"Yes. You can send and accept friend requests to compare collections and coordinate on what to target next.",
	},
	{
		question: "Is this only useful for veterans?",
		answer:
			"Not at all. New players can use this site to track their progress, learn about cosmetics, and practice puzzles before they encounter them in game. Veterans can use it to maintain their collection, coordinate with friends, and train puzzles outside of runs.",
	},
];
