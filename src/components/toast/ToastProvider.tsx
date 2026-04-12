"use client";

import React, { createContext, useCallback, useMemo, useRef, useState } from "react";
import {
	FaCircleCheck,
	FaCircleInfo,
	FaTriangleExclamation,
	FaXmark,
} from "react-icons/fa6";

export type ToastVariant = "success" | "error" | "info";

export interface ToastItem {
	id: string;
	title: string;
	message?: string;
	variant: ToastVariant;
	durationMs?: number;
}

interface ToastContextValue {
	toasts: ToastItem[];
	showToast: (toast: Omit<ToastItem, "id">) => string;
	success: (title: string, message?: string, durationMs?: number) => string;
	error: (title: string, message?: string, durationMs?: number) => string;
	info: (title: string, message?: string, durationMs?: number) => string;
	removeToast: (id: string) => void;
	clearToasts: () => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION_MS = 4000;

function variantClasses(variant: ToastVariant): {
	card: string;
	iconWrap: string;
	Icon: React.ComponentType<{ className?: string }>;
} {
	switch (variant) {
		case "success":
			return {
				card: "border-emerald-700/70 bg-emerald-950/40",
				iconWrap: "text-emerald-400",
				Icon: FaCircleCheck,
			};
		case "error":
			return {
				card: "border-red-700/70 bg-red-950/40",
				iconWrap: "text-red-400",
				Icon: FaTriangleExclamation,
			};
		case "info":
		default:
			return {
				card: "border-blue-700/70 bg-blue-950/40",
				iconWrap: "text-blue-400",
				Icon: FaCircleInfo,
			};
	}
}

export default function ToastProvider({ children }: { children: React.ReactNode }) {
	const [toasts, setToasts] = useState<ToastItem[]>([]);
	const timeoutMapRef = useRef<Map<string, number>>(new Map());

	const removeToast = useCallback((id: string) => {
		setToasts((prev) => prev.filter((toast) => toast.id !== id));

		const timeoutId = timeoutMapRef.current.get(id);
		if (timeoutId) {
			window.clearTimeout(timeoutId);
			timeoutMapRef.current.delete(id);
		}
	}, []);

	const showToast = useCallback(
		(toast: Omit<ToastItem, "id">) => {
			const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
			const duration = toast.durationMs ?? DEFAULT_DURATION_MS;

			setToasts((prev) => [...prev, { ...toast, id }]);

			const timeoutId = window.setTimeout(
				() => {
					removeToast(id);
				},
				Math.max(1000, duration)
			);

			timeoutMapRef.current.set(id, timeoutId);
			return id;
		},
		[removeToast]
	);

	const success = useCallback(
		(title: string, message?: string, durationMs?: number) =>
			showToast({ title, message, variant: "success", durationMs }),
		[showToast]
	);

	const error = useCallback(
		(title: string, message?: string, durationMs?: number) =>
			showToast({ title, message, variant: "error", durationMs }),
		[showToast]
	);

	const info = useCallback(
		(title: string, message?: string, durationMs?: number) =>
			showToast({ title, message, variant: "info", durationMs }),
		[showToast]
	);

	const clearToasts = useCallback(() => {
		timeoutMapRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
		timeoutMapRef.current.clear();
		setToasts([]);
	}, []);

	const value = useMemo<ToastContextValue>(
		() => ({
			toasts,
			showToast,
			success,
			error,
			info,
			removeToast,
			clearToasts,
		}),
		[toasts, showToast, success, error, info, removeToast, clearToasts]
	);

	return (
		<ToastContext.Provider value={value}>
			{children}

			<div
				className="fixed top-4 right-4 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3 pointer-events-none"
				style={{ zIndex: 60 }}
				aria-live="polite"
				aria-atomic="true"
			>
				{toasts.map((toast) => {
					const { card, iconWrap, Icon } = variantClasses(toast.variant);

					return (
						<div
							key={toast.id}
							className={`pointer-events-auto rounded-sm border px-4 py-3 shadow-[0_0_30px_rgba(0,0,0,0.5)] backdrop-blur-md ${card}`}
							role="status"
						>
							<div className="flex items-start gap-3">
								<Icon className={`mt-0.5 h-4 w-4 shrink-0 ${iconWrap}`} />
								<div className="min-w-0 flex-1">
									<p className="text-sm font-bold text-neutral-100">{toast.title}</p>
									{toast.message ? (
										<p className="mt-1 text-xs text-neutral-300">{toast.message}</p>
									) : null}
								</div>
								<button
									type="button"
									onClick={() => removeToast(toast.id)}
									className="rounded-sm border border-neutral-700 bg-neutral-900/50 p-1 text-neutral-400 transition-colors hover:text-white cursor-pointer"
									aria-label="Dismiss toast"
								>
									<FaXmark className="h-3.5 w-3.5" />
								</button>
							</div>
						</div>
					);
				})}
			</div>
		</ToastContext.Provider>
	);
}
