import { getServerSession, type Session } from "next-auth";
import { cache } from "react";
import { authOptions } from "./auth";
import { userExistsById } from "./user-exists";

export const getValidatedServerSession = cache(async (): Promise<Session | null> => {
	const session = await getServerSession(authOptions);
	const sessionUser = session?.user as { id?: string } | undefined;
	const userId = sessionUser?.id;

	if (!session || !userId) {
		return null;
	}

	if (session.expires && new Date(session.expires) <= new Date()) {
		return null;
	}

	const exists = await userExistsById(userId);
	if (!exists) {
		return null;
	}

	return session;
});
