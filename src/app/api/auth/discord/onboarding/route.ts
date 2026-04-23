import bcrypt from "bcryptjs";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "../../../../../db";
import { users } from "../../../../../db/schema";
import {
	createDiscordLoginToken,
	verifyDiscordOnboardingToken,
} from "../../../../../lib/discord-auth";
import {
	discordOnboardingBodySchema,
	getFirstZodErrorMessage,
	usernameSchema,
} from "../../../../../lib/validation";

function isUniqueViolation(error: unknown) {
	return (
		typeof error === "object" &&
		error !== null &&
		"code" in error &&
		(error as { code?: string }).code === "23505"
	);
}

export async function GET(req: Request) {
	try {
		const url = new URL(req.url);
		const token = url.searchParams.get("token")?.trim();

		if (!token) {
			return NextResponse.json(
				{ message: "Discord onboarding token is required." },
				{ status: 400 }
			);
		}

		const secret = process.env.NEXTAUTH_SECRET;
		if (!secret) {
			return NextResponse.json(
				{ message: "Server auth secret is not configured." },
				{ status: 500 }
			);
		}

		const payload = verifyDiscordOnboardingToken(token, secret);
		if (!payload) {
			return NextResponse.json(
				{ message: "Discord onboarding session is invalid or expired." },
				{ status: 400 }
			);
		}

		return NextResponse.json({
			discordDisplayName: payload.discordDisplayName,
			preferredAccountUsername: payload.preferredAccountUsername,
			discordAvatarUrl: payload.discordAvatarUrl,
		});
	} catch (error) {
		console.error("Discord onboarding GET failed:", error);
		return NextResponse.json(
			{ message: "An internal server error occurred." },
			{ status: 500 }
		);
	}
}

export async function POST(req: Request) {
	try {
		let body: unknown;
		try {
			body = await req.json();
		} catch {
			return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
		}

		const parsed = discordOnboardingBodySchema.safeParse(body);
		if (!parsed.success) {
			return NextResponse.json(
				{ message: getFirstZodErrorMessage(parsed.error) },
				{ status: 400 }
			);
		}

		const secret = process.env.NEXTAUTH_SECRET;
		if (!secret) {
			return NextResponse.json(
				{ message: "Server auth secret is not configured." },
				{ status: 500 }
			);
		}

		const onboardingPayload = verifyDiscordOnboardingToken(parsed.data.token, secret);
		if (!onboardingPayload) {
			return NextResponse.json(
				{ message: "Discord onboarding session is invalid or expired." },
				{ status: 400 }
			);
		}

		const existingDiscordUserResult = await db
			.select({ id: users.id, username: users.username })
			.from(users)
			.where(sql`${users.discordId} = ${onboardingPayload.discordId}`)
			.limit(1);

		const existingDiscordUser = existingDiscordUserResult[0];
		if (existingDiscordUser) {
			const loginToken = createDiscordLoginToken(
				{ userId: existingDiscordUser.id },
				secret
			);

			return NextResponse.json(
				{
					message: "Discord account already linked. Signing in.",
					loginToken,
				},
				{ status: 200 }
			);
		}

		const chosenUsernameRaw =
			parsed.data.username?.trim() || onboardingPayload.preferredAccountUsername.trim();

		const usernameParse = usernameSchema.safeParse(chosenUsernameRaw);
		if (!usernameParse.success) {
			return NextResponse.json(
				{ message: getFirstZodErrorMessage(usernameParse.error) },
				{ status: 400 }
			);
		}

		const chosenUsername = usernameParse.data;

		const existingUsernameResult = await db
			.select({ id: users.id })
			.from(users)
			.where(sql`lower(${users.username}) = ${chosenUsername.toLowerCase()}`)
			.limit(1);

		if (existingUsernameResult.length > 0) {
			return NextResponse.json(
				{ message: "A user with this username already exists." },
				{ status: 409 }
			);
		}

		const generatedPassword = crypto.randomUUID();
		const hashedPassword = await bcrypt.hash(generatedPassword, 10);

		let createdUser:
			| {
					id: string;
					username: string;
			  }
			| undefined;

		try {
			const inserted = await db
				.insert(users)
				.values({
					username: chosenUsername,
					password: hashedPassword,
					profilePictureId: "1",
					profileBannerId: "chap1",
					discordId: onboardingPayload.discordId,
					discordUsername: onboardingPayload.discordDisplayName,
					discordAvatarUrl: onboardingPayload.discordAvatarUrl,
					useDiscordAvatar: onboardingPayload.discordAvatarUrl !== null,
				})
				.returning({ id: users.id, username: users.username });

			createdUser = inserted[0];
		} catch (error) {
			if (isUniqueViolation(error)) {
				return NextResponse.json(
					{ message: "A user with this username already exists." },
					{ status: 409 }
				);
			}
			throw error;
		}

		if (!createdUser) {
			return NextResponse.json(
				{ message: "Failed to create account." },
				{ status: 500 }
			);
		}

		const loginToken = createDiscordLoginToken({ userId: createdUser.id }, secret);

		return NextResponse.json(
			{
				message: "Account created successfully.",
				loginToken,
			},
			{ status: 201 }
		);
	} catch (error) {
		console.error("Discord onboarding POST failed:", error);
		return NextResponse.json(
			{ message: "An internal server error occurred." },
			{ status: 500 }
		);
	}
}