"use client";

import { type PropsWithChildren } from "react";
import ToastProvider from "@/components/toast/ToastProvider";

export default function AppProviders({ children }: PropsWithChildren) {
	return <ToastProvider>{children}</ToastProvider>;
}
