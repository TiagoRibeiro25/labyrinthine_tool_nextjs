import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-auth", () => ({
	getServerSession: vi.fn(),
}));

vi.mock("../../../../db", () => ({
	db: {
		select: vi.fn(),
		insert: vi.fn(),
	},
}));

vi.mock("../../../../lib/social", () => ({
	createNotifications: vi.fn(),
	recordActivityEvent: vi.fn(),
}));

import { getServerSession } from "next-auth";
import { db } from "../../../../db";
import { createNotifications, recordActivityEvent } from "../../../../lib/social";
import { GET, POST } from "./route";

type SelectChain = {
	from: ReturnType<typeof vi.fn>;
	where: ReturnType<typeof vi.fn>;
	orderBy: ReturnType<typeof vi.fn>;
	limit: ReturnType<typeof vi.fn>;
};

function createSelectChain(rows: unknown[]): SelectChain {
	const chain: SelectChain = {
		from: vi.fn(),
		where: vi.fn(),
		orderBy: vi.fn(),
		limit: vi.fn(),
	};
	chain.from.mockReturnValue(chain);
	chain.where.mockReturnValue(chain);
	chain.orderBy.mockReturnValue(chain);
	chain.limit.mockResolvedValue(rows);
	return chain;
}

const mockedGetServerSession = vi.mocked(getServerSession);
const mockedCreateNotifications = vi.mocked(createNotifications);
const mockedRecordActivityEvent = vi.mocked(recordActivityEvent);
const mockedDb = db as unknown as {
	select: ReturnType<typeof vi.fn>;
	insert: ReturnType<typeof vi.fn>;
};

function buildPostRequest(body: unknown) {
	return new Request("http://localhost/api/puzzles/scores", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});
}

describe("puzzle scores route", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockedCreateNotifications.mockResolvedValue(undefined);
		mockedRecordActivityEvent.mockResolvedValue(undefined);
	});

	it("returns unsigned state for GET when user is not authenticated", async () => {
		mockedGetServerSession.mockResolvedValue(null);

		const response = await GET(new Request("http://localhost/api/puzzles/scores"));
		const payload = (await response.json()) as {
			signedIn: boolean;
			recentScores: unknown[];
		};

		expect(response.status).toBe(200);
		expect(payload.signedIn).toBe(false);
		expect(payload.recentScores).toEqual([]);
	});

	it("returns validation error on GET for invalid puzzleType", async () => {
		mockedGetServerSession.mockResolvedValue({ user: { id: "u1" } } as never);

		const response = await GET(
			new Request("http://localhost/api/puzzles/scores?puzzleType=invalid")
		);
		expect(response.status).toBe(400);
		expect(mockedDb.select).not.toHaveBeenCalled();
	});

	it("returns unauthorized for POST without session", async () => {
		mockedGetServerSession.mockResolvedValue(null);

		const response = await POST(
			buildPostRequest({
				puzzleType: "lights-out",
				moves: 10,
				durationMs: 20000,
			})
		);

		expect(response.status).toBe(401);
	});

	it("returns bad request for invalid JSON POST body", async () => {
		mockedGetServerSession.mockResolvedValue({ user: { id: "u1" } } as never);

		const response = await POST(
			new Request("http://localhost/api/puzzles/scores", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: "{invalid-json",
			})
		);

		expect(response.status).toBe(400);
	});

	it("does not save when run is not a personal best", async () => {
		mockedGetServerSession.mockResolvedValue({ user: { id: "u1" } } as never);
		mockedDb.select.mockImplementation(() =>
			createSelectChain([{ moves: 5, durationMs: 10000 }])
		);
		const insertValues = vi.fn().mockResolvedValue(undefined);
		mockedDb.insert.mockReturnValue({ values: insertValues });

		const response = await POST(
			buildPostRequest({
				puzzleType: "lights-out",
				moves: 6,
				durationMs: 15000,
			})
		);
		const payload = (await response.json()) as { personalBest: boolean; saved: boolean };

		expect(response.status).toBe(200);
		expect(payload.personalBest).toBe(false);
		expect(payload.saved).toBe(false);
		expect(mockedDb.insert).not.toHaveBeenCalled();
		expect(mockedRecordActivityEvent).not.toHaveBeenCalled();
		expect(mockedCreateNotifications).not.toHaveBeenCalled();
	});

	it("saves and notifies when run is a personal best", async () => {
		mockedGetServerSession.mockResolvedValue({ user: { id: "u1" } } as never);
		mockedDb.select.mockImplementation(() =>
			createSelectChain([{ moves: 12, durationMs: 16000 }])
		);
		const insertValues = vi.fn().mockResolvedValue(undefined);
		mockedDb.insert.mockReturnValue({ values: insertValues });

		const response = await POST(
			buildPostRequest({
				puzzleType: "slider-puzzle",
				moves: 10,
				durationMs: 15000,
			})
		);
		const payload = (await response.json()) as { personalBest: boolean; saved: boolean };

		expect(response.status).toBe(201);
		expect(payload.personalBest).toBe(true);
		expect(payload.saved).toBe(true);
		expect(mockedDb.insert).toHaveBeenCalledTimes(1);
		expect(insertValues).toHaveBeenCalledWith({
			userId: "u1",
			puzzleType: "slider-puzzle",
			moves: 10,
			durationMs: 15000,
		});
		expect(mockedRecordActivityEvent).toHaveBeenCalledTimes(1);
		expect(mockedCreateNotifications).toHaveBeenCalledTimes(1);
	});
});
