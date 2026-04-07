import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../db", () => ({
	db: {
		select: vi.fn(),
	},
}));

import { db } from "../../../db";
import { GET } from "./route";

const mockedDb = db as unknown as {
	select: ReturnType<typeof vi.fn>;
};

describe("leaderboard route", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.spyOn(console, "error").mockImplementation(() => {});
	});

	it("returns 400 for invalid pagination query", async () => {
		const response = await GET(new Request("http://localhost/api/leaderboard?page=0"));
		expect(response.status).toBe(400);
		expect(mockedDb.select).not.toHaveBeenCalled();
	});

	it("returns paginated leaderboard data", async () => {
		const totalFrom = vi.fn().mockResolvedValue([{ count: 2 }]);
		const totalChain = { from: totalFrom };

		const rowsChain = {
			from: vi.fn(),
			leftJoin: vi.fn(),
			groupBy: vi.fn(),
			orderBy: vi.fn(),
			limit: vi.fn(),
			offset: vi.fn(),
		};
		rowsChain.from.mockReturnValue(rowsChain);
		rowsChain.leftJoin.mockReturnValue(rowsChain);
		rowsChain.groupBy.mockReturnValue(rowsChain);
		rowsChain.orderBy.mockReturnValue(rowsChain);
		rowsChain.limit.mockReturnValue(rowsChain);
		rowsChain.offset.mockResolvedValue([
			{ id: "u1", username: "alpha", profilePictureId: "1", cosmeticsCount: 100 },
			{ id: "u2", username: "beta", profilePictureId: null, cosmeticsCount: 50 },
		]);

		mockedDb.select
			.mockImplementationOnce(() => totalChain)
			.mockImplementationOnce(() => rowsChain);

		const response = await GET(
			new Request("http://localhost/api/leaderboard?page=1&limit=20")
		);
		const payload = (await response.json()) as {
			data: Array<{ id: string }>;
			pagination: { totalItems: number; totalPages: number; page: number };
		};

		expect(response.status).toBe(200);
		expect(payload.data).toHaveLength(2);
		expect(payload.pagination.totalItems).toBe(2);
		expect(payload.pagination.totalPages).toBe(1);
		expect(payload.pagination.page).toBe(1);
	});

	it("returns 500 when query fails", async () => {
		const totalFrom = vi.fn().mockRejectedValue(new Error("db fail"));
		const totalChain = { from: totalFrom };
		mockedDb.select.mockImplementationOnce(() => totalChain);

		const response = await GET(
			new Request("http://localhost/api/leaderboard?page=1&limit=20")
		);
		expect(response.status).toBe(500);
	});
});
