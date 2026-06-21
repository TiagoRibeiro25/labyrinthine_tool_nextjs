import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "./auth";
import { getFirstZodErrorMessage } from "./validation";
import type { ZodSchema } from "zod";

interface PaginationResult {
	page: number;
	limit: number;
	totalItems: number;
	totalPages: number;
	hasNextPage: boolean;
	hasPreviousPage: boolean;
}

export async function requireSession(): Promise<
	{ userId: string } | { error: NextResponse }
> {
	const session = await getServerSession(authOptions);
	const sessionUser = session?.user as { id?: string } | undefined;

	if (!sessionUser?.id) {
		return {
			error: NextResponse.json({ message: "Unauthorized." }, { status: 401 }),
		};
	}

	return { userId: sessionUser.id };
}

export function computePagination(
	totalItems: number,
	page: number,
	limit: number
): PaginationResult {
	const totalPages = Math.max(1, Math.ceil(totalItems / limit));
	const safePage = Math.min(page, totalPages);

	return {
		page: safePage,
		limit,
		totalItems,
		totalPages,
		hasNextPage: safePage < totalPages,
		hasPreviousPage: safePage > 1,
	};
}

export function computeOffset(page: number, limit: number): number {
	return (page - 1) * limit;
}

export async function parseBody<T>(
	req: Request,
	schema: ZodSchema<T>
): Promise<{ data: T } | { error: NextResponse }> {
	let body: unknown;
	try {
		body = await req.json();
	} catch {
		return {
			error: NextResponse.json({ message: "Invalid JSON body." }, { status: 400 }),
		};
	}

	const parsed = schema.safeParse(body);
	if (!parsed.success) {
		return {
			error: NextResponse.json(
				{ message: getFirstZodErrorMessage(parsed.error) },
				{ status: 400 }
			),
		};
	}

	return { data: parsed.data };
}
