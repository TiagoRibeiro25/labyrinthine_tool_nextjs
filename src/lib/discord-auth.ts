import { createHmac, timingSafeEqual } from "crypto";

interface SignedTokenEnvelope<TPayload> {
	payload: TPayload;
	exp: number;
}

export interface DiscordProfileLike {
	id?: string;
	username?: string;
	discriminator?: string;
	avatar?: string | null;
}

export interface DiscordProfileData {
	discordId: string;
	preferredAccountUsername: string;
	discordDisplayName: string;
	discordAvatarUrl: string | null;
}

export interface DiscordOnboardingTokenPayload {
	purpose: "discord-onboarding";
	discordId: string;
	preferredAccountUsername: string;
	discordDisplayName: string;
	discordAvatarUrl: string | null;
}

export interface DiscordLoginTokenPayload {
	purpose: "discord-login";
	userId: string;
}

function base64UrlEncode(value: string): string {
	return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string): string {
	return Buffer.from(value, "base64url").toString("utf8");
}

function sign(message: string, secret: string): string {
	return createHmac("sha256", secret).update(message).digest("base64url");
}

function constantTimeEquals(a: string, b: string): boolean {
	const aBuffer = Buffer.from(a, "utf8");
	const bBuffer = Buffer.from(b, "utf8");

	if (aBuffer.length !== bBuffer.length) {
		return false;
	}

	return timingSafeEqual(aBuffer, bBuffer);
}

function createSignedToken<TPayload extends object>(
	payload: TPayload,
	secret: string,
	expiresInSeconds: number
): string {
	if (!secret) {
		throw new Error("Missing token signing secret.");
	}

	const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
	const envelope: SignedTokenEnvelope<TPayload> = { payload, exp };
	const encodedEnvelope = base64UrlEncode(JSON.stringify(envelope));
	const signature = sign(encodedEnvelope, secret);
	return `${encodedEnvelope}.${signature}`;
}

function verifySignedToken<TPayload extends object>(
	token: string,
	secret: string
): SignedTokenEnvelope<TPayload> | null {
	if (!token || !secret) {
		return null;
	}

	const [encodedEnvelope, tokenSignature, ...rest] = token.split(".");
	if (!encodedEnvelope || !tokenSignature || rest.length > 0) {
		return null;
	}

	const expectedSignature = sign(encodedEnvelope, secret);
	if (!constantTimeEquals(tokenSignature, expectedSignature)) {
		return null;
	}

	try {
		const parsed = JSON.parse(
			base64UrlDecode(encodedEnvelope)
		) as SignedTokenEnvelope<TPayload>;

		if (
			!parsed ||
			typeof parsed !== "object" ||
			typeof parsed.exp !== "number" ||
			!parsed.payload
		) {
			return null;
		}

		const now = Math.floor(Date.now() / 1000);
		if (parsed.exp <= now) {
			return null;
		}

		return parsed;
	} catch {
		return null;
	}
}

export function formatDiscordDisplayName(profile: {
	username: string;
	discriminator?: string;
}): string {
	if (profile.discriminator && profile.discriminator !== "0") {
		return `${profile.username}#${profile.discriminator}`;
	}

	return profile.username;
}

export function getDiscordAvatarUrl(
	discordId: string,
	avatarHash: string | null | undefined
): string | null {
	if (!avatarHash) {
		return null;
	}

	const extension = avatarHash.startsWith("a_") ? "gif" : "png";
	return `https://cdn.discordapp.com/avatars/${discordId}/${avatarHash}.${extension}`;
}

export function extractDiscordProfileData(
	profile: DiscordProfileLike | null | undefined
): DiscordProfileData | null {
	if (!profile?.id || !profile.username) {
		return null;
	}

	return {
		discordId: profile.id,
		preferredAccountUsername: profile.username,
		discordDisplayName: formatDiscordDisplayName({
			username: profile.username,
			discriminator: profile.discriminator,
		}),
		discordAvatarUrl: getDiscordAvatarUrl(profile.id, profile.avatar),
	};
}

export function createDiscordOnboardingToken(
	payload: Omit<DiscordOnboardingTokenPayload, "purpose">,
	secret: string,
	expiresInSeconds = 10 * 60
): string {
	return createSignedToken<DiscordOnboardingTokenPayload>(
		{
			purpose: "discord-onboarding",
			...payload,
		},
		secret,
		expiresInSeconds
	);
}

export function verifyDiscordOnboardingToken(
	token: string,
	secret: string
): DiscordOnboardingTokenPayload | null {
	const envelope = verifySignedToken<DiscordOnboardingTokenPayload>(token, secret);
	if (!envelope) {
		return null;
	}

	const payload = envelope.payload;
	if (
		payload.purpose !== "discord-onboarding" ||
		typeof payload.discordId !== "string" ||
		typeof payload.preferredAccountUsername !== "string" ||
		typeof payload.discordDisplayName !== "string" ||
		(payload.discordAvatarUrl !== null && typeof payload.discordAvatarUrl !== "string")
	) {
		return null;
	}

	return payload;
}

export function createDiscordLoginToken(
	payload: Omit<DiscordLoginTokenPayload, "purpose">,
	secret: string,
	expiresInSeconds = 10 * 60
): string {
	return createSignedToken<DiscordLoginTokenPayload>(
		{
			purpose: "discord-login",
			...payload,
		},
		secret,
		expiresInSeconds
	);
}

export function verifyDiscordLoginToken(
	token: string,
	secret: string
): DiscordLoginTokenPayload | null {
	const envelope = verifySignedToken<DiscordLoginTokenPayload>(token, secret);
	if (!envelope) {
		return null;
	}

	const payload = envelope.payload;
	if (payload.purpose !== "discord-login" || typeof payload.userId !== "string") {
		return null;
	}

	return payload;
}