import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import {
	STEAM_OAUTH_RETURN_TO_COOKIE,
	STEAM_OAUTH_STATE_COOKIE,
} from "../../../../../constants/auth";
import { db } from "../../../../../db";
import { users } from "../../../../../db/schema";
import { authOptions } from "../../../../../lib/auth";

interface SteamPlayerSummary {
	personaname?: string;
	profileurl?: string;
	avatar?: string;
	avatarmedium?: string;
	avatarfull?: string;
}

interface SteamPlayerSummaryResponse {
	response?: {
		players?: SteamPlayerSummary[];
	};
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

function redirectWithCleanup(req: NextRequest, returnTo: string) {
	const response = NextResponse.redirect(new URL(returnTo, req.nextUrl.origin));
	response.cookies.set({
		name: STEAM_OAUTH_STATE_COOKIE,
		value: "",
		path: "/",
		maxAge: 0,
	});
	response.cookies.set({
		name: STEAM_OAUTH_RETURN_TO_COOKIE,
		value: "",
		path: "/",
		maxAge: 0,
	});
	return response;
}

function getSteamIdFromClaimedId(claimedId: string | null): string | null {
	if (!claimedId) {
		return null;
	}

	const match = claimedId.match(/^https?:\/\/steamcommunity\.com\/openid\/id\/(\d+)$/i);
	return match?.[1] ?? null;
}

export async function GET(req: NextRequest) {
	const returnTo = sanitizeReturnTo(req.cookies.get(STEAM_OAUTH_RETURN_TO_COOKIE)?.value);
	const expectedState = req.cookies.get(STEAM_OAUTH_STATE_COOKIE)?.value;
	const state = req.nextUrl.searchParams.get("state");
	const steamApiKey = process.env.STEAM_API_KEY;

	const session = await getServerSession(authOptions);
	const sessionUser = session?.user as { id?: string } | undefined;

	if (!session || !sessionUser?.id) {
		return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
	}

	if (!expectedState || !state || expectedState !== state) {
		return redirectWithCleanup(req, returnTo);
	}

	if (!steamApiKey) {
		return NextResponse.json(
			{ message: "Steam OAuth is not configured." },
			{ status: 500 }
		);
	}

	try {
		const validationParams = new URLSearchParams(req.nextUrl.searchParams);
		validationParams.set("openid.mode", "check_authentication");

		const validationResponse = await fetch("https://steamcommunity.com/openid/login", {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: validationParams,
		});

		if (!validationResponse.ok) {
			throw new Error(`Steam OpenID verification failed (${validationResponse.status}).`);
		}

		const validationText = await validationResponse.text();
		if (!validationText.includes("is_valid:true")) {
			throw new Error("Steam OpenID assertion is invalid.");
		}

		const steamId = getSteamIdFromClaimedId(
			req.nextUrl.searchParams.get("openid.claimed_id")
		);
		if (!steamId) {
			throw new Error("Steam OpenID response missing a valid Steam ID.");
		}

		const profileResponse = await fetch(
			`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${encodeURIComponent(
				steamApiKey
			)}&steamids=${encodeURIComponent(steamId)}`
		);

		if (!profileResponse.ok) {
			throw new Error(`Steam profile fetch failed (${profileResponse.status}).`);
		}

		const profileData = (await profileResponse.json()) as SteamPlayerSummaryResponse;
		const steamProfile = profileData.response?.players?.[0];
		const steamUsername = steamProfile?.personaname || null;
		const steamAvatarUrl =
			steamProfile?.avatarfull ||
			steamProfile?.avatarmedium ||
			steamProfile?.avatar ||
			null;
		const steamProfileUrl =
			steamProfile?.profileurl || `https://steamcommunity.com/profiles/${steamId}`;

		await db
			.update(users)
			.set({
				steamUsername,
				steamAvatarUrl,
				steamProfileUrl,
				updatedAt: new Date(),
			})
			.where(eq(users.id, sessionUser.id));
	} catch (error) {
		console.error("Steam OAuth callback failed:", error);
	}

	return redirectWithCleanup(req, returnTo);
}
