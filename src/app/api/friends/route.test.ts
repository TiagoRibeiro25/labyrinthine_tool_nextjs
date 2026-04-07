import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-auth", () => ({
	getServerSession: vi.fn(),
}));

vi.mock("../../../db", () => ({
	db: {
		select: vi.fn(),
		insert: vi.fn(),
		update: vi.fn(),
		delete: vi.fn(),
	},
}));

vi.mock("../../../lib/rate-limit", () => ({
	rateLimit: vi.fn(),
	toRateLimitHeaders: vi.fn(() => ({ "X-RateLimit-Limit": "1" })),
}));

vi.mock("../../../lib/request", () => ({
	getClientIpFromHeaders: vi.fn(() => "1.1.1.1"),
}));

vi.mock("../../../lib/social", () => ({
	createNotifications: vi.fn(),
}));

import { getServerSession } from "next-auth";
import { db } from "../../../db";
import { rateLimit } from "../../../lib/rate-limit";
import { createNotifications } from "../../../lib/social";
import { POST } from "./route";

const mockedGetServerSession = vi.mocked(getServerSession);
const mockedRateLimit = vi.mocked(rateLimit);
const mockedCreateNotifications = vi.mocked(createNotifications);

const mockedDb = db as unknown as {
	select: ReturnType<typeof vi.fn>;
	insert: ReturnType<typeof vi.fn>;
	update: ReturnType<typeof vi.fn>;
	delete: ReturnType<typeof vi.fn>;
};

function selectChain(rows: unknown[]) {
	const chain = {
		from: vi.fn(),
		where: vi.fn(),
		limit: vi.fn(),
	};
	chain.from.mockReturnValue(chain);
	chain.where.mockReturnValue(chain);
	chain.limit.mockResolvedValue(rows);
	return chain;
}

function queueSelectResults(...rowsBySelectCall: unknown[][]) {
	let callIndex = 0;
	mockedDb.select.mockImplementation(() => {
		const rows = rowsBySelectCall[callIndex] ?? [];
		callIndex += 1;
		return selectChain(rows);
	});
}

function requestWithBody(body: unknown) {
	return new Request("http://localhost/api/friends", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});
}

describe("friends route", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.spyOn(console, "error").mockImplementation(() => {});
		mockedGetServerSession.mockResolvedValue({ user: { id: "u1" } } as never);
		mockedRateLimit.mockReturnValue({
			success: true,
			limit: 100,
			remaining: 99,
			resetAt: 10,
			retryAfterMs: 0,
		});
		mockedCreateNotifications.mockResolvedValue(undefined);
	});

	it("returns 401 when unauthenticated", async () => {
		mockedGetServerSession.mockResolvedValue(null);
		const response = await POST(
			requestWithBody({ action: "add", receiverUsername: "x" })
		);
		expect(response.status).toBe(401);
	});

	it("returns 429 when user-level rate limit is exceeded", async () => {
		queueSelectResults([{ username: "me" }]);
		mockedRateLimit.mockImplementation((input) => {
			if (input.key.startsWith("friends:user:")) {
				return {
					success: false,
					limit: 80,
					remaining: 0,
					resetAt: 10,
					retryAfterMs: 1000,
				};
			}
			return {
				success: true,
				limit: 80,
				remaining: 79,
				resetAt: 10,
				retryAfterMs: 0,
			};
		});

		const response = await POST(
			requestWithBody({ action: "add", receiverUsername: "x" })
		);
		expect(response.status).toBe(429);
	});

	it("returns 400 when adding self", async () => {
		queueSelectResults([{ username: "me" }], [{ id: "u1", username: "me" }]);

		const response = await POST(
			requestWithBody({ action: "add", receiverUsername: "me" })
		);
		expect(response.status).toBe(400);
	});

	it("sends friend request and notification on add success", async () => {
		queueSelectResults([{ username: "me" }], [{ id: "u2", username: "friend" }], []);
		const insertValues = vi.fn().mockResolvedValue(undefined);
		mockedDb.insert.mockReturnValue({ values: insertValues });

		const response = await POST(
			requestWithBody({ action: "add", receiverUsername: "friend" })
		);
		const payload = (await response.json()) as { message: string };

		expect(response.status).toBe(200);
		expect(payload.message).toContain("sent");
		expect(insertValues).toHaveBeenCalledWith(
			expect.objectContaining({
				senderId: "u1",
				receiverId: "u2",
				status: "pending",
			})
		);
		expect(mockedCreateNotifications).toHaveBeenCalledTimes(1);
	});

	it("accepts friend request and notifies sender", async () => {
		queueSelectResults(
			[{ username: "receiver" }],
			[{ id: "req1", senderId: "u2", receiverId: "u1", status: "pending" }]
		);
		const where = vi.fn().mockResolvedValue(undefined);
		const set = vi.fn().mockReturnValue({ where });
		mockedDb.update.mockReturnValue({ set });

		const response = await POST(
			requestWithBody({
				action: "accept",
				requestId: "11111111-1111-1111-1111-111111111111",
			})
		);

		expect(response.status).toBe(200);
		expect(set).toHaveBeenCalledWith({ status: "accepted" });
		expect(mockedCreateNotifications).toHaveBeenCalledTimes(1);
	});

	it("returns 404 when remove by username cannot find receiver", async () => {
		queueSelectResults([{ username: "me" }], []);

		const response = await POST(
			requestWithBody({ action: "remove", receiverUsername: "ghost" })
		);
		expect(response.status).toBe(404);
	});
});
