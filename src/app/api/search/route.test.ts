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

describe("search route", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.spyOn(console, "error").mockImplementation(() => {});
	});

	it("returns validation error when query is missing", async () => {
		const response = await GET(new Request("http://localhost/api/search?q="));
		expect(response.status).toBe(400);
		expect(mockedDb.select).not.toHaveBeenCalled();
	});

	it("returns matching users", async () => {
		const chain = {
			from: vi.fn(),
			where: vi.fn(),
			limit: vi.fn(),
		};
		chain.from.mockReturnValue(chain);
		chain.where.mockReturnValue(chain);
		chain.limit.mockResolvedValue([
			{ id: "u1", username: "alpha", profilePictureId: "1", isAdministrator: false },
		]);
		mockedDb.select.mockReturnValue(chain);

		const response = await GET(new Request("http://localhost/api/search?q=alp"));
		const payload = (await response.json()) as Array<{ id: string; username: string }>;

		expect(response.status).toBe(200);
		expect(payload).toHaveLength(1);
		expect(payload[0]?.username).toBe("alpha");
	});

	it("returns 500 when db fails", async () => {
		const chain = {
			from: vi.fn(),
			where: vi.fn(),
			limit: vi.fn(),
		};
		chain.from.mockReturnValue(chain);
		chain.where.mockReturnValue(chain);
		chain.limit.mockRejectedValue(new Error("db fail"));
		mockedDb.select.mockReturnValue(chain);

		const response = await GET(new Request("http://localhost/api/search?q=alpha"));
		expect(response.status).toBe(500);
	});
});
