import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import DiscordProvider from "next-auth/providers/discord";
import { db } from "../db";
import { users } from "../db/schema";
import {
	createDiscordOnboardingToken,
	extractDiscordProfileData,
	verifyDiscordLoginToken,
} from "./discord-auth";
import { rateLimit } from "./rate-limit";
import { getClientIpFromHeaders } from "./request";

const providers: NextAuthOptions["providers"] = [
	CredentialsProvider({
		name: "Credentials",
		credentials: {
			username: { label: "Username/Email", type: "text" },
			password: { label: "Password", type: "password" },
		},
		async authorize(credentials, req) {
			if (!credentials?.username || !credentials?.password) {
				return null;
			}

			const username = credentials.username.trim();
			const clientIp = getClientIpFromHeaders(req?.headers);
			const loginLimit = rateLimit({
				key: `auth:login:${clientIp}:${username.toLowerCase()}`,
				limit: 10,
				windowMs: 10 * 60 * 1000, // 10 minutes
			});

			if (!loginLimit.success) {
				console.warn(
					`Login rate limit exceeded for username="${username}" ip="${clientIp}"`
				);
				return null;
			}

			try {
				const userResult = await db
					.select()
					.from(users)
					.where(eq(users.username, username))
					.limit(1);

				const user = userResult[0];

				if (!user) {
					return null;
				}

				const isPasswordValid = await bcrypt.compare(
					credentials.password,
					user.password
				);

				if (!isPasswordValid) {
					return null;
				}

				return {
					id: user.id,
					name: user.username,
				};
			} catch (error) {
				console.error("Database error during authorization:", error);
				return null;
			}
		},
	}),
	CredentialsProvider({
		id: "discord-token",
		name: "Discord Token",
		credentials: {
			token: { label: "Token", type: "text" },
		},
		async authorize(credentials) {
			const token = credentials?.token?.trim();
			const secret = process.env.NEXTAUTH_SECRET;

			if (!token || !secret) {
				return null;
			}

			const payload = verifyDiscordLoginToken(token, secret);
			if (!payload) {
				return null;
			}

			const userResult = await db
				.select({ id: users.id, username: users.username })
				.from(users)
				.where(eq(users.id, payload.userId))
				.limit(1);

			const user = userResult[0];
			if (!user) {
				return null;
			}

			return {
				id: user.id,
				name: user.username,
			};
		},
	}),
];

if (process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET) {
	providers.push(
		DiscordProvider({
			clientId: process.env.DISCORD_CLIENT_ID,
			clientSecret: process.env.DISCORD_CLIENT_SECRET,
		})
	);
}

export const authOptions: NextAuthOptions = {
	providers,
	pages: {
		signIn: "/login",
	},
	session: {
		strategy: "jwt",
	},
	callbacks: {
		async signIn({ user, account, profile }) {
			if (account?.provider !== "discord") {
				return true;
			}

			const secret = process.env.NEXTAUTH_SECRET;
			if (!secret) {
				console.error("NEXTAUTH_SECRET is missing.");
				return false;
			}

			const discordData = extractDiscordProfileData(
				profile as
					| {
							id?: string;
							username?: string;
							discriminator?: string;
							avatar?: string | null;
					  }
					| undefined
			);

			if (!discordData) {
				return false;
			}

			try {
				const existingUserResult = await db
					.select({ id: users.id, username: users.username })
					.from(users)
					.where(eq(users.discordId, discordData.discordId))
					.limit(1);

				const existingUser = existingUserResult[0];
				if (existingUser) {
					(user as { id?: string; name?: string | null }).id = existingUser.id;
					user.name = existingUser.username;
					return true;
				}

				const onboardingToken = createDiscordOnboardingToken(
					{
						discordId: discordData.discordId,
						preferredAccountUsername: discordData.preferredAccountUsername,
						discordDisplayName: discordData.discordDisplayName,
						discordAvatarUrl: discordData.discordAvatarUrl,
					},
					secret
				);

				return `/signup/discord?token=${encodeURIComponent(onboardingToken)}`;
			} catch (error) {
				console.error("Discord sign-in database lookup failed:", error);
				return "/login?error=DiscordLoginUnavailable";
			}
		},
		async jwt({ token, user }) {
			if (user) {
				token.id = user.id;
			}
			return token;
		},
		async session({ session, token }) {
			if (token && session.user) {
				(session.user as { id?: string }).id = token.id as string | undefined;
			}
			return session;
		},
	},
	secret: process.env.NEXTAUTH_SECRET!,
};