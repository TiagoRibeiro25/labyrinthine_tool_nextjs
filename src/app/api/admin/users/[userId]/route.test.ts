import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-auth", () => ({
	getServerSession: vi.fn(),
}));

vi.mock("../../../../../db", () => ({
	db: {
		select: vi.fn(),
		delete: vi.fn(),
	},
}));

import { getServerSession } from "next-auth";
import { db } from "../../../../../db";
import { DELETE } from "./route";

const mockedGetServerSession = vi.mocked(getServerSession);
const mockedDb = db as unknown as {
	select: ReturnType<typeof vi.fn>;
	delete: ReturnType<typeof vi.fn>;
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

describe("admin delete user route", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.spyOn(console, "error").mockImplementation(() => {});
		mockedGetServerSession.mockResolvedValue({
			user: { id: "11111111-1111-4111-8111-111111111111" },
		} as never);
	});

	it("returns 401 for unauthenticated requests", async () => {
		mockedGetServerSession.mockResolvedValue(null);

		const response = await DELETE(
			new Request(
				"http://localhost/api/admin/users/22222222-2222-4222-8222-222222222222",
				{
					method: "DELETE",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ confirmationUsername: "player" }),
				}
			),
			{ params: Promise.resolve({ userId: "22222222-2222-4222-8222-222222222222" }) }
		);

		expect(response.status).toBe(401);
	});

	it("returns 403 for non-admin users", async () => {
		const userChain = buildSelectChain();
		userChain.limit.mockResolvedValue([
			{ id: "11111111-1111-4111-8111-111111111111", isAdministrator: false },
		]);
		mockedDb.select.mockReturnValue(userChain);

		const response = await DELETE(
			new Request(
				"http://localhost/api/admin/users/22222222-2222-4222-8222-222222222222",
				{
					method: "DELETE",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ confirmationUsername: "player" }),
				}
			),
			{ params: Promise.resolve({ userId: "22222222-2222-4222-8222-222222222222" }) }
		);

		expect(response.status).toBe(403);
	});

	it("prevents admins from deleting themselves", async () => {
		const adminChain = buildSelectChain();
		adminChain.limit.mockResolvedValue([
			{ id: "11111111-1111-4111-8111-111111111111", isAdministrator: true },
		]);
		mockedDb.select.mockReturnValue(adminChain);

		const response = await DELETE(
			new Request(
				"http://localhost/api/admin/users/11111111-1111-4111-8111-111111111111",
				{
					method: "DELETE",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ confirmationUsername: "admin" }),
				}
			),
			{ params: Promise.resolve({ userId: "11111111-1111-4111-8111-111111111111" }) }
		);

		expect(response.status).toBe(400);
	});

	it("deletes a non-admin user when confirmation matches", async () => {
		const adminChain = buildSelectChain();
		adminChain.limit.mockResolvedValue([
			{ id: "11111111-1111-4111-8111-111111111111", isAdministrator: true },
		]);

		const targetChain = buildSelectChain();
		targetChain.limit.mockResolvedValue([
			{
				id: "22222222-2222-4222-8222-222222222222",
				username: "player",
				isAdministrator: false,
			},
		]);

		const deleteWhere = vi.fn().mockResolvedValue(undefined);

		mockedDb.select
			.mockImplementationOnce(() => adminChain)
			.mockImplementationOnce(() => targetChain);
		mockedDb.delete.mockReturnValue({ where: deleteWhere });

		const response = await DELETE(
			new Request(
				"http://localhost/api/admin/users/22222222-2222-4222-8222-222222222222",
				{
					method: "DELETE",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ confirmationUsername: "player" }),
				}
			),
			{ params: Promise.resolve({ userId: "22222222-2222-4222-8222-222222222222" }) }
		);

		expect(response.status).toBe(200);
		expect(deleteWhere).toHaveBeenCalledTimes(1);
	});
});
