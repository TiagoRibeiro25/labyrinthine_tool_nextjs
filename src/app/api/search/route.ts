import { NextResponse } from "next/server";
import { db } from "../../../db";
import { users } from "../../../db/schema";
import { ilike } from "drizzle-orm";
import {
    getFirstZodErrorMessage,
    searchQuerySchema,
} from "../../../lib/validation";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const parsedQuery = searchQuerySchema.safeParse({
            q: searchParams.get("q") ?? "",
        });

        if (!parsedQuery.success) {
            return NextResponse.json(
                { message: getFirstZodErrorMessage(parsedQuery.error) },
                { status: 400 },
            );
        }

        const query = parsedQuery.data.q;

        // Search for users whose username contains the query (case-insensitive)
        const results = await db
            .select({
                id: users.id,
                username: users.username,
                profilePictureId: users.profilePictureId,
                isAdministrator: users.isAdministrator,
            })
            .from(users)
            .where(ilike(users.username, `%${query}%`))
            .limit(20);

        return NextResponse.json(results, { status: 200 });
    } catch (error) {
        console.error("Error searching users:", error);
        return NextResponse.json(
            { message: "An internal server error occurred." },
            { status: 500 },
        );
    }
}
