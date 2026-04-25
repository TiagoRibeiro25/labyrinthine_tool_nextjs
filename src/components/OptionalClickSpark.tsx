"use client";

import { type ReactNode, useSyncExternalStore } from "react";
import {
	CLICK_SPARK_DISABLED_STORAGE_KEY,
	CLICK_SPARK_PREFERENCE_CHANGED_EVENT,
} from "../constants/ui";
import ClickSpark from "./ClickSpark";

interface OptionalClickSparkProps {
	children: ReactNode;
}

function readClickSparkDisabledPreference(): boolean {
	if (typeof window === "undefined") {
		return false;
	}

	return window.localStorage.getItem(CLICK_SPARK_DISABLED_STORAGE_KEY) === "true";
}

function subscribeToClickSparkPreference(onStoreChange: () => void): () => void {
	if (typeof window === "undefined") {
		return () => {};
	}

	const handleStorage = (event: StorageEvent) => {
		if (event.key === CLICK_SPARK_DISABLED_STORAGE_KEY) {
			onStoreChange();
		}
	};

	window.addEventListener("storage", handleStorage);
	window.addEventListener(CLICK_SPARK_PREFERENCE_CHANGED_EVENT, onStoreChange);

	return () => {
		window.removeEventListener("storage", handleStorage);
		window.removeEventListener(CLICK_SPARK_PREFERENCE_CHANGED_EVENT, onStoreChange);
	};
}

export default function OptionalClickSpark({ children }: OptionalClickSparkProps) {
	const isClickSparkDisabled = useSyncExternalStore(
		subscribeToClickSparkPreference,
		readClickSparkDisabledPreference,
		() => false
	);

	if (isClickSparkDisabled) {
		return <>{children}</>;
	}

	return (
		<ClickSpark
			sparkColor="#f5f5f5"
			sparkSize={14}
			sparkRadius={18}
			sparkCount={10}
			duration={500}
			easing="ease-out"
			extraScale={1}
		>
			{children}
		</ClickSpark>
	);
}
