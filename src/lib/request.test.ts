import { describe, expect, it } from "vitest";
import { getClientIpFromHeaders, getHeaderValue } from "./request";

describe("request helpers", () => {
	it("reads header values from native Headers", () => {
		const headers = new Headers({ "x-real-ip": " 10.0.0.1 " });
		expect(getHeaderValue(headers, "x-real-ip")).toBe("10.0.0.1");
	});

	it("reads header values from plain objects and arrays", () => {
		expect(
			getHeaderValue({ "x-forwarded-for": ["1.1.1.1", "2.2.2.2"] }, "x-forwarded-for")
		).toBe("1.1.1.1,2.2.2.2");
		expect(getHeaderValue({ "X-Real-IP": " 3.3.3.3 " }, "x-real-ip")).toBe("3.3.3.3");
		expect(getHeaderValue(undefined, "x-real-ip")).toBeNull();
	});

	it("extracts first valid client ip by precedence", () => {
		expect(
			getClientIpFromHeaders({
				"x-forwarded-for": " 4.4.4.4, 5.5.5.5 ",
				"x-real-ip": "6.6.6.6",
			})
		).toBe("4.4.4.4");
		expect(
			getClientIpFromHeaders({
				"x-forwarded-for": "unknown",
				"x-real-ip": "6.6.6.6",
			})
		).toBe("6.6.6.6");
		expect(getClientIpFromHeaders({ "cf-connecting-ip": "7.7.7.7" })).toBe("7.7.7.7");
		expect(getClientIpFromHeaders({ "true-client-ip": "8.8.8.8" })).toBe("8.8.8.8");
		expect(getClientIpFromHeaders({})).toBe("unknown");
	});
});
