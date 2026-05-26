import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./user-exists", () => ({
	userExistsById: vi.fn(),
}));

import { userExistsById } from "./user-exists";
import { isAuthenticatedToken } from "./auth-token";

const mockedUserExistsById = vi.mocked(userExistsById);

describe("isAuthenticatedToken", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns false for null tokens", async () => {
		await expect(isAuthenticatedToken(null)).resolves.toBe(false);
	});

	it("returns false for deleted-user tokens", async () => {
		await expect(isAuthenticatedToken({ userDeleted: true })).resolves.toBe(false);
		expect(mockedUserExistsById).not.toHaveBeenCalled();
	});

	it("returns false when the user id is missing", async () => {
		await expect(isAuthenticatedToken({})).resolves.toBe(false);
		expect(mockedUserExistsById).not.toHaveBeenCalled();
	});

	it("returns false when the user no longer exists", async () => {
		mockedUserExistsById.mockResolvedValue(false);

		await expect(isAuthenticatedToken({ id: "missing-user" })).resolves.toBe(false);
	});

	it("returns true when the user exists", async () => {
		mockedUserExistsById.mockResolvedValue(true);

		await expect(isAuthenticatedToken({ id: "existing-user" })).resolves.toBe(true);
	});
});
