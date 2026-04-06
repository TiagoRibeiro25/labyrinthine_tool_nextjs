import { beforeEach, describe, expect, it } from "vitest";
import { clearExpiredRateLimits, rateLimit, toRateLimitHeaders } from "./rate-limit";

declare global {
	var __labyrinthineRateLimitStore:
		| Map<string, { count: number; resetAt: number }>
		| undefined;
}

describe("rate limit", () => {
	beforeEach(() => {
		globalThis.__labyrinthineRateLimitStore = undefined;
	});

	it("rejects invalid limiter options", () => {
		const result = rateLimit({ key: "", limit: 0, windowMs: 0, now: 1000 });
		expect(result.success).toBe(false);
		expect(result.limit).toBe(0);
		expect(result.remaining).toBe(0);
		expect(result.resetAt).toBe(1000);
	});

	it("allows requests until limit and then blocks", () => {
		const first = rateLimit({ key: "ip:1", limit: 2, windowMs: 1000, now: 1000 });
		const second = rateLimit({ key: "ip:1", limit: 2, windowMs: 1000, now: 1100 });
		const third = rateLimit({ key: "ip:1", limit: 2, windowMs: 1000, now: 1200 });

		expect(first.success).toBe(true);
		expect(first.remaining).toBe(1);
		expect(second.success).toBe(true);
		expect(second.remaining).toBe(0);
		expect(third.success).toBe(false);
		expect(third.retryAfterMs).toBe(800);
	});

	it("resets bucket after window expires", () => {
		rateLimit({ key: "ip:2", limit: 1, windowMs: 1000, now: 1000 });
		const blocked = rateLimit({ key: "ip:2", limit: 1, windowMs: 1000, now: 1500 });
		const reset = rateLimit({ key: "ip:2", limit: 1, windowMs: 1000, now: 2000 });

		expect(blocked.success).toBe(false);
		expect(reset.success).toBe(true);
		expect(reset.remaining).toBe(0);
	});

	it("clears expired buckets", () => {
		rateLimit({ key: "a", limit: 1, windowMs: 100, now: 0 });
		rateLimit({ key: "b", limit: 1, windowMs: 1000, now: 0 });

		const removed = clearExpiredRateLimits(200);
		expect(removed).toBe(1);
		expect(globalThis.__labyrinthineRateLimitStore?.has("a")).toBe(false);
		expect(globalThis.__labyrinthineRateLimitStore?.has("b")).toBe(true);
	});

	it("builds rate limit headers", () => {
		const headers = toRateLimitHeaders({
			success: false,
			limit: 5,
			remaining: 0,
			resetAt: 4500,
			retryAfterMs: 1500,
		});

		expect(headers["X-RateLimit-Limit"]).toBe("5");
		expect(headers["X-RateLimit-Remaining"]).toBe("0");
		expect(headers["X-RateLimit-Reset"]).toBe("5");
		expect(headers["Retry-After"]).toBe("2");
	});
});
