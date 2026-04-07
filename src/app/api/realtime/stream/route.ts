import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { getServerSession } from "next-auth";
import {
	REALTIME_STREAM_POLL_MS,
	REALTIME_TOPICS,
	type RealtimeActivitySnapshot,
	type RealtimeNotificationsSnapshot,
	type RealtimeStreamSnapshot,
	type RealtimeTopic,
} from "../../../../constants/realtime";
import { db } from "../../../../db";
import { activityEvents, notifications } from "../../../../db/schema";
import { authOptions } from "../../../../lib/auth";
import { subscribeRealtimeHints, type RealtimeHint } from "../../../../lib/realtime";
import { getAcceptedFriendIds } from "../../../../lib/social";

export const runtime = "nodejs";

type RealtimeTopicSet = Set<RealtimeTopic>;

function formatSseEvent(event: string, payload: unknown) {
	return `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
}

function formatSsePing() {
	return ": ping\n\n";
}

function parseTopics(req: Request): RealtimeTopicSet {
	const requested = new URL(req.url).searchParams
		.get("topics")
		?.split(",")
		.map((value) => value.trim())
		.filter(Boolean);

	if (!requested || requested.length === 0) {
		return new Set([REALTIME_TOPICS.NOTIFICATIONS, REALTIME_TOPICS.ACTIVITY]);
	}

	const topics = new Set<RealtimeTopic>();

	for (const value of requested) {
		if (value === REALTIME_TOPICS.NOTIFICATIONS || value === REALTIME_TOPICS.ACTIVITY) {
			topics.add(value);
		}
	}

	if (topics.size === 0) {
		topics.add(REALTIME_TOPICS.NOTIFICATIONS);
		topics.add(REALTIME_TOPICS.ACTIVITY);
	}

	return topics;
}

async function getNotificationsSnapshot(
	userId: string
): Promise<RealtimeNotificationsSnapshot> {
	const latestRows = await db
		.select({ id: notifications.id })
		.from(notifications)
		.where(eq(notifications.userId, userId))
		.orderBy(desc(notifications.createdAt))
		.limit(1);

	const unreadResult = await db
		.select({ count: sql<number>`count(*)`.mapWith(Number) })
		.from(notifications)
		.where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

	const latestNotificationId = latestRows[0]?.id ?? null;
	const unreadCount = unreadResult[0]?.count ?? 0;
	const signature = `${latestNotificationId ?? "none"}:${unreadCount}`;

	return {
		signature,
		unreadCount,
		latestNotificationId,
	};
}

async function getActivitySnapshot(userId: string): Promise<RealtimeActivitySnapshot> {
	const friendIds = await getAcceptedFriendIds(userId);
	const friendCount = friendIds.length;

	if (friendCount === 0) {
		return {
			signature: "friends:0:latest:none",
			latestActivityId: null,
			friendCount,
		};
	}

	const latestRows = await db
		.select({ id: activityEvents.id })
		.from(activityEvents)
		.where(inArray(activityEvents.actorUserId, friendIds))
		.orderBy(desc(activityEvents.createdAt))
		.limit(1);

	const latestActivityId = latestRows[0]?.id ?? null;
	const signature = `friends:${friendCount}:latest:${latestActivityId ?? "none"}`;

	return {
		signature,
		latestActivityId,
		friendCount,
	};
}

async function getSnapshot(
	userId: string,
	topics: RealtimeTopicSet
): Promise<RealtimeStreamSnapshot> {
	const snapshot: RealtimeStreamSnapshot = {};

	if (topics.has(REALTIME_TOPICS.NOTIFICATIONS)) {
		snapshot.notifications = await getNotificationsSnapshot(userId);
	}

	if (topics.has(REALTIME_TOPICS.ACTIVITY)) {
		snapshot.activity = await getActivitySnapshot(userId);
	}

	return snapshot;
}

function stripSignatures(snapshot: RealtimeStreamSnapshot): RealtimeStreamSnapshot {
	return {
		notifications: snapshot.notifications
			? {
					signature: snapshot.notifications.signature,
					unreadCount: snapshot.notifications.unreadCount,
					latestNotificationId: snapshot.notifications.latestNotificationId,
				}
			: undefined,
		activity: snapshot.activity
			? {
					signature: snapshot.activity.signature,
					latestActivityId: snapshot.activity.latestActivityId,
					friendCount: snapshot.activity.friendCount,
				}
			: undefined,
	};
}

function detectChanges(
	previous: RealtimeStreamSnapshot,
	next: RealtimeStreamSnapshot
): RealtimeStreamSnapshot {
	const changed: RealtimeStreamSnapshot = {};

	if (
		next.notifications &&
		next.notifications.signature !== previous.notifications?.signature
	) {
		changed.notifications = next.notifications;
	}

	if (next.activity && next.activity.signature !== previous.activity?.signature) {
		changed.activity = next.activity;
	}

	return changed;
}

function shouldHandleHint(hint: RealtimeHint, userId: string, topics: RealtimeTopicSet) {
	if (!topics.has(hint.topic)) {
		return false;
	}

	if (!hint.userIds || hint.userIds.length === 0) {
		return true;
	}

	return hint.userIds.includes(userId);
}

export async function GET(req: Request) {
	const session = await getServerSession(authOptions);
	const sessionUser = session?.user as { id?: string } | undefined;

	if (!sessionUser?.id) {
		return new Response(JSON.stringify({ message: "Unauthorized." }), {
			status: 401,
			headers: {
				"Content-Type": "application/json",
			},
		});
	}

	const sessionUserId = sessionUser.id;

	const topics = parseTopics(req);
	const encoder = new TextEncoder();
	let intervalId: ReturnType<typeof setInterval> | null = null;
	let unsubscribeHints: (() => void) | null = null;
	let closed = false;

	const stream = new ReadableStream<Uint8Array>({
		start(controller) {
			const closeStream = () => {
				if (closed) {
					return;
				}

				closed = true;
				if (intervalId) {
					clearInterval(intervalId);
					intervalId = null;
				}

				if (unsubscribeHints) {
					unsubscribeHints();
					unsubscribeHints = null;
				}

				req.signal.removeEventListener("abort", closeStream);

				try {
					controller.close();
				} catch {
					// No-op when stream is already closed.
				}
			};

			const send = (event: string, payload: unknown) => {
				if (closed) {
					return;
				}

				controller.enqueue(encoder.encode(formatSseEvent(event, payload)));
			};

			const sendPing = () => {
				if (closed) {
					return;
				}

				controller.enqueue(encoder.encode(formatSsePing()));
			};

			let previousSnapshot: RealtimeStreamSnapshot = {};
			let isChecking = false;

			const checkForUpdates = async () => {
				if (closed) {
					return;
				}

				try {
					const nextSnapshot = await getSnapshot(sessionUserId, topics);
					const changed = detectChanges(previousSnapshot, nextSnapshot);
					previousSnapshot = nextSnapshot;

					if (changed.notifications || changed.activity) {
						send("update", stripSignatures(changed));
					} else {
						sendPing();
					}
				} catch (error) {
					console.error("Realtime stream update error:", error);
					send("error", { message: "Realtime stream update failed." });
				}
			};

			const scheduleCheck = () => {
				if (closed || isChecking) {
					return;
				}

				isChecking = true;
				void checkForUpdates().finally(() => {
					isChecking = false;
				});
			};

			req.signal.addEventListener("abort", closeStream);
			unsubscribeHints = subscribeRealtimeHints((hint) => {
				if (!shouldHandleHint(hint, sessionUserId, topics)) {
					return;
				}

				scheduleCheck();
			});

			void (async () => {
				try {
					previousSnapshot = await getSnapshot(sessionUserId, topics);
					send("init", stripSignatures(previousSnapshot));
				} catch (error) {
					console.error("Realtime stream init error:", error);
					send("error", { message: "Realtime stream initialization failed." });
				}

				intervalId = setInterval(() => {
					scheduleCheck();
				}, REALTIME_STREAM_POLL_MS);
			})();
		},
		cancel() {
			if (intervalId) {
				clearInterval(intervalId);
				intervalId = null;
			}

			if (unsubscribeHints) {
				unsubscribeHints();
				unsubscribeHints = null;
			}

			closed = true;
		},
	});

	return new Response(stream, {
		headers: {
			"Content-Type": "text/event-stream",
			"Cache-Control": "no-cache, no-transform",
			Connection: "keep-alive",
			"X-Accel-Buffering": "no",
		},
	});
}
