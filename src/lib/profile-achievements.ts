export type AchievementIcon = "shirt" | "trophy" | "friends" | "puzzle" | "lightbulb";

export type ProfileAchievement = {
	id: string;
	title: string;
	description: string;
	unlocked: boolean;
	progress: string;
	icon: AchievementIcon;
	iconClassName: string;
};

type PuzzleRecord = {
	durationMs: number;
	moves: number;
};

type BuildProfileAchievementsInput = {
	unlockedCount: number;
	friendsCount: number;
	completedCategoryCount: number;
	totalCosmeticsCount: number;
	lightsOutBest: PuzzleRecord | null;
	sliderPuzzleBest: PuzzleRecord | null;
	favoriteCosmeticId: number | null;
	formatDuration: (durationMs: number) => string;
};

export function buildProfileAchievements(input: BuildProfileAchievementsInput): {
	achievements: ProfileAchievement[];
	unlockedAchievementsCount: number;
} {
	const {
		unlockedCount,
		friendsCount,
		completedCategoryCount,
		totalCosmeticsCount,
		lightsOutBest,
		sliderPuzzleBest,
		favoriteCosmeticId,
		formatDuration,
	} = input;

	const bestDurationMs = Math.min(
		lightsOutBest?.durationMs ?? Number.POSITIVE_INFINITY,
		sliderPuzzleBest?.durationMs ?? Number.POSITIVE_INFINITY
	);

	const achievements: ProfileAchievement[] = [
		{
			id: "first-unlock",
			title: "First Unlock",
			description: "Unlock your first cosmetic.",
			unlocked: unlockedCount >= 1,
			progress: `${Math.min(unlockedCount, 1)}/1`,
			icon: "shirt",
			iconClassName: "text-emerald-400",
		},
		{
			id: "collector-100",
			title: "Collector",
			description: "Unlock 100 cosmetics.",
			unlocked: unlockedCount >= 100,
			progress: `${Math.min(unlockedCount, 100)}/100`,
			icon: "shirt",
			iconClassName: "text-cyan-400",
		},
		{
			id: "category-specialist",
			title: "Category Specialist",
			description: "Fully complete 3 cosmetic categories.",
			unlocked: completedCategoryCount >= 3,
			progress: `${Math.min(completedCategoryCount, 3)}/3`,
			icon: "trophy",
			iconClassName: "text-amber-400",
		},
		{
			id: "full-completion",
			title: "Full Completion",
			description: "Unlock every cosmetic in the game.",
			unlocked: unlockedCount >= totalCosmeticsCount,
			progress: `${unlockedCount}/${totalCosmeticsCount}`,
			icon: "trophy",
			iconClassName: "text-yellow-400",
		},
		{
			id: "social-survivor",
			title: "Social Survivor",
			description: "Reach 5 accepted friends.",
			unlocked: friendsCount >= 5,
			progress: `${Math.min(friendsCount, 5)}/5`,
			icon: "friends",
			iconClassName: "text-blue-400",
		},
		{
			id: "puzzle-initiate",
			title: "Puzzle Initiate",
			description: "Complete any puzzle mode once.",
			unlocked: Boolean(lightsOutBest || sliderPuzzleBest),
			progress: `${(lightsOutBest ? 1 : 0) + (sliderPuzzleBest ? 1 : 0)}/1`,
			icon: "puzzle",
			iconClassName: "text-sky-400",
		},
		{
			id: "dual-discipline",
			title: "Dual Discipline",
			description: "Set personal records in both puzzle modes.",
			unlocked: Boolean(lightsOutBest && sliderPuzzleBest),
			progress: `${(lightsOutBest ? 1 : 0) + (sliderPuzzleBest ? 1 : 0)}/2`,
			icon: "lightbulb",
			iconClassName: "text-amber-400",
		},
		{
			id: "sprinter",
			title: "Sprinter",
			description: "Finish a puzzle in under 60 seconds.",
			unlocked: bestDurationMs < 60_000,
			progress:
				bestDurationMs === Number.POSITIVE_INFINITY
					? "No record"
					: formatDuration(bestDurationMs),
			icon: "puzzle",
			iconClassName: "text-fuchsia-400",
		},
		{
			id: "curator",
			title: "Curator",
			description: "Pick a favorite cosmetic on your profile.",
			unlocked: Boolean(favoriteCosmeticId),
			progress: favoriteCosmeticId ? "Set" : "Not set",
			icon: "shirt",
			iconClassName: "text-neutral-300",
		},
	];

	return {
		achievements,
		unlockedAchievementsCount: achievements.filter((achievement) => achievement.unlocked)
			.length,
	};
}
