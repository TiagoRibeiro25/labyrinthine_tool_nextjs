type RateLimitBucket = {
    count: number;
    resetAt: number;
};

export interface RateLimitOptions {
    key: string;
    limit: number;
    windowMs: number;
    now?: number;
}

export interface RateLimitResult {
    success: boolean;
    limit: number;
    remaining: number;
    resetAt: number;
    retryAfterMs: number;
}

declare global {
    var __labyrinthineRateLimitStore: Map<string, RateLimitBucket> | undefined;
}

function getStore() {
    if (!globalThis.__labyrinthineRateLimitStore) {
        globalThis.__labyrinthineRateLimitStore = new Map<
            string,
            RateLimitBucket
        >();
    }
    return globalThis.__labyrinthineRateLimitStore;
}

/**
 * In-memory, process-local rate limiter.
 * Suitable for single-instance deployments or development.
 */
export function rateLimit(options: RateLimitOptions): RateLimitResult {
    const { key, limit, windowMs, now = Date.now() } = options;

    if (!key || limit <= 0 || windowMs <= 0) {
        return {
            success: false,
            limit: Math.max(0, limit),
            remaining: 0,
            resetAt: now,
            retryAfterMs: 0,
        };
    }

    const store = getStore();
    const existing = store.get(key);

    if (!existing || now >= existing.resetAt) {
        const resetAt = now + windowMs;
        store.set(key, { count: 1, resetAt });

        return {
            success: true,
            limit,
            remaining: Math.max(0, limit - 1),
            resetAt,
            retryAfterMs: 0,
        };
    }

    existing.count += 1;
    store.set(key, existing);

    const success = existing.count <= limit;
    const remaining = success ? Math.max(0, limit - existing.count) : 0;
    const retryAfterMs = success ? 0 : Math.max(0, existing.resetAt - now);

    return {
        success,
        limit,
        remaining,
        resetAt: existing.resetAt,
        retryAfterMs,
    };
}

/**
 * Optional maintenance helper to avoid unbounded map growth.
 */
export function clearExpiredRateLimits(now = Date.now()): number {
    const store = getStore();
    let removed = 0;

    for (const [key, bucket] of store.entries()) {
        if (now >= bucket.resetAt) {
            store.delete(key);
            removed += 1;
        }
    }

    return removed;
}

export function toRateLimitHeaders(
    result: RateLimitResult,
): Record<string, string> {
    return {
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": String(result.remaining),
        "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
        "Retry-After": String(Math.ceil(result.retryAfterMs / 1000)),
    };
}
