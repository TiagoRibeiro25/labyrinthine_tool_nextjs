import { describe, expect, it } from "vitest";
import {
    DEFAULT_PUZZLE_TYPE,
    PUZZLE_LABELS,
    PUZZLE_SCORE_API_PATH,
    PUZZLE_TIMER_TICK_MS,
    PUZZLE_TYPES,
    PUZZLE_TYPE_VALUES,
} from "./puzzles";

describe("puzzle constants", () => {
	it("exposes supported puzzle type values", () => {
		expect(PUZZLE_TYPE_VALUES).toEqual(["lights-out", "slider-puzzle"]);
		expect(DEFAULT_PUZZLE_TYPE).toBe("lights-out");
	});

	it("maps puzzle labels and named constants", () => {
		expect(PUZZLE_TYPES.LIGHTS_OUT).toBe("lights-out");
		expect(PUZZLE_TYPES.SLIDER_PUZZLE).toBe("slider-puzzle");
		expect(PUZZLE_LABELS["lights-out"]).toBe("Lights Out");
		expect(PUZZLE_LABELS["slider-puzzle"]).toBe("Slider Puzzle");
	});

	it("defines shared puzzle runtime constants", () => {
		expect(PUZZLE_SCORE_API_PATH).toBe("/api/puzzles/scores");
		expect(PUZZLE_TIMER_TICK_MS).toBe(250);
	});
});
