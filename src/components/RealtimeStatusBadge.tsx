import { type RealtimeConnectionStatus } from "../hooks/useRealtimeStream";

interface RealtimeStatusBadgeProps {
	status: RealtimeConnectionStatus;
	onReconnect?: () => void;
}

const STATUS_STYLES: Record<
	RealtimeConnectionStatus,
	{ label: string; dotClassName: string; textClassName: string }
> = {
	idle: {
		label: "idle",
		dotClassName: "bg-neutral-500",
		textClassName: "text-neutral-500",
	},
	connecting: {
		label: "connecting",
		dotClassName: "bg-amber-400",
		textClassName: "text-amber-300",
	},
	connected: {
		label: "live",
		dotClassName: "bg-emerald-400",
		textClassName: "text-emerald-300",
	},
	reconnecting: {
		label: "reconnecting",
		dotClassName: "bg-amber-400",
		textClassName: "text-amber-300",
	},
	offline: {
		label: "offline",
		dotClassName: "bg-red-400",
		textClassName: "text-red-300",
	},
	unsupported: {
		label: "unsupported",
		dotClassName: "bg-red-400",
		textClassName: "text-red-300",
	},
};

export default function RealtimeStatusBadge({
	status,
	onReconnect,
}: RealtimeStatusBadgeProps) {
	const styles = STATUS_STYLES[status];
	const isReconnectActionAvailable =
		Boolean(onReconnect) && (status === "reconnecting" || status === "offline");

	const content = (
		<>
			<span
				className={`h-2 w-2 rounded-full ${styles.dotClassName} ${status === "connected" ? "animate-pulse" : ""}`}
				aria-hidden="true"
			/>
			<span>{styles.label}</span>
			{isReconnectActionAvailable && (
				<span className="text-[9px] text-neutral-500">retry</span>
			)}
		</>
	);

	if (isReconnectActionAvailable && onReconnect) {
		return (
			<button
				type="button"
				onClick={onReconnect}
				className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest ${styles.textClassName} hover:text-neutral-100 transition-colors`}
				aria-label="Reconnect realtime updates"
			>
				{content}
			</button>
		);
	}

	return (
		<div
			className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest ${styles.textClassName}`}
			aria-live="polite"
		>
			{content}
		</div>
	);
}
