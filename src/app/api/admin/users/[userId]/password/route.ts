import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "../../../../../../db";
import { users } from "../../../../../../db/schema";
import { requireAdministrator } from "../../../../../../lib/admin-access";
import {
	adminChangePasswordBodySchema,
	getFirstZodErrorMessage,
} from "../../../../../../lib/validation";

export async function PATCH(
	req: Request,
	context: { params: Promise<{ userId: string }> }
) {
	try {
		const adminCheck = await requireAdministrator();

		if ("error" in adminCheck) {
			return adminCheck.error;
		}

		const { userId } = await context.params;

		if (!/^[0-9a-f-]{36}$/i.test(userId)) {
			return NextResponse.json({ message: "Invalid user ID format." }, { status: 400 });
		}

		let body: unknown;
		try {
			body = await req.json();
		} catch {
			return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
		}

		const parsed = adminChangePasswordBodySchema.safeParse(body);

		if (!parsed.success) {
			return NextResponse.json(
				{ message: getFirstZodErrorMessage(parsed.error) },
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
