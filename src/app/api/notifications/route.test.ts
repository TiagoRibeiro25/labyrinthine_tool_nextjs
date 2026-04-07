import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-auth", () => ({
	getServerSession: vi.fn(),
}));

vi.mock("../../../db", () => ({
	db: {
		select: vi.fn(),
		update: vi.fn(),
	},
}));

import { getServerSession } from "next-auth";
import { db } from "../../../db";
import { GET, PATCH } from "./route";

const mockedGetServerSession = vi.mocked(getServerSession);
const mockedDb = db as unknown as {
	select: ReturnType<typeof vi.fn>;
	update: ReturnType<typeof vi.fn>;
};

function baseSelectChain() {
	const chain = {
		from: vi.fn(),
		where: vi.fn(),
		orderBy: vi.fn(),
		limit: vi.fn(),
		offset: vi.fn(),
	};
	chain.from.mockReturnValue(chain);
	return chain;
}

describe("notifications route", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.spyOn(console, "error").mockImplementation(() => {});
		mockedGetServerSession.mockResolvedValue({ user: { id: "u1" } } as never);
	});

	it("GET returns 401 for unauthenticated requests", async () => {
		mockedGetServerSession.mockResolvedValue(null);
		const response = await GET(new Request("http://localhost/api/notifications"));
		expect(response.status).toBe(401);
	});

	it("GET returns 400 for invalid query", async () => {
		const response = await GET(new Request("http://localhost/api/notifications?page=0"));
		expect(response.status).toBe(400);
	});

	it("GET returns mapped notifications and pagination", async () => {
		const totalChain = baseSelectChain();
		totalChain.where.mockResolvedValue([{ count: 2 }]);

		const rowsChain = baseSelectChain();
		rowsChain.where.mockReturnValue(rowsChain);
		rowsChain.orderBy.mockReturnValue(rowsChain);
		rowsChain.limit.mockReturnValue(rowsChain);
		rowsChain.offset.mockResolvedValue([
			{
				id: "n1",
				type: "friend_request",
				title: "New request",
				message: "x",
				href: "/friends",
				isRead: false,
				createdAt: new Date(),
				actorUserId: "u2",
			},
		]);

		const usersChain = baseSelectChain();
		usersChain.where.mockResolvedValue([
			{ id: "u1", username: "me", profilePictureId: "1" },
			{ id: "u2", username: "friend", profilePictureId: "2" },
		]);

		const unreadChain = baseSelectChain();
		unreadChain.where.mockResolvedValue([{ count: 1 }]);

		mockedDb.select
			.mockImplementationOnce(() => totalChain)
			.mockImplementationOnce(() => rowsChain)
			.mockImplementationOnce(() => usersChain)
			.mockImplementationOnce(() => unreadChain);

		const response = await GET(
			new Request("http://localhost/api/notifications?page=1&limit=10")
		);
		const payload = (await response.json()) as {
			data: Array<{ actor: { username: string } | null }>;
			unreadCount: number;
			pagination: { totalItems: number; page: number };
		};

		expect(response.status).toBe(200);
		expect(payload.data).toHaveLength(1);
		expect(payload.data[0]?.actor?.username).toBe("friend");
		expect(payload.unreadCount).toBe(1);
		expect(payload.pagination.totalItems).toBe(2);
		expect(payload.pagination.page).toBe(1);
	});

	it("PATCH returns 401 when unauthenticated", async () => {
		mockedGetServerSession.mockResolvedValue(null);
		const response = await PATCH(
			new Request("http://localhost/api/notifications", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ markAll: true }),
			})
		);
		expect(response.status).toBe(401);
	});

	it("PATCH marks all notifications as read", async () => {
		const where = vi.fn().mockResolvedValue(undefined);
		const set = vi.fn().mockReturnValue({ where });
		mockedDb.update.mockReturnValue({ set });

		const response = await PATCH(
			new Request("http://localhost/api/notifications", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ markAll: true }),
			})
		);
		expect(response.status).toBe(200);
		expect(set).toHaveBeenCalled();
	});

	it("PATCH marks a single notification as read", async () => {
		const where = vi.fn().mockResolvedValue(undefined);
		const set = vi.fn().mockReturnValue({ where });
		mockedDb.update.mockReturnValue({ set });

		const response = await PATCH(
			new Request("http://localhost/api/notifications", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ notificationId: "11111111-1111-1111-1111-111111111111" }),
			})
		);
		expect(response.status).toBe(200);
		expect(set).toHaveBeenCalled();
	});
});
