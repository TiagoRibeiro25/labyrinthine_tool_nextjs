import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "../../../../../../db";
import { users } from "../../../../../../db/schema";
import { requireAdminWithUserId } from "../../../../../../lib/admin-access";
import { parseBody } from "../../../../../../lib/api-helpers";
import { adminChangeUsernameBodySchema } from "../../../../../../lib/validation";

export async function PATCH(
	req: Request,
	context: { params: Promise<{ userId: string }> }
) {
	try {
		const { userId } = await context.params;
		const adminCheck = await requireAdminWithUserId(userId);
		if ("error" in adminCheck) return adminCheck.error;

		const parsed = await parseBody(req, adminChangeUsernameBodySchema);
		if ("error" in parsed) return parsed.error;

		// Check if the new username is already taken (case-insensitive)
		const existingUserResult = await db
			.select({ id: users.id })
			.from(users)
			.where(sql`lower(${users.username}) = ${parsed.data.username.toLowerCase()}`)
			.limit(1);

		if (existingUserResult.length > 0) {
			return NextResponse.json(
				{ message: "This username is already taken." },
				{ status: 400 }
			);
		}

		const targetUserResult = await db
			.select({
				id: users.id,
				username: users.username,
				createdViaDiscord: users.createdViaDiscord,
			})
			.from(users)
			.where(eq(users.id, userId))
			.limit(1);

		const targetUser = targetUserResult[0];

		if (!targetUser) {
			return NextResponse.json({ message: "User not found." }, { status: 404 });
		}

		await db
			.update(users)
			.set({ username: parsed.data.username, updatedAt: new Date() })
			.where(eq(users.id, userId));

		return NextResponse.json(
			{ message: `${targetUser.username} is now ${parsed.data.username}.` },
			{ status: 200 }
		);
	} catch (error) {
		console.error("Error changing username as admin:", error);
		return NextResponse.json(
			{ message: "An internal server error occurred." },
			{ status: 500 }
		);
	}
}
