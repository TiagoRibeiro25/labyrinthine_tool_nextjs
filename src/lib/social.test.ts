import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../db", () => ({
	db: {
		select: vi.fn(),
		insert: vi.fn(),
	},
}));

import { db } from "../db";
import { createNotifications, getAcceptedFriendIds, recordActivityEvent } from "./social";

const mockedDb = db as unknown as {
	select: ReturnType<typeof vi.fn>;
	insert: ReturnType<typeof vi.fn>;
};

describe("social helpers", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("maps accepted friend ids relative to current user", async () => {
		const chain = {
			from: vi.fn(),
			where: vi.fn(),
		};
		chain.from.mockReturnValue(chain);
		chain.where.mockResolvedValue([
			{ senderId: "me", receiverId: "friend1" },
			{ senderId: "friend2", receiverId: "me" },
		]);
		mockedDb.select.mockReturnValue(chain);

		const ids = await getAcceptedFriendIds("me");
		expect(ids).toEqual(["friend1", "friend2"]);
	});

	it("records activity events", async () => {
		const values = vi.fn().mockResolvedValue(undefined);
		mockedDb.insert.mockReturnValue({ values });

		await recordActivityEvent({
			actorUserId: "u1",
			eventType: "puzzle_completed",
			puzzleType: "lights-out",
			scoreValue: 12,
		});

		expect(mockedDb.insert).toHaveBeenCalledTimes(1);
		expect(values).toHaveBeenCalledWith(
			expect.objectContaining({
				actorUserId: "u1",
				eventType: "puzzle_completed",
				puzzleType: "lights-out",
				scoreValue: 12,
			}),
		);
	});

	it("skips empty notification arrays and inserts transformed notification payloads", async () => {
		const values = vi.fn().mockResolvedValue(undefined);
		mockedDb.insert.mockReturnValue({ values });

		await createNotifications([]);
		expect(mockedDb.insert).not.toHaveBeenCalled();

		await createNotifications([
			{
				userId: "u1",
				type: "friend_request",
				title: "hello",
				message: "world",
			},
			{
				userId: "u2",
				actorUserId: "u1",
				type: "friend_accept",
				title: "ok",
				message: "done",
				href: "/profile/user",
			},
		]);

		expect(mockedDb.insert).toHaveBeenCalledTimes(1);
		expect(values).toHaveBeenCalledWith([
			expect.objectContaining({ userId: "u1", actorUserId: null, href: null }),
			expect.objectContaining({
				userId: "u2",
				actorUserId: "u1",
				href: "/profile/user",
			}),
		]);
	});
});
