type HeaderMap =
	| Headers
	| Record<string, string | string[] | undefined>
	| null
	| undefined;

/**
 * Returns a normalized header value as string, regardless of whether the source
 * is a native Headers instance or a plain object.
 */
export function getHeaderValue(headers: HeaderMap, name: string): string | null {
	if (!headers) return null;

	if (headers instanceof Headers) {
		const value = headers.get(name);
		return value?.trim() || null;
	}

	const target = name.toLowerCase();

	for (const [key, rawValue] of Object.entries(headers)) {
		if (key.toLowerCase() !== target) continue;

		if (Array.isArray(rawValue)) {
			const joined = rawValue.join(",").trim();
			return joined || null;
		}

		const value = (rawValue ?? "").trim();
		return value || null;
	}

	return null;
}

/**
 * Pulls the first non-empty candidate from a comma-separated header value
 * (e.g. x-forwarded-for) and sanitizes common placeholders.
 */
function firstAddress(value: string | null): string | null {
	if (!value) return null;

	const candidate = value
		.split(",")
		.map((part) => part.trim())
		.find(Boolean);

	if (!candidate) return null;

	const normalized = candidate.toLowerCase();
	if (normalized === "unknown" || normalized === "null" || normalized === "-") {
		return null;
	}

	return candidate;
}

/**
 * Best-effort client IP extraction.
 *
 * Order:
 * 1) x-forwarded-for (first value)
 * 2) x-real-ip
 * 3) cf-connecting-ip (Cloudflare)
 * 4) true-client-ip
 */
export function getClientIpFromHeaders(headers: HeaderMap): string {
	const forwardedFor = firstAddress(getHeaderValue(headers, "x-forwarded-for"));
	if (forwardedFor) return forwardedFor;

	const realIp = firstAddress(getHeaderValue(headers, "x-real-ip"));
	if (realIp) return realIp;

	const cloudflareIp = firstAddress(getHeaderValue(headers, "cf-connecting-ip"));
	if (cloudflareIp) return cloudflareIp;

	const trueClientIp = firstAddress(getHeaderValue(headers, "true-client-ip"));
	if (trueClientIp) return trueClientIp;

	return "unknown";
}
