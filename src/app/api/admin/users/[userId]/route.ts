import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "../../../../../db";
import { users } from "../../../../../db/schema";
import { requireAdminWithUserId } from "../../../../../lib/admin-access";
import { parseBody } from "../../../../../lib/api-helpers";
import {
	adminDeleteUserBodySchema,
} from "../../../../../lib/validation";

export async function DELETE(
	req: Request,
	context: { params: Promise<{ userId: string }> }
) {
	try {
		const { userId } = await context.params;
		const adminCheck = await requireAdminWithUserId(userId);
		if ("error" in adminCheck) return adminCheck.error;

		if (userId === adminCheck.admin.id) {
			return NextResponse.json(
				{ message: "You cannot delete your own account from the admin panel." },
				{ status: 400 }
			);
		}

		const parsed = await parseBody(req, adminDeleteUserBodySchema);
		if ("error" in parsed) return parsed.error;

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
