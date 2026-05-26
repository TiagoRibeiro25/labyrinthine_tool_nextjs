import { eq } from "drizzle-orm";
import { cache } from "react";
import { db } from "../db";
import { users } from "../db/schema";

export const userExistsById = cache(async (userId: string): Promise<boolean> => {
	const result = await db
		.select({ id: users.id })
		.from(users)
		.where(eq(users.id, userId))
		.limit(1);

	return Boolean(result[0]);
});
