import type { JWT } from "next-auth/jwt";
import { userExistsById } from "./user-exists";

export async function isAuthenticatedToken(token: JWT | null): Promise<boolean> {
	if (!token || token.userDeleted === true) {
		return false;
	}

	const userId = typeof token.id === "string" ? token.id : undefined;

	if (!userId) {
		return false;
	}

	return userExistsById(userId);
}
