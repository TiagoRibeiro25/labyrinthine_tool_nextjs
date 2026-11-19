import { describe, expect, it } from "vitest";
import { sanitizeReturnTo } from "./oauth-utils";

describe("sanitizeReturnTo", () => {
	it("allows safe same-origin relative paths", () => {
		expect(sanitizeReturnTo("/profile/test")).toBe("/profile/test");
		expect(sanitizeReturnTo("/puzzles?page=2")).toBe("/puzzles?page=2");
	});

	it("rejects protocol-relative and absolute URLs", () => {
		expect(sanitizeReturnTo("//evil.example")).toBe("/");
		expect(sanitizeReturnTo("https://evil.example")).toBe("/");
	});

	it("rejects backslash redirects", () => {
		expect(sanitizeReturnTo("/\\evil.example")).toBe("/");
		expect(sanitizeReturnTo("/%5cevil.example")).toBe("/%5cevil.example");
	});

	it("rejects control characters", () => {
		expect(sanitizeReturnTo("/profile\n.evil")).toBe("/");
	});

	it("defaults missing values to the home page", () => {
		expect(sanitizeReturnTo(null)).toBe("/");
		expect(sanitizeReturnTo(undefined)).toBe("/");
	});
});
