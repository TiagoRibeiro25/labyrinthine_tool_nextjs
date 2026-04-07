import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-auth", () => ({
	getServerSession: vi.fn(),
}));

vi.mock("../../../../db", () => ({
	db: {
		select: vi.fn(),
		insert: vi.fn(),
		delete: vi.fn(),
	},
}));

vi.mock("../../../../lib/social", () => ({
	createNotifications: vi.fn(),
	getAcceptedFriendIds: vi.fn(),
	recordActivityEvent: vi.fn(),
}));

vi.mock("../../../../lib/cosmetics", () => ({
	getCosmeticById: vi.fn(),
}));

import { getServerSession } from "next-auth";
import { db } from "../../../../db";
import { getCosmeticById } from "../../../../lib/cosmetics";
import {
	createNotifications,
	getAcceptedFriendIds,
	recordActivityEvent,
} from "../../../../lib/social";
import { POST } from "./route";

const mockedGetServerSession = vi.mocked(getServerSession);
const mockedGetAcceptedFriendIds = vi.mocked(getAcceptedFriendIds);
const mockedCreateNotifications = vi.mocked(createNotifications);
const mockedRecordActivityEvent = vi.mocked(recordActivityEvent);
const mockedGetCosmeticById = vi.mocked(getCosmeticById);

const mockedDb = db as unknown as {
	select: ReturnType<typeof vi.fn>;
	insert: ReturnType<typeof vi.fn>;
	delete: ReturnType<typeof vi.fn>;
};

type SelectSetup = {
	rows: unknown[];
	withLimit?: boolean;
};

function queueSelects(...setups: SelectSetup[]) {
	let call = 0;
	mockedDb.select.mockImplementation(() => {
		const setup = setups[call] ?? { rows: [] };
		call += 1;

		const chain = {
			from: vi.fn(),
			where: vi.fn(),
			limit: vi.fn(),
		};

		chain.from.mockReturnValue(chain);

		if (setup.withLimit) {
			chain.where.mockReturnValue(chain);
			chain.limit.mockResolvedValue(setup.rows);
		} else {
			chain.where.mockResolvedValue(setup.rows);
		}

		return chain;
	});
}

function req(body: unknown) {
	return new Request("http://localhost/api/cosmetics/toggle", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});
}

describe("cosmetics toggle route", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.spyOn(console, "error").mockImplementation(() => {});
		mockedGetServerSession.mockResolvedValue({ user: { id: "u1" } } as never);
		mockedGetAcceptedFriendIds.mockResolvedValue(["f1"]);
		mockedCreateNotifications.mockResolvedValue(undefined);
		mockedRecordActivityEvent.mockResolvedValue(undefined);
		mockedGetCosmeticById.mockReturnValue({ id: 2, name: "Hat", type: "Hat" });
	});

	it("returns 401 when unauthenticated", async () => {
		mockedGetServerSession.mockResolvedValue(null);
		const response = await POST(req({ cosmeticId: 1 }));
		expect(response.status).toBe(401);
	});

	it("returns 400 for invalid json body", async () => {
		queueSelects({ rows: [{ username: "me" }], withLimit: true });
		const response = await POST(
			new Request("http://localhost/api/cosmetics/toggle", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: "{bad-json",
			})
		);
		expect(response.status).toBe(400);
	});

	it("bulk unlock inserts only missing cosmetics and emits activity", async () => {
		queueSelects(
			{ rows: [{ username: "me" }], withLimit: true },
			{ rows: [{ cosmeticId: 1 }] }
		);
		const insertValues = vi.fn().mockResolvedValue(undefined);
		mockedDb.insert.mockReturnValue({ values: insertValues });

		const response = await POST(req({ cosmeticIds: [1, 2, 3], action: "unlock" }));

		expect(response.status).toBe(200);
		expect(insertValues).toHaveBeenCalledWith([
			{ userId: "u1", cosmeticId: 2 },
			{ userId: "u1", cosmeticId: 3 },
		]);
		expect(mockedRecordActivityEvent).toHaveBeenCalledTimes(1);
		expect(mockedCreateNotifications).toHaveBeenCalledTimes(1);
	});

	it("bulk lock deletes requested cosmetics", async () => {
		queueSelects({ rows: [{ username: "me" }], withLimit: true });
		const where = vi.fn().mockResolvedValue(undefined);
		mockedDb.delete.mockReturnValue({ where });

		const response = await POST(req({ cosmeticIds: [2, 3], action: "lock" }));

		expect(response.status).toBe(200);
		expect(where).toHaveBeenCalledTimes(1);
	});

	it("single toggle locks when already unlocked", async () => {
		queueSelects(
			{ rows: [{ username: "me" }], withLimit: true },
			{ rows: [{ id: "uc1" }], withLimit: true }
		);
		const where = vi.fn().mockResolvedValue(undefined);
		mockedDb.delete.mockReturnValue({ where });

		const response = await POST(req({ cosmeticId: 2 }));
		const payload = (await response.json()) as { unlocked: boolean };

		expect(response.status).toBe(200);
		expect(payload.unlocked).toBe(false);
		expect(mockedDb.delete).toHaveBeenCalledTimes(1);
	});

	it("single toggle unlocks when missing and emits activity/notifications", async () => {
		queueSelects(
			{ rows: [{ username: "me" }], withLimit: true },
			{ rows: [], withLimit: true }
		);
		const insertValues = vi.fn().mockResolvedValue(undefined);
		mockedDb.insert.mockReturnValue({ values: insertValues });

		const response = await POST(req({ cosmeticId: 2 }));
		const payload = (await response.json()) as { unlocked: boolean };

		expect(response.status).toBe(200);
		expect(payload.unlocked).toBe(true);
		expect(insertValues).toHaveBeenCalledWith({ userId: "u1", cosmeticId: 2 });
		expect(mockedRecordActivityEvent).toHaveBeenCalledTimes(1);
		expect(mockedCreateNotifications).toHaveBeenCalledTimes(1);
	});
});
