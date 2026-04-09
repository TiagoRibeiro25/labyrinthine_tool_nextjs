import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-auth", () => ({
	getServerSession: vi.fn(),
}));

vi.mock("../../../../db", () => ({
	db: {
		select: vi.fn(),
		delete: vi.fn(),
	},
}));

import { getServerSession } from "next-auth";
import { ADMIN_CLEANUP_RETENTION_DAYS } from "../../../../constants/admin";
import { db } from "../../../../db";
import { POST } from "./route";

const mockedGetServerSession = vi.mocked(getServerSession);
const mockedDb = db as unknown as {
	select: ReturnType<typeof vi.fn>;
	delete: ReturnType<typeof vi.fn>;
};

function buildSelectChain() {
	const chain = {
		from: vi.fn(),
		where: vi.fn(),
		limit: vi.fn(),
	};
	chain.from.mockReturnValue(chain);
	chain.where.mockReturnValue(chain);
	return chain;
}

describe("admin cleanup route", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.spyOn(console, "error").mockImplementation(() => {});
		mockedGetServerSession.mockResolvedValue({ user: { id: "admin-1" } } as never);
	});

	it("returns 401 for unauthenticated requests", async () => {
		mockedGetServerSession.mockResolvedValue(null);
		const response = await POST(
			new Request("http://localhost/api/admin/cleanup", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ retentionDays: ADMIN_CLEANUP_RETENTION_DAYS }),
			})
		);

		expect(response.status).toBe(401);
	});

	it("returns 403 for non-admin users", async () => {
		const userChain = buildSelectChain();
		userChain.limit.mockResolvedValue([{ isAdministrator: false }]);
		mockedDb.select.mockReturnValue(userChain);

		const response = await POST(
			new Request("http://localhost/api/admin/cleanup", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ retentionDays: ADMIN_CLEANUP_RETENTION_DAYS }),
			})
		);

		expect(response.status).toBe(403);
	});

	it("deletes activity and notifications older than the configured retention period", async () => {
		const userChain = buildSelectChain();
		userChain.limit.mockResolvedValue([{ isAdministrator: true }]);

		const activityCountChain = buildSelectChain();
		activityCountChain.where.mockResolvedValue([{ count: 5 }]);

		const notificationCountChain = buildSelectChain();
		notificationCountChain.where.mockResolvedValue([{ count: 8 }]);

		const activityDeleteWhere = vi.fn().mockResolvedValue(undefined);
		const notificationDeleteWhere = vi.fn().mockResolvedValue(undefined);

		mockedDb.select
			.mockImplementationOnce(() => userChain)
			.mockImplementationOnce(() => activityCountChain)
			.mockImplementationOnce(() => notificationCountChain);
		mockedDb.delete
			.mockReturnValueOnce({ where: activityDeleteWhere })
			.mockReturnValueOnce({ where: notificationDeleteWhere });

		const response = await POST(
			new Request("http://localhost/api/admin/cleanup", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ retentionDays: ADMIN_CLEANUP_RETENTION_DAYS }),
			})
		);

		const payload = (await response.json()) as {
			retentionDays: number;
			deletedActivityEvents: number;
			deletedNotifications: number;
		};

		expect(response.status).toBe(200);
		expect(payload.retentionDays).toBe(ADMIN_CLEANUP_RETENTION_DAYS);
		expect(payload.deletedActivityEvents).toBe(5);
		expect(payload.deletedNotifications).toBe(8);
		expect(activityDeleteWhere).toHaveBeenCalledTimes(1);
		expect(notificationDeleteWhere).toHaveBeenCalledTimes(1);
	});
});
