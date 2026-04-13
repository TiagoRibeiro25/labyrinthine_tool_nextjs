import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../../../../../lib/auth";

const STEAM_STATE_COOKIE = "steam_oauth_state";
const STEAM_RETURN_TO_COOKIE = "steam_oauth_return_to";

function sanitizeReturnTo(returnTo: string | null): string {
	if (!returnTo) {
		return "/";
	}

	if (!returnTo.startsWith("/") || returnTo.startsWith("//")) {
		return "/";
	}

	return returnTo;
}

export async function GET(req: NextRequest) {
	const session = await getServerSession(authOptions);
	const sessionUser = session?.user as { id?: string } | undefined;

	if (!session || !sessionUser?.id) {
		return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
	}

	const steamApiKey = process.env.STEAM_API_KEY ?? process.env.STEAM_SECRET;
	if (!steamApiKey) {
		return NextResponse.json(
			{ message: "Steam OAuth is not configured." },
			{ status: 500 }
		);
	}

	const state = crypto.randomUUID();
	const returnTo = sanitizeReturnTo(req.nextUrl.searchParams.get("returnTo"));

	const callbackUrl = new URL("/api/auth/callback/steam", req.nextUrl.origin);
	callbackUrl.searchParams.set("state", state);

	const authorizeUrl = new URL("https://steamcommunity.com/openid/login");
	authorizeUrl.searchParams.set("openid.ns", "http://specs.openid.net/auth/2.0");
	authorizeUrl.searchParams.set("openid.mode", "checkid_setup");
	authorizeUrl.searchParams.set(
		"openid.identity",
		"http://specs.openid.net/auth/2.0/identifier_select"
	);
	authorizeUrl.searchParams.set(
		"openid.claimed_id",
		"http://specs.openid.net/auth/2.0/identifier_select"
	);
	authorizeUrl.searchParams.set("openid.return_to", callbackUrl.toString());
	authorizeUrl.searchParams.set("openid.realm", req.nextUrl.origin);

	const response = NextResponse.redirect(authorizeUrl.toString());
	const secureCookie = process.env.NODE_ENV === "production";

	response.cookies.set({
		name: STEAM_STATE_COOKIE,
		value: state,
		httpOnly: true,
		secure: secureCookie,
		sameSite: "lax",
		path: "/",
		maxAge: 10 * 60,
	});

	response.cookies.set({
		name: STEAM_RETURN_TO_COOKIE,
		value: returnTo,
		httpOnly: true,
		secure: secureCookie,
		sameSite: "lax",
		path: "/",
		maxAge: 10 * 60,
	});

	return response;
}
