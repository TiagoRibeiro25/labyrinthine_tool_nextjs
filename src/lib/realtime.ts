import { EventEmitter } from "node:events";
import { type RealtimeTopic } from "../constants/realtime";

const REALTIME_HINT_EVENT = "realtime-hint";

export interface RealtimeHint {
	topic: RealtimeTopic;
	userIds?: string[];
}

declare global {
	var __labyrinthRealtimeEmitter: EventEmitter | undefined;
}

const realtimeEmitter = globalThis.__labyrinthRealtimeEmitter ?? new EventEmitter();

if (!globalThis.__labyrinthRealtimeEmitter) {
	realtimeEmitter.setMaxListeners(0);
	globalThis.__labyrinthRealtimeEmitter = realtimeEmitter;
}

export function emitRealtimeHint(hint: RealtimeHint) {
	realtimeEmitter.emit(REALTIME_HINT_EVENT, hint);
}

export function subscribeRealtimeHints(listener: (hint: RealtimeHint) => void) {
	realtimeEmitter.on(REALTIME_HINT_EVENT, listener);

	return () => {
		realtimeEmitter.off(REALTIME_HINT_EVENT, listener);
	};
}
