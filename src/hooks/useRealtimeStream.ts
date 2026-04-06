import { useEffect } from "react";
import {
    REALTIME_STREAM_API_PATH,
    type RealtimeStreamSnapshot,
    type RealtimeTopic,
} from "../constants/realtime";

interface UseRealtimeStreamOptions {
	topics: RealtimeTopic[];
	onUpdate: (payload: RealtimeStreamSnapshot) => void;
	enabled?: boolean;
}

export function useRealtimeStream({
	topics,
	onUpdate,
	enabled = true,
}: UseRealtimeStreamOptions) {
	const topicKey = Array.from(new Set(topics)).sort().join(",");

	useEffect(() => {
		if (!enabled || !topicKey) {
			return;
		}

		if (typeof window === "undefined" || typeof EventSource === "undefined") {
			return;
		}

		const params = new URLSearchParams({ topics: topicKey });
		const source = new EventSource(`${REALTIME_STREAM_API_PATH}?${params.toString()}`);

		const handleSnapshot = (event: MessageEvent<string>) => {
			try {
				const payload = JSON.parse(event.data) as RealtimeStreamSnapshot;
				onUpdate(payload);
			} catch {
				// Ignore malformed SSE payloads and keep the stream alive.
			}
		};

		source.addEventListener("init", handleSnapshot as EventListener);
		source.addEventListener("update", handleSnapshot as EventListener);

		return () => {
			source.removeEventListener("init", handleSnapshot as EventListener);
			source.removeEventListener("update", handleSnapshot as EventListener);
			source.close();
		};
	}, [enabled, onUpdate, topicKey]);
}
