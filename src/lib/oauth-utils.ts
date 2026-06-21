import { eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "../db";
import { users } from "../db/schema";

export function sanitizeReturnTo(returnTo: string | null | undefined): string {
	if (!returnTo) {
		return "/";
	}

	if (!returnTo.startsWith("/") || returnTo.startsWith("//")) {
		return "/";
	}

	return returnTo;
}

export function createCleanupRedirect(
	req: NextRequest,
	returnTo: string,
	stateCookie: string,
	returnToCookie: string,
): NextResponse {
	const response = NextResponse.redirect(new URL(returnTo, req.nextUrl.origin));
	response.cookies.set({
		name: stateCookie,
		value: "",
		path: "/",
		maxAge: 0,
	});
	response.cookies.set({
		name: returnToCookie,
		value: "",
		path: "/",
		maxAge: 0,
	});
	return response;
}

export async function updateUserProfile(
	userId: string,
	fields: Record<string, unknown>,
) {
	await db
		.update(users)
		.set({ ...fields, updatedAt: new Date() })
		.where(eq(users.id, userId));
}
