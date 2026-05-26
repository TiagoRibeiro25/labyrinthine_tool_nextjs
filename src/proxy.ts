import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { clearAuthSessionCookies } from "./lib/auth-cookies";
import { isAuthenticatedToken } from "./lib/auth-token";

export async function proxy(req: NextRequest) {
	const token = await getToken({
		req,
		secret: process.env.NEXTAUTH_SECRET!,
	});

	const isAuthenticated = await isAuthenticatedToken(token);
	const hasStaleToken = Boolean(token) && !isAuthenticated;

	const isAuthPage =
		req.nextUrl.pathname.startsWith("/login") ||
		req.nextUrl.pathname.startsWith("/signup");

	if (isAuthPage) {
		if (isAuthenticated) {
			return NextResponse.redirect(new URL("/dashboard", req.url));
		}

		if (hasStaleToken) {
			const response = NextResponse.next();
			clearAuthSessionCookies(response);
			return response;
		}

		return NextResponse.next();
	}

	if (!isAuthenticated) {
		let from = req.nextUrl.pathname;
		if (req.nextUrl.search) {
			from += req.nextUrl.search;
		}

		const response = NextResponse.redirect(
			new URL(`/login?callbackUrl=${encodeURIComponent(from)}`, req.url)
		);

		if (hasStaleToken) {
			clearAuthSessionCookies(response);
		}

		return response;
	}

	return NextResponse.next();
}

export const config = {
	matcher: [
		"/dashboard/:path*",
		"/friends/:path*",
		"/compare/:path*",
		"/activity/:path*",
		"/notifications/:path*",
		"/admin/:path*",
		"/login",
		"/signup",
	],
};
