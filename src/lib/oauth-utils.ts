import { eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "../db";
import { users } from "../db/schema";

export function sanitizeReturnTo(returnTo: string | null | undefined): string {
	if (!returnTo) {
		return "/";
	}

	if (
		!returnTo.startsWith("/") ||
		returnTo.startsWith("//") ||
		returnTo.includes("\\") ||
		/[\u0000-\u001f\u007f]/.test(returnTo)
	) {
		return "/";
	}

	try {
		const resolved = new URL(returnTo, "https://oauth.local");
		if (resolved.origin !== "https://oauth.local") {
			return "/";
		}
		return `${resolved.pathname}${resolved.search}${resolved.hash}`;
	} catch {
		return "/";
	}
}

export function createCleanupRedirect(
	req: NextRequest,
	returnTo: string,
	stateCookie: string,
	returnToCookie: string,
): NextResponse {
	const safeReturnTo = sanitizeReturnTo(returnTo);
	const redirectUrl = new URL(safeReturnTo, req.nextUrl.origin);
	if (redirectUrl.origin !== req.nextUrl.origin) {
		redirectUrl.pathname = "/";
		redirectUrl.search = "";
		redirectUrl.hash = "";
	}
	const response = NextResponse.redirect(redirectUrl);
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
