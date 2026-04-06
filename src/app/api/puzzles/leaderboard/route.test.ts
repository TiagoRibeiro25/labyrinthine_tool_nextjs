import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../db", () => ({
	db: {
		execute: vi.fn(),
	},
}));

import { db } from "../../../../db";
import { GET } from "./route";

const mockedDb = db as unknown as {
	execute: ReturnType<typeof vi.fn>;
};

describe("puzzle leaderboard route", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.spyOn(console, "error").mockImplementation(() => {});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("returns validation error for invalid query", async () => {
		const response = await GET(
			new Request("http://localhost/api/puzzles/leaderboard?puzzleType=bad"),
		);

		expect(response.status).toBe(400);
		expect(mockedDb.execute).not.toHaveBeenCalled();
	});

	it("returns paginated leaderboard data", async () => {
		mockedDb.execute.mockResolvedValueOnce([{ count: 2 }]).mockResolvedValueOnce([
			{
				id: "u1",
				username: "alpha",
				profilePictureId: "1",
				moves: 8,
				durationMs: 14000,
				rank: 1,
			},
			{
				id: "u2",
				username: "beta",
				profilePictureId: null,
				moves: 9,
				durationMs: 16000,
				rank: 2,
			},
		]);

		const response = await GET(
			new Request(
				"http://localhost/api/puzzles/leaderboard?puzzleType=lights-out&page=1&limit=20",
			),
		);
		const payload = (await response.json()) as {
			data: Array<{ id: string; rank: number }>;
			pagination: { totalItems: number; totalPages: number; page: number };
		};

		expect(response.status).toBe(200);
		expect(payload.data).toHaveLength(2);
		expect(payload.data[0]?.id).toBe("u1");
		expect(payload.data[0]?.rank).toBe(1);
		expect(payload.pagination.totalItems).toBe(2);
		expect(payload.pagination.totalPages).toBe(1);
		expect(payload.pagination.page).toBe(1);
		expect(mockedDb.execute).toHaveBeenCalledTimes(2);
	});

	it("returns internal server error when query fails", async () => {
		mockedDb.execute.mockRejectedValueOnce(new Error("db exploded"));

		const response = await GET(
			new Request("http://localhost/api/puzzles/leaderboard?puzzleType=lights-out"),
		);
		const payload = (await response.json()) as { message: string };

		expect(response.status).toBe(500);
		expect(payload.message).toContain("internal server error");
	});
});
