export const PUZZLE_TYPE_VALUES = ["lights-out", "slider-puzzle"] as const;

export type PuzzleType = (typeof PUZZLE_TYPE_VALUES)[number];

export const PUZZLE_TYPES = {
	LIGHTS_OUT: "lights-out",
	SLIDER_PUZZLE: "slider-puzzle",
} as const;

export const DEFAULT_PUZZLE_TYPE: PuzzleType = "lights-out";

export const PUZZLE_LABELS: Record<PuzzleType, string> = {
	"lights-out": "Lights Out",
	"slider-puzzle": "Slider Puzzle",
};

export const PUZZLE_SCORE_API_PATH = "/api/puzzles/scores";

export const PUZZLE_TIMER_TICK_MS = 250;
