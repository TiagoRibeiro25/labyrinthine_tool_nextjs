import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../../../../../lib/auth";

const DISCORD_STATE_COOKIE = "discord_oauth_state";
const DISCORD_RETURN_TO_COOKIE = "discord_oauth_return_to";

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

	const clientId = process.env.DISCORD_CLIENT_ID;
	if (!clientId) {
		return NextResponse.json(
			{ message: "Discord OAuth is not configured." },
			{ status: 500 }
		);
	}

	const state = crypto.randomUUID();
	const returnTo = sanitizeReturnTo(req.nextUrl.searchParams.get("returnTo"));
	const redirectUri = `${req.nextUrl.origin}/api/auth/discord/callback`;

	const authorizeUrl = new URL("https://discord.com/oauth2/authorize");
	authorizeUrl.searchParams.set("client_id", clientId);
	authorizeUrl.searchParams.set("response_type", "code");
	authorizeUrl.searchParams.set("scope", "identify");
	authorizeUrl.searchParams.set("state", state);
	authorizeUrl.searchParams.set("redirect_uri", redirectUri);

	const response = NextResponse.redirect(authorizeUrl.toString());
	const secureCookie = process.env.NODE_ENV === "production";

	response.cookies.set({
		name: DISCORD_STATE_COOKIE,
		value: state,
		httpOnly: true,
		secure: secureCookie,
		sameSite: "lax",
		path: "/",
		maxAge: 10 * 60,
	});

	response.cookies.set({
		name: DISCORD_RETURN_TO_COOKIE,
		value: returnTo,
		httpOnly: true,
		secure: secureCookie,
		sameSite: "lax",
		path: "/",
		maxAge: 10 * 60,
	});

	return response;
}
