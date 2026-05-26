"use client";

import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { type PropsWithChildren } from "react";
import InvalidSessionHandler from "@/components/InvalidSessionHandler";
import ToastProvider from "@/components/toast/ToastProvider";

interface AppProvidersProps extends PropsWithChildren {
	session: Session | null;
}

export default function AppProviders({ children, session }: AppProvidersProps) {
	return (
		<SessionProvider session={session} refetchOnWindowFocus={false}>
			<InvalidSessionHandler />
			<ToastProvider>{children}</ToastProvider>
		</SessionProvider>
	);
}
