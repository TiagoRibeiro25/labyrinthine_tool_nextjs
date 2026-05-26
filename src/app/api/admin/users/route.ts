import { desc, ilike } from "drizzle-orm";
import { NextResponse } from "next/server";
import { ADMIN_USERS_LIST_LIMIT } from "../../../../constants/admin";
import { db } from "../../../../db";
import { users } from "../../../../db/schema";
import { requireAdministrator } from "../../../../lib/admin-access";
import {
	adminUsersQuerySchema,
	getFirstZodErrorMessage,
} from "../../../../lib/validation";

export async function GET(req: Request) {
	try {
		const adminCheck = await requireAdministrator();

		if ("error" in adminCheck) {
			return adminCheck.error;
		}

		const { searchParams } = new URL(req.url);
		const parsedQuery = adminUsersQuerySchema.safeParse({
			q: searchParams.get("q") ?? undefined,
		});

		if (!parsedQuery.success) {
			return NextResponse.json(
				{ message: getFirstZodErrorMessage(parsedQuery.error) },
				{ status: 400 }
			);
		}

		const query = parsedQuery.data.q?.trim();

		const results = query
			? await db
					.select({
						id: users.id,
						username: users.username,
						isAdministrator: users.isAdministrator,
						createdViaDiscord: users.createdViaDiscord,
						createdAt: users.createdAt,
					})
					.from(users)
					.where(ilike(users.username, `%${query}%`))
					.orderBy(desc(users.createdAt))
					.limit(ADMIN_USERS_LIST_LIMIT)
			: await db
					.select({
						id: users.id,
						username: users.username,
						isAdministrator: users.isAdministrator,
						createdViaDiscord: users.createdViaDiscord,
						createdAt: users.createdAt,
					})
					.from(users)
					.orderBy(desc(users.createdAt))
					.limit(ADMIN_USERS_LIST_LIMIT);

		return NextResponse.json(
			results.map((user) => ({
				id: user.id,
				username: user.username,
				isAdministrator: user.isAdministrator,
				createdViaDiscord: user.createdViaDiscord,
				createdAt: user.createdAt.toISOString(),
			})),
			{ status: 200 }
		);
	} catch (error) {
		console.error("Error listing admin users:", error);
		return NextResponse.json(
			{ message: "An internal server error occurred." },
			{ status: 500 }
		);
	}
}
