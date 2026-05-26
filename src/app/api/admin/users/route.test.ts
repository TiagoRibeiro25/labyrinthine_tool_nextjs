import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-auth", () => ({
	getServerSession: vi.fn(),
}));

vi.mock("../../../../db", () => ({
	db: {
		select: vi.fn(),
	},
}));

import { getServerSession } from "next-auth";
import { ADMIN_USERS_LIST_LIMIT } from "../../../../constants/admin";
import { db } from "../../../../db";
import { GET } from "./route";

const mockedGetServerSession = vi.mocked(getServerSession);
const mockedDb = db as unknown as {
	select: ReturnType<typeof vi.fn>;
};

function buildSelectChain() {
	const chain = {
		from: vi.fn(),
		where: vi.fn(),
		orderBy: vi.fn(),
		limit: vi.fn(),
	};
	chain.from.mockReturnValue(chain);
	chain.where.mockReturnValue(chain);
	chain.orderBy.mockReturnValue(chain);
	return chain;
}

describe("admin users list route", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.spyOn(console, "error").mockImplementation(() => {});
		mockedGetServerSession.mockResolvedValue({
			user: { id: "11111111-1111-4111-8111-111111111111" },
		} as never);
	});

	it("returns 401 for unauthenticated requests", async () => {
		mockedGetServerSession.mockResolvedValue(null);

		const response = await GET(new Request("http://localhost/api/admin/users"));

		expect(response.status).toBe(401);
	});

	it("returns recent users when no search query is provided", async () => {
		const adminChain = buildSelectChain();
		adminChain.limit.mockResolvedValue([
			{ id: "11111111-1111-4111-8111-111111111111", isAdministrator: true },
		]);

		const usersChain = buildSelectChain();
		usersChain.limit.mockResolvedValue([
			{
				id: "22222222-2222-4222-8222-222222222222",
				username: "player",
				isAdministrator: false,
				createdViaDiscord: false,
				createdAt: new Date("2026-01-01T00:00:00.000Z"),
			},
		]);

		mockedDb.select
			.mockImplementationOnce(() => adminChain)
			.mockImplementationOnce(() => usersChain);

		const response = await GET(new Request("http://localhost/api/admin/users"));
		const payload = (await response.json()) as Array<{ username: string }>;

		expect(response.status).toBe(200);
		expect(payload).toHaveLength(1);
		expect(payload[0]?.username).toBe("player");
		expect(usersChain.limit).toHaveBeenCalledWith(ADMIN_USERS_LIST_LIMIT);
	});
});
