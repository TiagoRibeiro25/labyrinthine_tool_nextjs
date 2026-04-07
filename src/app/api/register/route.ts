import bcrypt from "bcryptjs";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "../../../db";
import { users } from "../../../db/schema";
import { rateLimit, toRateLimitHeaders } from "../../../lib/rate-limit";
import { getClientIpFromHeaders } from "../../../lib/request";
import { getFirstZodErrorMessage, registerBodySchema } from "../../../lib/validation";

function isUniqueViolation(error: unknown) {
	return (
		typeof error === "object" &&
		error !== null &&
		"code" in error &&
		(error as { code?: string }).code === "23505"
	);
}

export async function POST(req: Request) {
	try {
		const clientIp = getClientIpFromHeaders(req.headers);

		const ipLimit = rateLimit({
			key: `auth:register:ip:${clientIp}`,
			limit: 6,
			windowMs: 15 * 60 * 1000,
		});

		if (!ipLimit.success) {
			return NextResponse.json(
				{
					message: "Too many registration attempts. Please try again later.",
				},
				{ status: 429, headers: toRateLimitHeaders(ipLimit) }
			);
		}

		let body: unknown;
		try {
			body = await req.json();
		} catch {
			return NextResponse.json(
				{ message: "Invalid JSON body." },
				{ status: 400, headers: toRateLimitHeaders(ipLimit) }
			);
		}

		const parsed = registerBodySchema.safeParse(body);

		if (!parsed.success) {
			return NextResponse.json(
				{ message: getFirstZodErrorMessage(parsed.error) },
				{ status: 400, headers: toRateLimitHeaders(ipLimit) }
			);
		}

		const { username, password } = parsed.data;

		const usernameLimit = rateLimit({
			key: `auth:register:username:${username.toLowerCase()}`,
			limit: 4,
			windowMs: 15 * 60 * 1000,
		});

		if (!usernameLimit.success) {
			return NextResponse.json(
				{
					message: "Too many attempts for this username. Please try again later.",
				},
				{ status: 429, headers: toRateLimitHeaders(usernameLimit) }
			);
		}

		const existingUserResult = await db
			.select()
			.from(users)
			.where(sql`lower(${users.username}) = ${username.toLowerCase()}`)
			.limit(1);

		if (existingUserResult.length > 0) {
			return NextResponse.json(
				{ message: "A user with this username already exists." },
				{ status: 409, headers: toRateLimitHeaders(ipLimit) }
			);
		}

		const hashedPassword = await bcrypt.hash(password, 10);

		try {
			await db.insert(users).values({
				username,
				password: hashedPassword,
				profilePictureId: "1",
				profileBannerId: "chap1",
			});
		} catch (error) {
			if (isUniqueViolation(error)) {
				return NextResponse.json(
					{ message: "A user with this username already exists." },
					{ status: 409, headers: toRateLimitHeaders(ipLimit) }
				);
			}

			throw error;
		}

		return NextResponse.json(
			{ message: "User registered successfully." },
			{ status: 201, headers: toRateLimitHeaders(ipLimit) }
		);
	} catch (error) {
		console.error("Error during registration:", error);
		return NextResponse.json(
			{ message: "An internal server error occurred." },
			{ status: 500 }
		);
	}
}
