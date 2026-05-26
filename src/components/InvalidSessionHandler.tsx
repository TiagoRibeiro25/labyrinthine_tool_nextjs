"use client";

import { useSession } from "next-auth/react";
import { useEffect, useRef } from "react";
import { invalidateClientSession } from "../lib/invalidate-client-session";

export default function InvalidSessionHandler() {
	const { data: session, status } = useSession();
	const hasHandledInvalidSession = useRef(false);

	useEffect(() => {
		if (hasHandledInvalidSession.current || status !== "authenticated") {
			return;
		}

		const sessionUser = session?.user as { id?: string } | undefined;
		const userId = sessionUser?.id;
		const isExpired =
			typeof session?.expires === "string" && new Date(session.expires) <= new Date();

		if (!userId || isExpired) {
			hasHandledInvalidSession.current = true;
			void invalidateClientSession();
		}
	}, [session, status]);

	return null;
}
