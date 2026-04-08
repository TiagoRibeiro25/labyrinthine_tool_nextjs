import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../../db";
import { users } from "../../../../../db/schema";
import { authOptions } from "../../../../../lib/auth";

const DISCORD_STATE_COOKIE = "discord_oauth_state";
const DISCORD_RETURN_TO_COOKIE = "discord_oauth_return_to";

interface DiscordTokenResponse {
	access_token?: string;
}

interface DiscordUserResponse {
	username: string;
	discriminator: string;
}

function sanitizeReturnTo(returnTo: string | null | undefined): string {
	if (!returnTo) {
		return "/";
	}

	if (!returnTo.startsWith("/") || returnTo.startsWith("//")) {
		return "/";
	}

	return returnTo;
}

function formatDiscordUsername(user: DiscordUserResponse): string {
	if (user.discriminator && user.discriminator !== "0") {
		return `${user.username}#${user.discriminator}`;
	}

	return user.username;
}

function redirectWithCleanup(req: NextRequest, returnTo: string) {
	const response = NextResponse.redirect(new URL(returnTo, req.nextUrl.origin));
	response.cookies.set({
		name: DISCORD_STATE_COOKIE,
		value: "",
		path: "/",
		maxAge: 0,
	});
	response.cookies.set({
		name: DISCORD_RETURN_TO_COOKIE,
		value: "",
		path: "/",
		maxAge: 0,
	});
	return response;
}

export async function GET(req: NextRequest) {
	const returnTo = sanitizeReturnTo(req.cookies.get(DISCORD_RETURN_TO_COOKIE)?.value);
	const expectedState = req.cookies.get(DISCORD_STATE_COOKIE)?.value;
	const state = req.nextUrl.searchParams.get("state");
	const code = req.nextUrl.searchParams.get("code");

	const session = await getServerSession(authOptions);
	const sessionUser = session?.user as { id?: string } | undefined;

	if (!session || !sessionUser?.id) {
		return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
	}

	if (!expectedState || !state || expectedState !== state || !code) {
		return redirectWithCleanup(req, returnTo);
	}

	const clientId = process.env.DISCORD_CLIENT_ID;
	const clientSecret = process.env.DISCORD_CLIENT_SECRET;

	if (!clientId || !clientSecret) {
		return NextResponse.json(
			{ message: "Discord OAuth is not configured." },
			{ status: 500 }
		);
	}

	const redirectUri = `${req.nextUrl.origin}/api/auth/callback/discord`;

	try {
		const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: new URLSearchParams({
				client_id: clientId,
				client_secret: clientSecret,
				grant_type: "authorization_code",
				code,
				redirect_uri: redirectUri,
			}),
		});

		if (!tokenResponse.ok) {
			throw new Error(`Discord token exchange failed (${tokenResponse.status}).`);
		}

		const tokenData = (await tokenResponse.json()) as DiscordTokenResponse;
		if (!tokenData.access_token) {
			throw new Error("Discord token response missing access token.");
		}

		const userResponse = await fetch("https://discord.com/api/users/@me", {
			headers: {
				Authorization: `Bearer ${tokenData.access_token}`,
			},
		});

		if (!userResponse.ok) {
			throw new Error(`Discord profile fetch failed (${userResponse.status}).`);
		}

		const discordUser = (await userResponse.json()) as DiscordUserResponse;
		const discordUsername = formatDiscordUsername(discordUser);

		await db
			.update(users)
			.set({ discordUsername, updatedAt: new Date() })
			.where(eq(users.id, sessionUser.id));
	} catch (error) {
		console.error("Discord OAuth callback failed:", error);
	}

	return redirectWithCleanup(req, returnTo);
}
