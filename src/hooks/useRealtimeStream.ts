import { useCallback, useEffect, useRef, useState } from "react";
import {
	REALTIME_STREAM_API_PATH,
	type RealtimeStreamSnapshot,
	type RealtimeTopic,
} from "../constants/realtime";
import { invalidateClientSession } from "../lib/invalidate-client-session";

export type RealtimeConnectionStatus =
	| "idle"
	| "connecting"
	| "connected"
	| "reconnecting"
	| "offline"
	| "unsupported";

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
	const [connectionStatus, setConnectionStatus] =
		useState<RealtimeConnectionStatus>("connecting");
	const [reconnectNonce, setReconnectNonce] = useState<number>(0);
	const stopReconnectingRef = useRef(false);
	const topicKey = Array.from(new Set(topics)).sort().join(",");
	const isUnsupportedEnvironment =
		typeof window !== "undefined" && typeof EventSource === "undefined";
	const status: RealtimeConnectionStatus =
		!enabled || !topicKey
			? "idle"
			: isUnsupportedEnvironment
				? "unsupported"
				: connectionStatus;
	const canReconnect = status === "reconnecting" || status === "offline";

	const reconnect = useCallback(() => {
		if (!enabled || !topicKey || stopReconnectingRef.current) {
			return;
		}

		if (typeof window === "undefined" || typeof EventSource === "undefined") {
			return;
		}

		setConnectionStatus("connecting");
		setReconnectNonce((value) => value + 1);
	}, [enabled, topicKey]);

	useEffect(() => {
		if (typeof window === "undefined") {
			return;
		}

		const handleOffline = () => {
			setConnectionStatus("offline");
		};

		const handleOnline = () => {
			setConnectionStatus((previous) =>
				previous === "offline" ? "reconnecting" : previous
			);
		};

		window.addEventListener("offline", handleOffline);
		window.addEventListener("online", handleOnline);

		return () => {
			window.removeEventListener("offline", handleOffline);
			window.removeEventListener("online", handleOnline);
		};
	}, []);

	useEffect(() => {
		if (!enabled || !topicKey) {
			return;
		}

		if (typeof window === "undefined" || typeof EventSource === "undefined") {
			return;
		}

		const params = new URLSearchParams({ topics: topicKey });
		stopReconnectingRef.current = false;
		const source = new EventSource(`${REALTIME_STREAM_API_PATH}?${params.toString()}`);
		let isDisposed = false;

		const handleAuthFailure = async () => {
			if (isDisposed || stopReconnectingRef.current) {
				return;
			}

			stopReconnectingRef.current = true;
			isDisposed = true;
			source.close();
			setConnectionStatus("idle");

			try {
				const sessionResponse = await fetch("/api/auth/session");
				if (!sessionResponse.ok) {
					await invalidateClientSession();
					return;
				}

				const sessionPayload = (await sessionResponse.json()) as {
					user?: { id?: string };
					expires?: string;
				};

				const userId = sessionPayload.user?.id;
				const isExpired =
					typeof sessionPayload.expires === "string" &&
					new Date(sessionPayload.expires) <= new Date();

				if (!userId || isExpired) {
					await invalidateClientSession();
				}
			} catch {
				await invalidateClientSession();
			}
		};

		const handleSnapshot = (event: MessageEvent<string>) => {
			try {
				const payload = JSON.parse(event.data) as RealtimeStreamSnapshot;
				onUpdate(payload);
			} catch {
				// Ignore malformed SSE payloads and keep the stream alive.
			}
		};

		const handleOpen = () => {
			if (!isDisposed) {
				setConnectionStatus("connected");
			}
		};

		const handleError = () => {
			if (isDisposed || stopReconnectingRef.current) {
				return;
			}

			void (async () => {
				try {
					const sessionResponse = await fetch("/api/auth/session");
					const sessionPayload = sessionResponse.ok
						? ((await sessionResponse.json()) as {
								user?: { id?: string };
								expires?: string;
							})
						: null;

					const userId = sessionPayload?.user?.id;
					const isExpired =
						typeof sessionPayload?.expires === "string" &&
						new Date(sessionPayload.expires) <= new Date();

					if (!sessionResponse.ok || !userId || isExpired) {
						await handleAuthFailure();
						return;
					}

					if (!isDisposed) {
						const isOffline =
							typeof navigator !== "undefined" && navigator.onLine === false;

						setConnectionStatus(isOffline ? "offline" : "reconnecting");
					}
				} catch {
					await handleAuthFailure();
				}
			})();
		};

		source.addEventListener("init", handleSnapshot as EventListener);
		source.addEventListener("update", handleSnapshot as EventListener);
		source.onopen = handleOpen;
		source.onerror = handleError;

		return () => {
			isDisposed = true;
			source.onopen = null;
			source.onerror = null;
			source.removeEventListener("init", handleSnapshot as EventListener);
			source.removeEventListener("update", handleSnapshot as EventListener);
			source.close();
		};
	}, [enabled, onUpdate, reconnectNonce, topicKey]);

	return { status, reconnect, canReconnect };
}
