import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("bcryptjs", () => ({
	default: {
		hash: vi.fn().mockResolvedValue("hashed-password"),
	},
}));

vi.mock("next-auth", () => ({
	getServerSession: vi.fn(),
}));

vi.mock("../../../../../../db", () => ({
	db: {
		select: vi.fn(),
		update: vi.fn(),
	},
}));

import { getServerSession } from "next-auth";
import { db } from "../../../../../../db";
import { PATCH } from "./route";

const mockedGetServerSession = vi.mocked(getServerSession);
const mockedDb = db as unknown as {
	select: ReturnType<typeof vi.fn>;
	update: ReturnType<typeof vi.fn>;
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

describe("admin change password route", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.spyOn(console, "error").mockImplementation(() => {});
		mockedGetServerSession.mockResolvedValue({
			user: { id: "11111111-1111-4111-8111-111111111111" },
		} as never);
	});

	it("returns 401 for unauthenticated requests", async () => {
		mockedGetServerSession.mockResolvedValue(null);

		const response = await PATCH(
			new Request(
				"http://localhost/api/admin/users/22222222-2222-4222-8222-222222222222/password",
				{
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ password: "new-password" }),
				}
			),
			{ params: Promise.resolve({ userId: "22222222-2222-4222-8222-222222222222" }) }
		);

		expect(response.status).toBe(401);
	});

	it("updates password for an existing user", async () => {
		const adminChain = buildSelectChain();
		adminChain.limit.mockResolvedValue([
			{ id: "11111111-1111-4111-8111-111111111111", isAdministrator: true },
		]);

		const targetChain = buildSelectChain();
		targetChain.limit.mockResolvedValue([
			{
				id: "22222222-2222-4222-8222-222222222222",
				username: "player",
				createdViaDiscord: false,
			},
		]);

		const updateWhere = vi.fn().mockResolvedValue(undefined);
		const updateSet = vi.fn().mockReturnValue({ where: updateWhere });

		mockedDb.select
			.mockImplementationOnce(() => adminChain)
			.mockImplementationOnce(() => targetChain);
		mockedDb.update.mockReturnValue({ set: updateSet });

		const response = await PATCH(
			new Request(
				"http://localhost/api/admin/users/22222222-2222-4222-8222-222222222222/password",
				{
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ password: "new-password" }),
				}
			),
			{ params: Promise.resolve({ userId: "22222222-2222-4222-8222-222222222222" }) }
		);

		expect(response.status).toBe(200);
		expect(updateSet).toHaveBeenCalledTimes(1);
		expect(updateWhere).toHaveBeenCalledTimes(1);
	});

	it("rejects password changes for Discord-created accounts", async () => {
		const adminChain = buildSelectChain();
		adminChain.limit.mockResolvedValue([
			{ id: "11111111-1111-4111-8111-111111111111", isAdministrator: true },
		]);

		const targetChain = buildSelectChain();
		targetChain.limit.mockResolvedValue([
			{
				id: "22222222-2222-4222-8222-222222222222",
				username: "player",
				createdViaDiscord: true,
			},
		]);

		mockedDb.select
			.mockImplementationOnce(() => adminChain)
			.mockImplementationOnce(() => targetChain);

		const response = await PATCH(
			new Request(
				"http://localhost/api/admin/users/22222222-2222-4222-8222-222222222222/password",
				{
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ password: "new-password" }),
				}
			),
			{ params: Promise.resolve({ userId: "22222222-2222-4222-8222-222222222222" }) }
		);

		expect(response.status).toBe(400);
		expect(mockedDb.update).not.toHaveBeenCalled();
	});
});
