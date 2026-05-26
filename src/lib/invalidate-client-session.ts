let invalidationInProgress = false;

export async function invalidateClientSession(): Promise<void> {
	if (invalidationInProgress || typeof window === "undefined") {
		return;
	}

	invalidationInProgress = true;

	try {
		const { signOut } = await import("next-auth/react");
		await signOut({ callbackUrl: "/login" });
	} finally {
		invalidationInProgress = false;
	}
}
