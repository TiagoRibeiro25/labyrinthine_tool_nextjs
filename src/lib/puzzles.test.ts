import { describe, expect, it, vi } from "vitest";
import {
    currentTimeMs,
    formatDuration,
    getPuzzleLabel,
    isBetterPuzzleScore,
} from "./puzzles";

describe("puzzle utilities", () => {
	it("formats duration as mm:ss", () => {
		expect(formatDuration(0)).toBe("00:00");
		expect(formatDuration(59_000)).toBe("00:59");
		expect(formatDuration(61_000)).toBe("01:01");
		expect(formatDuration(3_726_000)).toBe("62:06");
	});

	it("returns known and fallback puzzle labels", () => {
		expect(getPuzzleLabel("lights-out")).toBe("Lights Out");
		expect(getPuzzleLabel("slider-puzzle")).toBe("Slider Puzzle");
		expect(getPuzzleLabel("unknown-puzzle")).toBe("Puzzle");
	});

	it("compares puzzle scores correctly", () => {
		expect(isBetterPuzzleScore(undefined, { moves: 12, durationMs: 9000 })).toBe(true);
		expect(
			isBetterPuzzleScore(
				{ moves: 12, durationMs: 9000 },
				{ moves: 11, durationMs: 9500 },
			),
		).toBe(true);
		expect(
			isBetterPuzzleScore(
				{ moves: 12, durationMs: 9000 },
				{ moves: 12, durationMs: 8500 },
			),
		).toBe(true);
		expect(
			isBetterPuzzleScore(
				{ moves: 12, durationMs: 9000 },
				{ moves: 12, durationMs: 9000 },
			),
		).toBe(false);
		expect(
			isBetterPuzzleScore(
				{ moves: 12, durationMs: 9000 },
				{ moves: 13, durationMs: 8000 },
			),
		).toBe(false);
	});

	it("returns current timestamp from Date.now", () => {
		const spy = vi.spyOn(Date, "now").mockReturnValue(123456);
		expect(currentTimeMs()).toBe(123456);
		spy.mockRestore();
	});
});
