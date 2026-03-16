import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../../../db";
import { users } from "../../../db/schema";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { username, password } = body;

        // Basic validation
        if (!username || !password) {
            return NextResponse.json(
                { message: "Username and password are required." },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { message: "Password must be at least 6 characters long." },
                { status: 400 }
            );
        }

        // Check if the user already exists in the database
        const existingUserResult = await db
            .select()
            .from(users)
            .where(eq(users.username, username))
            .limit(1);

        if (existingUserResult.length > 0) {
            return NextResponse.json(
                { message: "A user with this username already exists." },
                { status: 409 }
            );
        }

        // Hash the password before storing it
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert the new user into the database
        await db.insert(users).values({
            username,
            password: hashedPassword,
        });

        return NextResponse.json(
            { message: "User registered successfully." },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error during registration:", error);
        return NextResponse.json(
            { message: "An internal server error occurred." },
            { status: 500 }
        );
    }
}
