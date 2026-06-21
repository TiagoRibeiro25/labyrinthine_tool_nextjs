import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "../../../../../../db";
import { users } from "../../../../../../db/schema";
import { requireAdminWithUserId } from "../../../../../../lib/admin-access";
import { parseBody } from "../../../../../../lib/api-helpers";
import {
	adminChangePasswordBodySchema,
} from "../../../../../../lib/validation";

export async function PATCH(
	req: Request,
	context: { params: Promise<{ userId: string }> }
) {
	try {
		const { userId } = await context.params;
		const adminCheck = await requireAdminWithUserId(userId);
		if ("error" in adminCheck) return adminCheck.error;

		const parsed = await parseBody(req, adminChangePasswordBodySchema);
		if ("error" in parsed) return parsed.error;

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

		if (targetUser.createdViaDiscord) {
			return NextResponse.json(
				{
					message: "This account signs in with Discord and does not use a password.",
				},
				{ status: 400 }
			);
		}

		const hashedPassword = await bcrypt.hash(parsed.data.password, 10);

		await db
			.update(users)
			.set({ password: hashedPassword, updatedAt: new Date() })
			.where(eq(users.id, userId));

		return NextResponse.json(
			{ message: `Password updated for "${targetUser.username}".` },
			{ status: 200 }
		);
	} catch (error) {
		console.error("Error changing user password as admin:", error);
		return NextResponse.json(
			{ message: "An internal server error occurred." },
			{ status: 500 }
		);
	}
}
