import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-auth", () => ({
	getServerSession: vi.fn(),
}));

vi.mock("../../../db", () => ({
	db: {
		update: vi.fn(),
	},
}));

import { getServerSession } from "next-auth";
import { db } from "../../../db";
import { PUT } from "./route";

const mockedGetServerSession = vi.mocked(getServerSession);
const mockedDb = db as unknown as {
	update: ReturnType<typeof vi.fn>;
};

describe("profile route", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.spyOn(console, "error").mockImplementation(() => {});
	});

	it("returns unauthorized when user is not authenticated", async () => {
		mockedGetServerSession.mockResolvedValue(null);

		const response = await PUT(
			new Request("http://localhost/api/profile", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ bio: "x" }),
			})
		);

		expect(response.status).toBe(401);
	});

	it("returns bad request for invalid json", async () => {
		mockedGetServerSession.mockResolvedValue({ user: { id: "u1" } } as never);
		const response = await PUT(
			new Request("http://localhost/api/profile", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: "{bad-json",
			})
		);

		expect(response.status).toBe(400);
	});

	it("returns validation error for invalid body", async () => {
		mockedGetServerSession.mockResolvedValue({ user: { id: "u1" } } as never);
		const response = await PUT(
			new Request("http://localhost/api/profile", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ steamProfileUrl: "https://not-steam" }),
			})
		);

		expect(response.status).toBe(400);
	});

	it("updates profile and returns success", async () => {
		mockedGetServerSession.mockResolvedValue({ user: { id: "u1" } } as never);
		const chain = {
			set: vi.fn(),
			where: vi.fn(),
		};
		chain.set.mockReturnValue(chain);
		chain.where.mockResolvedValue(undefined);
		mockedDb.update.mockReturnValue(chain);

		const response = await PUT(
			new Request("http://localhost/api/profile", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					bio: "  bio text  ",
					discordUsername: "  user#1234  ",
					steamProfileUrl: "https://steamcommunity.com/id/test-user/",
					profilePictureId: "1",
					profileBannerId: "chap1",
					favoriteCosmeticId: 12,
				}),
			})
		);
		const payload = (await response.json()) as { message: string };

		expect(response.status).toBe(200);
		expect(payload.message).toContain("updated");
		expect(mockedDb.update).toHaveBeenCalledTimes(1);
		expect(chain.set).toHaveBeenCalledWith(
			expect.objectContaining({
				bio: "bio text",
				discordUsername: "user#1234",
				steamProfileUrl: "https://steamcommunity.com/id/test-user/",
				profilePictureId: "1",
				profileBannerId: "chap1",
				favoriteCosmeticId: 12,
			})
		);
	});

	it("returns 500 on db failure", async () => {
		mockedGetServerSession.mockResolvedValue({ user: { id: "u1" } } as never);
		const chain = {
			set: vi.fn(),
			where: vi.fn(),
		};
		chain.set.mockReturnValue(chain);
		chain.where.mockRejectedValue(new Error("db fail"));
		mockedDb.update.mockReturnValue(chain);

		const response = await PUT(
			new Request("http://localhost/api/profile", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ bio: "ok" }),
			})
		);

		expect(response.status).toBe(500);
	});
});
