"use client";

import { useEffect, useState } from "react";

/**
 * Returns true when the current pointer is likely coarse (touch/stylus),
 * making drag-and-drop harder. Used to switch to tap-based controls.
 */
export default function useCoarsePointer() {
	const [isCoarse, setIsCoarse] = useState(false);

	useEffect(() => {
		if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;

		const coarseQuery = window.matchMedia("(hover: none) and (pointer: coarse)");
		// Most phones are touch devices but some browsers may not report `pointer: coarse` reliably.
		// Use viewport fallback to ensure tap mode works.
		const mobileQuery = window.matchMedia("(max-width: 640px)");

		const update = () => {
			const hasTouchEvents = "ontouchstart" in window;
			const hasTouchPoints =
				typeof navigator !== "undefined" && typeof navigator.maxTouchPoints === "number" && navigator.maxTouchPoints > 0;
			setIsCoarse(coarseQuery.matches || mobileQuery.matches || hasTouchEvents || hasTouchPoints);
		};
		update();

		// Safari fallback
		if (typeof coarseQuery.addEventListener === "function" && typeof mobileQuery.addEventListener === "function") {
			coarseQuery.addEventListener("change", update);
			mobileQuery.addEventListener("change", update);
			return () => {
				coarseQuery.removeEventListener("change", update);
				mobileQuery.removeEventListener("change", update);
			};
		}

		coarseQuery.addListener(update);
		mobileQuery.addListener(update);
		return () => {
			coarseQuery.removeListener(update);
			mobileQuery.removeListener(update);
		};
	}, []);

	return isCoarse;
}

