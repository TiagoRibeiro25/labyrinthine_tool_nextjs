import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "../../../../../db";
import { users } from "../../../../../db/schema";
import { requireAdministrator } from "../../../../../lib/admin-access";
import {
	adminDeleteUserBodySchema,
	getFirstZodErrorMessage,
} from "../../../../../lib/validation";

export async function DELETE(
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

		if (userId === adminCheck.admin.id) {
			return NextResponse.json(
				{ message: "You cannot delete your own account from the admin panel." },
				{ status: 400 }
			);
		}

		let body: unknown;
		try {
			body = await req.json();
		} catch {
			return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
		}

		const parsed = adminDeleteUserBodySchema.safeParse(body);

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
				isAdministrator: users.isAdministrator,
			})
			.from(users)
			.where(eq(users.id, userId))
			.limit(1);

		const targetUser = targetUserResult[0];

		if (!targetUser) {
			return NextResponse.json({ message: "User not found." }, { status: 404 });
		}

		if (targetUser.isAdministrator) {
			return NextResponse.json(
				{ message: "Administrator accounts cannot be deleted." },
				{ status: 400 }
			);
		}

		if (parsed.data.confirmationUsername !== targetUser.username) {
			return NextResponse.json(
				{ message: "Confirmation username does not match the target account." },
				{ status: 400 }
			);
		}

		await db.delete(users).where(eq(users.id, userId));

		return NextResponse.json(
			{ message: `Account "${targetUser.username}" deleted successfully.` },
			{ status: 200 }
		);
	} catch (error) {
		console.error("Error deleting user as admin:", error);
		return NextResponse.json(
			{ message: "An internal server error occurred." },
			{ status: 500 }
		);
	}
}
