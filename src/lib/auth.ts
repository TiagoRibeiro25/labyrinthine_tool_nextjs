import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema";
import { getClientIpFromHeaders } from "./request";
import { rateLimit } from "./rate-limit";

export const authOptions: NextAuthOptions = {
    providers: [
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
                    windowMs: 10 * 60 * 1000,
                });

                if (!loginLimit.success) {
                    console.warn(
                        `Login rate limit exceeded for username="${username}" ip="${clientIp}"`,
                    );
                    return null;
                }

                try {
                    // Look up the user in the database
                    const userResult = await db
                        .select()
                        .from(users)
                        .where(eq(users.username, username))
                        .limit(1);

                    const user = userResult[0];

                    if (!user) {
                        return null;
                    }

                    // Verify password
                    const isPasswordValid = await bcrypt.compare(
                        credentials.password,
                        user.password,
                    );

                    if (!isPasswordValid) {
                        return null;
                    }

                    // Return user object for NextAuth session
                    return {
                        id: user.id,
                        name: user.username,
                    };
                } catch (error) {
                    console.error(
                        "Database error during authorization:",
                        error,
                    );
                    return null;
                }
            },
        }),
    ],
    pages: {
        signIn: "/login", // Redirect to custom login page
    },
    session: {
        strategy: "jwt", // Use JSON Web Tokens for session management
    },
    callbacks: {
        async jwt({ token, user }) {
            // Append the user ID to the JWT token on login
            if (user) {
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            // Pass the user ID from the token to the session object
            if (token && session.user) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (session.user as any).id = token.id;
            }
            return session;
        },
    },
    // Use an environment variable for production!
    secret: process.env.NEXTAUTH_SECRET || "labyrinthine_super_secret_dev_key",
};
