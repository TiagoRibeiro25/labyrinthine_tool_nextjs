import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-auth", () => ({
	getServerSession: vi.fn(),
}));

vi.mock("../../../db", () => ({
	db: {
		select: vi.fn(),
	},
}));

vi.mock("../../../lib/social", () => ({
	getAcceptedFriendIds: vi.fn(),
}));

vi.mock("../../../lib/cosmetics", () => ({
	getCosmeticById: vi.fn(),
}));

import { getServerSession } from "next-auth";
import { db } from "../../../db";
import { getCosmeticById } from "../../../lib/cosmetics";
import { getAcceptedFriendIds } from "../../../lib/social";
import { GET } from "./route";

const mockedGetServerSession = vi.mocked(getServerSession);
const mockedGetAcceptedFriendIds = vi.mocked(getAcceptedFriendIds);
const mockedGetCosmeticById = vi.mocked(getCosmeticById);

const mockedDb = db as unknown as {
	select: ReturnType<typeof vi.fn>;
};

function baseSelectChain() {
	const chain = {
		from: vi.fn(),
		where: vi.fn(),
		innerJoin: vi.fn(),
		orderBy: vi.fn(),
		limit: vi.fn(),
		offset: vi.fn(),
	};
	chain.from.mockReturnValue(chain);
	return chain;
}

describe("activity route", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.spyOn(console, "error").mockImplementation(() => {});
		mockedGetServerSession.mockResolvedValue({ user: { id: "u1" } } as never);
	});

	it("returns 401 for unauthenticated requests", async () => {
		mockedGetServerSession.mockResolvedValue(null);
		const response = await GET(new Request("http://localhost/api/activity"));
		expect(response.status).toBe(401);
	});

	it("returns 400 for invalid query", async () => {
		const response = await GET(new Request("http://localhost/api/activity?page=0"));
		expect(response.status).toBe(400);
	});

	it("returns empty feed when user has no accepted friends", async () => {
		mockedGetAcceptedFriendIds.mockResolvedValue([]);

		const response = await GET(
			new Request("http://localhost/api/activity?page=1&limit=10"),
		);
		const payload = (await response.json()) as {
			data: unknown[];
			pagination: { totalItems: number; totalPages: number };
		};

		expect(response.status).toBe(200);
		expect(payload.data).toEqual([]);
		expect(payload.pagination.totalItems).toBe(0);
		expect(payload.pagination.totalPages).toBe(1);
	});

	it("returns mapped activity events and pagination", async () => {
		mockedGetAcceptedFriendIds.mockResolvedValue(["u2"]);
		mockedGetCosmeticById.mockReturnValue({
			id: 1,
			name: "St. Patrick's Hat",
			type: "Hat",
		});

		const totalChain = baseSelectChain();
		totalChain.where.mockResolvedValue([{ count: 1 }]);

		const rowsChain = baseSelectChain();
		rowsChain.innerJoin.mockReturnValue(rowsChain);
		rowsChain.where.mockReturnValue(rowsChain);
		rowsChain.orderBy.mockReturnValue(rowsChain);
		rowsChain.limit.mockReturnValue(rowsChain);
		rowsChain.offset.mockResolvedValue([
			{
				id: "a1",
				actorUserId: "u2",
				actorUsername: "friend",
				actorProfilePictureId: "2",
				eventType: "cosmetic_unlocked",
				cosmeticId: 1,
				puzzleType: null,
				scoreValue: null,
				metadata: null,
				createdAt: new Date(),
			},
		]);

		mockedDb.select
			.mockImplementationOnce(() => totalChain)
			.mockImplementationOnce(() => rowsChain);

		const response = await GET(
			new Request("http://localhost/api/activity?page=1&limit=10"),
		);
		const payload = (await response.json()) as {
			data: Array<{ title: string; description: string }>;
			pagination: { totalItems: number; page: number };
		};

		expect(response.status).toBe(200);
		expect(payload.data).toHaveLength(1);
		expect(payload.data[0]?.title).toBe("Unlocked a cosmetic");
		expect(payload.data[0]?.description).toContain("St. Patrick's Hat");
		expect(payload.pagination.totalItems).toBe(1);
		expect(payload.pagination.page).toBe(1);
	});

	it("returns 500 when underlying query fails", async () => {
		mockedGetAcceptedFriendIds.mockResolvedValue(["u2"]);
		const totalChain = baseSelectChain();
		totalChain.where.mockRejectedValue(new Error("db failure"));
		mockedDb.select.mockImplementationOnce(() => totalChain);

		const response = await GET(
			new Request("http://localhost/api/activity?page=1&limit=10"),
		);
		expect(response.status).toBe(500);
	});
});
