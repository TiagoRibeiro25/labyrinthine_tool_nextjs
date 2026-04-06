import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("bcryptjs", () => ({
	default: {
		hash: vi.fn(),
	},
}));

vi.mock("../../../db", () => ({
	db: {
		select: vi.fn(),
		insert: vi.fn(),
	},
}));

vi.mock("../../../lib/request", () => ({
	getClientIpFromHeaders: vi.fn(),
}));

vi.mock("../../../lib/rate-limit", () => ({
	rateLimit: vi.fn(),
	toRateLimitHeaders: vi.fn(() => ({ "X-RateLimit-Limit": "6" })),
}));

import bcrypt from "bcryptjs";
import { db } from "../../../db";
import { rateLimit } from "../../../lib/rate-limit";
import { getClientIpFromHeaders } from "../../../lib/request";
import { POST } from "./route";

const mockedBcrypt = vi.mocked(bcrypt);
const mockedRateLimit = vi.mocked(rateLimit);
const mockedGetClientIp = vi.mocked(getClientIpFromHeaders);

const mockedDb = db as unknown as {
	select: ReturnType<typeof vi.fn>;
	insert: ReturnType<typeof vi.fn>;
};

function buildRequest(body: unknown) {
	return new Request("http://localhost/api/register", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});
}

describe("register route", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.spyOn(console, "error").mockImplementation(() => {});
		mockedRateLimit.mockReset();
		mockedGetClientIp.mockReset();
		mockedBcrypt.hash.mockReset();
		mockedGetClientIp.mockReturnValue("1.1.1.1");
		mockedBcrypt.hash.mockResolvedValue("hashed-password" as never);
		mockedRateLimit.mockReturnValue({
			success: true,
			limit: 6,
			remaining: 5,
			resetAt: 10,
			retryAfterMs: 0,
		});
	});

	it("returns 429 when ip rate limit is exceeded", async () => {
		mockedRateLimit.mockReturnValueOnce({
			success: false,
			limit: 6,
			remaining: 0,
			resetAt: 10,
			retryAfterMs: 1000,
		});

		const response = await POST(buildRequest({ username: "alpha", password: "hunter2" }));
		expect(response.status).toBe(429);
		expect(mockedDb.select).not.toHaveBeenCalled();
	});

	it("returns 400 for invalid json", async () => {
		const response = await POST(
			new Request("http://localhost/api/register", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: "{bad-json",
			}),
		);
		expect(response.status).toBe(400);
	});

	it("returns 400 for schema validation failure", async () => {
		const response = await POST(buildRequest({ username: "ab", password: "123" }));
		expect(response.status).toBe(400);
	});

	it("returns 429 when username rate limit is exceeded", async () => {
		mockedRateLimit.mockImplementation((options) => {
			if (options.key.includes("auth:register:username:")) {
				return {
					success: false,
					limit: 4,
					remaining: 0,
					resetAt: 10,
					retryAfterMs: 2000,
				};
			}

			return {
				success: true,
				limit: 6,
				remaining: 5,
				resetAt: 10,
				retryAfterMs: 0,
			};
		});

		const response = await POST(buildRequest({ username: "alpha", password: "hunter2" }));
		expect(response.status).toBe(429);
	});

	it("returns 409 when username already exists", async () => {
		mockedRateLimit.mockImplementation((options) => {
			if (options.key.includes("auth:register:username:")) {
				return {
					success: true,
					limit: 4,
					remaining: 3,
					resetAt: 10,
					retryAfterMs: 0,
				};
			}

			return {
				success: true,
				limit: 6,
				remaining: 5,
				resetAt: 10,
				retryAfterMs: 0,
			};
		});

		const selectChain = { from: vi.fn(), where: vi.fn(), limit: vi.fn() };
		selectChain.from.mockReturnValue(selectChain);
		selectChain.where.mockReturnValue(selectChain);
		selectChain.limit.mockResolvedValue([{ id: "u1", username: "alpha" }]);
		mockedDb.select.mockReturnValue(selectChain);

		const response = await POST(buildRequest({ username: "alpha", password: "hunter2" }));
		expect(response.status).toBe(409);
		expect(mockedDb.insert).not.toHaveBeenCalled();
	});

	it("creates a user and returns 201", async () => {
		const selectChain = { from: vi.fn(), where: vi.fn(), limit: vi.fn() };
		selectChain.from.mockReturnValue(selectChain);
		selectChain.where.mockReturnValue(selectChain);
		selectChain.limit.mockResolvedValue([]);
		mockedDb.select.mockReturnValue(selectChain);

		const insertValues = vi.fn().mockResolvedValue(undefined);
		mockedDb.insert.mockReturnValue({ values: insertValues });

		const response = await POST(buildRequest({ username: "alpha", password: "hunter2" }));
		expect(response.status).toBe(201);
		expect(mockedBcrypt.hash).toHaveBeenCalledWith("hunter2", 10);
		expect(insertValues).toHaveBeenCalledWith(
			expect.objectContaining({
				username: "alpha",
				password: "hashed-password",
				profilePictureId: "1",
				profileBannerId: "chap1",
			}),
		);
	});

	it("returns 500 on unexpected errors", async () => {
		mockedDb.select.mockImplementation(() => {
			throw new Error("db crashed");
		});

		const response = await POST(buildRequest({ username: "alpha", password: "hunter2" }));
		expect(response.status).toBe(500);
	});
});
