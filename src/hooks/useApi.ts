import { useCallback, useState } from "react";
import { invalidateClientSession } from "../lib/invalidate-client-session";

export type ApiRequestOptions = RequestInit & {
	cacheTtlMs?: number;
};

type CacheEntry<T = unknown> = {
	data: T;
	expiresAt: number;
};

const getCache = new Map<string, CacheEntry>();
const pendingGets = new Map<string, Promise<unknown>>();
const CACHE_LIMIT = 100;

function getCacheKey(url: string, options?: RequestInit): string {
	const headers = options?.headers;
	return `${url}|${headers ? new Headers(headers).get("authorization") ?? "" : ""}`;
}

function pruneCache(): void {
	const now = Date.now();
	for (const [key, entry] of getCache) {
		if (entry.expiresAt <= now) getCache.delete(key);
	}

	if (getCache.size >= CACHE_LIMIT) {
		const oldestKey = getCache.keys().next().value as string | undefined;
		if (oldestKey) getCache.delete(oldestKey);
	}
}

export function clearApiGetCache(url?: string): void {
	if (!url) {
		getCache.clear();
		pendingGets.clear();
		return;
	}
	for (const key of getCache.keys()) {
		if (key.startsWith(url)) getCache.delete(key);
	}
}

export class ApiError extends Error {
	status: number;

	constructor(message: string, status: number) {
		super(message);
		this.name = "ApiError";
		this.status = status;
	}
}

export function useApi<T = unknown>() {
	const [data, setData] = useState<T | null>(null);
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);

	const execute = useCallback(async (url: string, options?: ApiRequestOptions) => {
		setLoading(true);
		setError(null);

		try {
			const method = (options?.method ?? "GET").toUpperCase();
			const { cacheTtlMs, ...fetchOptions } = options ?? {};

			if (method !== "GET") {
				clearApiGetCache();
			}

			const cacheKey = getCacheKey(url, fetchOptions);
			if (method === "GET" && cacheTtlMs && cacheTtlMs > 0) {
				const cached = getCache.get(cacheKey) as CacheEntry<T> | undefined;
				if (cached && cached.expiresAt > Date.now()) {
					setData(cached.data);
					setLoading(false);
					return cached.data;
				}

				const pending = pendingGets.get(cacheKey) as Promise<Response> | undefined;
				if (pending) {
					const res = await pending;
					const contentType = res.headers.get("content-type");
					if (!res.ok) {
						let errorMessage = "An error occurred while fetching data.";
						try {
							const errorData = await res.clone().json();
							errorMessage = errorData.message || errorData.error || errorMessage;
						} catch {
							errorMessage = `HTTP error! status: ${res.status}`;
						}
						if (res.status === 401) {
							void invalidateClientSession();
						}
						throw new ApiError(errorMessage, res.status);
					}
					const responseData = contentType?.includes("application/json")
						? await res.clone().json() as T
						: null;
					setData(responseData);
					return responseData;
				}
			}

			let res: Response;
			if (method === "GET" && cacheTtlMs && cacheTtlMs > 0) {
				const request = fetch(url, {
					...fetchOptions,
					headers: {
						"Content-Type": "application/json",
						...fetchOptions.headers,
					},
				});
				pendingGets.set(cacheKey, request);
				try {
					res = await request;
				} finally {
					pendingGets.delete(cacheKey);
				}
			} else {
				res = await fetch(url, {
					...fetchOptions,
				headers: {
					"Content-Type": "application/json",
					...fetchOptions.headers,
				},
			});
			}

			if (!res.ok) {
				let errorMessage = "An error occurred while fetching data.";
				try {
					const errorData = await res.json();
					errorMessage = errorData.message || errorData.error || errorMessage;
				} catch {
					// Fallback to status text if JSON parsing fails
					errorMessage = `HTTP error! status: ${res.status}`;
				}

				if (res.status === 401) {
					void invalidateClientSession();
				}

				throw new ApiError(errorMessage, res.status);
			}

			// Only attempt to parse JSON if there's content
			const contentType = res.headers.get("content-type");
			let responseData: T | null = null;
			if (contentType && contentType.includes("application/json")) {
				responseData = await res.json();
			}

			if (method === "GET" && cacheTtlMs && cacheTtlMs > 0) {
				pruneCache();
				getCache.set(cacheKey, {
					data: responseData,
					expiresAt: Date.now() + cacheTtlMs,
				});
			}

			setData(responseData);
			return responseData;
		} catch (err) {
			const message = err instanceof Error ? err.message : "An unexpected error occurred";
			setError(message);
			throw err;
		} finally {
			setLoading(false);
		}
	}, []);

	const reset = useCallback(() => {
		setData(null);
		setError(null);
		setLoading(false);
	}, []);

	return { data, loading, error, execute, setData, setError, reset };
}
