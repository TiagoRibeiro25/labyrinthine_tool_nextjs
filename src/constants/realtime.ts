export const REALTIME_STREAM_API_PATH = "/api/realtime/stream";

export const REALTIME_STREAM_POLL_MS = 5_000;

export const REALTIME_TOPICS = {
	NOTIFICATIONS: "notifications",
	ACTIVITY: "activity",
} as const;

export type RealtimeTopic = (typeof REALTIME_TOPICS)[keyof typeof REALTIME_TOPICS];

export interface RealtimeNotificationsSnapshot {
	signature: string;
	unreadCount: number;
	latestNotificationId: string | null;
}

export interface RealtimeActivitySnapshot {
	signature: string;
	latestActivityId: string | null;
	friendCount: number;
}

export interface RealtimeStreamSnapshot {
	notifications?: RealtimeNotificationsSnapshot;
	activity?: RealtimeActivitySnapshot;
}
