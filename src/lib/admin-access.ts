import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { db } from "../db";
import { users } from "../db/schema";
import { authOptions } from "./auth";

export async function requireAdministrator() {
	const session = await getServerSession(authOptions);
	const sessionUser = session?.user as { id?: string } | undefined;

	if (!sessionUser?.id) {
		return {
			error: NextResponse.json({ message: "Unauthorized." }, { status: 401 }),
		} as const;
	}

	const currentUserResult = await db
		.select({ id: users.id, isAdministrator: users.isAdministrator })
		.from(users)
		.where(eq(users.id, sessionUser.id))
		.limit(1);

	const currentUser = currentUserResult[0];

	if (!currentUser) {
		return {
			error: NextResponse.json({ message: "Unauthorized." }, { status: 401 }),
		} as const;
	}

	if (!currentUser.isAdministrator) {
		return {
			error: NextResponse.json({ message: "Forbidden." }, { status: 403 }),
		} as const;
	}

	return { admin: currentUser } as const;
}
