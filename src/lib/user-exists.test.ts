import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../db", () => ({
	db: {
		select: vi.fn(),
	},
}));

import { db } from "../db";
import { userExistsById } from "./user-exists";

const mockedDb = db as unknown as {
	select: ReturnType<typeof vi.fn>;
};

function buildSelectChain() {
	const chain = {
		from: vi.fn(),
		where: vi.fn(),
		limit: vi.fn(),
	};
	chain.from.mockReturnValue(chain);
	chain.where.mockReturnValue(chain);
	return chain;
}

describe("userExistsById", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns true when a user row exists", async () => {
		const chain = buildSelectChain();
		chain.limit.mockResolvedValue([{ id: "user-1" }]);
		mockedDb.select.mockReturnValue(chain);

		await expect(userExistsById("user-1")).resolves.toBe(true);
	});

	it("returns false when no user row exists", async () => {
		const chain = buildSelectChain();
		chain.limit.mockResolvedValue([]);
		mockedDb.select.mockReturnValue(chain);

		await expect(userExistsById("missing-user")).resolves.toBe(false);
	});
});
