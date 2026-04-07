import { describe, expect, it } from "vitest";
import {
	friendsActionSchema,
	notificationsMarkReadBodySchema,
	profileUpdateSchema,
	puzzleLeaderboardQuerySchema,
	puzzleScoreBodySchema,
	registerBodySchema,
} from "./validation";

describe("validation schemas", () => {
	it("validates register body", () => {
		expect(
			registerBodySchema.safeParse({ username: "player_1", password: "hunter22" }).success
		).toBe(true);
		expect(registerBodySchema.safeParse({ username: "x", password: "123" }).success).toBe(
			false
		);
	});

	it("enforces conditional friend action fields", () => {
		expect(friendsActionSchema.safeParse({ action: "add" }).success).toBe(false);
		expect(
			friendsActionSchema.safeParse({ action: "add", receiverUsername: "friend_1" })
				.success
		).toBe(true);
		expect(
			friendsActionSchema.safeParse({
				action: "accept",
				requestId: "11111111-1111-1111-1111-111111111111",
			}).success
		).toBe(true);
		expect(
			friendsActionSchema.safeParse({ action: "remove", receiverUsername: "friend_2" })
				.success
		).toBe(true);
	});

	it("validates profile updates with optional steam url", () => {
		expect(
			profileUpdateSchema.safeParse({
				bio: "hi",
				steamProfileUrl: "https://steamcommunity.com/id/test-user/",
			}).success
		).toBe(true);
		expect(
			profileUpdateSchema.safeParse({
				steamProfileUrl: "https://example.com/not-steam",
			}).success
		).toBe(false);
	});

	it("validates puzzle score payload constraints", () => {
		expect(
			puzzleScoreBodySchema.safeParse({
				puzzleType: "lights-out",
				moves: 20,
				durationMs: 35_000,
			}).success
		).toBe(true);
		expect(
			puzzleScoreBodySchema.safeParse({
				puzzleType: "lights-out",
				moves: 0,
				durationMs: 35_000,
			}).success
		).toBe(false);
		expect(
			puzzleScoreBodySchema.safeParse({
				puzzleType: "unknown",
				moves: 10,
				durationMs: 10_000,
			}).success
		).toBe(false);
	});

	it("applies defaults and constraints for puzzle leaderboard query", () => {
		const parsed = puzzleLeaderboardQuerySchema.parse({});
		expect(parsed.puzzleType).toBe("lights-out");
		expect(parsed.page).toBe(1);
		expect(parsed.limit).toBe(20);
		expect(puzzleLeaderboardQuerySchema.safeParse({ limit: 200 }).success).toBe(false);
	});

	it("requires notification id or markAll in mark-read schema", () => {
		expect(notificationsMarkReadBodySchema.safeParse({}).success).toBe(false);
		expect(
			notificationsMarkReadBodySchema.safeParse({
				notificationId: "11111111-1111-1111-1111-111111111111",
			}).success
		).toBe(true);
		expect(notificationsMarkReadBodySchema.safeParse({ markAll: true }).success).toBe(
			true
		);
	});
});
