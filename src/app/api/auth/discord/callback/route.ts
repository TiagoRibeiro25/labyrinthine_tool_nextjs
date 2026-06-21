import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import {
	DISCORD_OAUTH_RETURN_TO_COOKIE,
	DISCORD_OAUTH_STATE_COOKIE,
} from "../../../../../constants/auth";
import { authOptions } from "../../../../../lib/auth";
import { sanitizeReturnTo, createCleanupRedirect, updateUserProfile } from "../../../../../lib/oauth-utils";
import {
	formatDiscordDisplayName,
	getDiscordAvatarUrl,
} from "../../../../../lib/discord-auth";

interface DiscordTokenResponse {
	access_token?: string;
}

interface DiscordUserResponse {
	id: string;
	username: string;
	discriminator: string;
	avatar: string | null;
}

export async function GET(req: NextRequest) {
	const returnTo = sanitizeReturnTo(
		req.cookies.get(DISCORD_OAUTH_RETURN_TO_COOKIE)?.value
	);
	const expectedState = req.cookies.get(DISCORD_OAUTH_STATE_COOKIE)?.value;
	const state = req.nextUrl.searchParams.get("state");
	const code = req.nextUrl.searchParams.get("code");

	const session = await getServerSession(authOptions);
	const sessionUser = session?.user as { id?: string } | undefined;

	if (!session || !sessionUser?.id) {
		return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
	}

	if (!expectedState || !state || expectedState !== state || !code) {
		return createCleanupRedirect(req, returnTo, DISCORD_OAUTH_STATE_COOKIE, DISCORD_OAUTH_RETURN_TO_COOKIE);
	}

	const clientId = process.env.DISCORD_CLIENT_ID;
	const clientSecret = process.env.DISCORD_CLIENT_SECRET;

	if (!clientId || !clientSecret) {
		return NextResponse.json(
			{ message: "Discord OAuth is not configured." },
			{ status: 500 }
		);
	}

	const redirectUri = `${req.nextUrl.origin}/api/auth/discord/callback`;

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
		const discordUsername = formatDiscordDisplayName(discordUser);
		const discordAvatarUrl = getDiscordAvatarUrl(discordUser.id, discordUser.avatar);

		await updateUserProfile(sessionUser.id, {
			discordId: discordUser.id,
			discordUsername,
			discordAvatarUrl,
		});
	} catch (error) {
		console.error("Discord OAuth callback failed:", error);
	}

	return createCleanupRedirect(req, returnTo, DISCORD_OAUTH_STATE_COOKIE, DISCORD_OAUTH_RETURN_TO_COOKIE);
}
