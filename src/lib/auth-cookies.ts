import type { NextResponse } from "next/server";

const SESSION_COOKIE_NAMES = [
	"next-auth.session-token",
	"__Secure-next-auth.session-token",
	"__Host-next-auth.session-token",
] as const;

export function clearAuthSessionCookies(response: NextResponse): void {
	for (const name of SESSION_COOKIE_NAMES) {
		response.cookies.delete(name);
	}
}
