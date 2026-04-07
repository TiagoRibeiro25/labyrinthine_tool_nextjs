import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function proxy(req: NextRequest) {
	// Retrieve the current user's session token
	const token = await getToken({
		req,
		secret: process.env.NEXTAUTH_SECRET || "labyrinthine_super_secret_dev_key",
	});

	const isAuthPage =
		req.nextUrl.pathname.startsWith("/login") ||
		req.nextUrl.pathname.startsWith("/signup");

	// If the user is logged in and trying to access an authentication page,
	// redirect them to the dashboard.
	if (isAuthPage) {
		if (token) {
			return NextResponse.redirect(new URL("/dashboard", req.url));
		}
		return NextResponse.next();
	}

	// If the user is NOT logged in and trying to access a protected route
	// (any route matched by the config below that isn't an auth page),
	// redirect them to the login page.
	if (!token) {
		let from = req.nextUrl.pathname;
		if (req.nextUrl.search) {
			from += req.nextUrl.search;
		}

		return NextResponse.redirect(
			new URL(`/login?callbackUrl=${encodeURIComponent(from)}`, req.url)
		);
	}

	return NextResponse.next();
}

// Specify the paths that the middleware will run on.
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
