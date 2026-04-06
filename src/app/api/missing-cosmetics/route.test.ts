import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-auth", () => ({
	getServerSession: vi.fn(),
}));

vi.mock("../../../db", () => ({
	db: {
		select: vi.fn(),
	},
}));

import { getServerSession } from "next-auth";
import { db } from "../../../db";
import { GET } from "./route";

const mockedGetServerSession = vi.mocked(getServerSession);
const mockedDb = db as unknown as {
	select: ReturnType<typeof vi.fn>;
};

function queueWhereResults(...results: unknown[][]) {
	let call = 0;
	mockedDb.select.mockImplementation(() => {
		const chain = {
			from: vi.fn(),
			where: vi.fn(),
		};
		chain.from.mockReturnValue(chain);
		chain.where.mockResolvedValue(results[call] ?? []);
		call += 1;
		return chain;
	});
}

describe("missing cosmetics route", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.spyOn(console, "error").mockImplementation(() => {});
		mockedGetServerSession.mockResolvedValue({ user: { id: "u1" } } as never);
	});

	it("returns 401 for unauthenticated requests", async () => {
		mockedGetServerSession.mockResolvedValue(null);
		const response = await GET(
			new Request("http://localhost/api/missing-cosmetics?cosmeticId=1"),
		);
		expect(response.status).toBe(401);
	});

	it("returns 400 for invalid query", async () => {
		const response = await GET(
			new Request("http://localhost/api/missing-cosmetics?cosmeticId=-1"),
		);
		expect(response.status).toBe(400);
	});

	it("returns empty array when user has no accepted friends", async () => {
		queueWhereResults([]);
		const response = await GET(
			new Request("http://localhost/api/missing-cosmetics?cosmeticId=1"),
		);
		const payload = (await response.json()) as unknown[];
		expect(response.status).toBe(200);
		expect(payload).toEqual([]);
	});

	it("returns empty array when all friends already have cosmetic", async () => {
		queueWhereResults(
			[
				{ senderId: "u1", receiverId: "f1", status: "accepted" },
				{ senderId: "f2", receiverId: "u1", status: "accepted" },
			],
			[{ userId: "f1" }, { userId: "f2" }],
		);
		const response = await GET(
			new Request("http://localhost/api/missing-cosmetics?cosmeticId=1"),
		);
		const payload = (await response.json()) as unknown[];
		expect(response.status).toBe(200);
		expect(payload).toEqual([]);
	});

	it("returns friend details for missing cosmetics", async () => {
		queueWhereResults(
			[
				{ senderId: "u1", receiverId: "f1", status: "accepted" },
				{ senderId: "f2", receiverId: "u1", status: "accepted" },
			],
			[{ userId: "f2" }],
			[{ id: "f1", username: "friend-one", profilePictureId: "1" }],
		);
		const response = await GET(
			new Request("http://localhost/api/missing-cosmetics?cosmeticId=1"),
		);
		const payload = (await response.json()) as Array<{ id: string; username: string }>;
		expect(response.status).toBe(200);
		expect(payload).toHaveLength(1);
		expect(payload[0]?.id).toBe("f1");
	});
});
