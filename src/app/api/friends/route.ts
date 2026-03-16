import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { db } from "../../../db";
import { friendRequests, users } from "../../../db/schema";
import { and, eq, or } from "drizzle-orm";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        const sessionUser = session?.user as { id?: string } | undefined;

        if (!session || !sessionUser || !sessionUser.id) {
            return NextResponse.json(
                { message: "Unauthorized." },
                { status: 401 },
            );
        }

        const senderId = sessionUser.id;
        const body = await req.json();
        const { action, receiverUsername, requestId } = body;

        // ACTION: ADD FRIEND
        if (action === "add") {
            if (!receiverUsername) {
                return NextResponse.json(
                    { message: "Receiver username is required." },
                    { status: 400 },
                );
            }

            // Find receiver user
            const receiverResult = await db
                .select()
                .from(users)
                .where(eq(users.username, receiverUsername))
                .limit(1);

            const receiver = receiverResult[0];

            if (!receiver) {
                return NextResponse.json(
                    { message: "User not found." },
                    { status: 404 },
                );
            }

            if (receiver.id === senderId) {
                return NextResponse.json(
                    { message: "You cannot add yourself as a friend." },
                    { status: 400 },
                );
            }

            // Check if request already exists
            const existingRequest = await db
                .select()
                .from(friendRequests)
                .where(
                    or(
                        and(
                            eq(friendRequests.senderId, senderId),
                            eq(friendRequests.receiverId, receiver.id),
                        ),
                        and(
                            eq(friendRequests.senderId, receiver.id),
                            eq(friendRequests.receiverId, senderId),
                        ),
                    ),
                )
                .limit(1);

            if (existingRequest.length > 0) {
                return NextResponse.json(
                    {
                        message:
                            "Friend request already exists or you are already friends.",
                    },
                    { status: 400 },
                );
            }

            // Create new pending friend request
            await db.insert(friendRequests).values({
                senderId: senderId,
                receiverId: receiver.id,
                status: "pending",
            });

            return NextResponse.json(
                { message: "Friend request sent." },
                { status: 200 },
            );
        }

        // ACTION: ACCEPT FRIEND
        if (action === "accept") {
            if (!requestId) {
                return NextResponse.json(
                    { message: "Request ID is required." },
                    { status: 400 },
                );
            }

            // Verify the request exists and the current user is the receiver
            const targetRequestResult = await db
                .select()
                .from(friendRequests)
                .where(
                    and(
                        eq(friendRequests.id, requestId),
                        eq(friendRequests.receiverId, senderId),
                    ),
                )
                .limit(1);

            const targetRequest = targetRequestResult[0];

            if (!targetRequest) {
                return NextResponse.json(
                    { message: "Friend request not found or unauthorized." },
                    { status: 404 },
                );
            }

            // Update status to accepted
            await db
                .update(friendRequests)
                .set({ status: "accepted" })
                .where(eq(friendRequests.id, requestId));

            return NextResponse.json(
                { message: "Friend request accepted." },
                { status: 200 },
            );
        }

        // ACTION: REJECT OR REMOVE FRIEND
        if (action === "reject" || action === "remove") {
            if (!requestId) {
                return NextResponse.json(
                    { message: "Request ID is required." },
                    { status: 400 },
                );
            }

            // Delete the request (either reject pending or remove accepted)
            // Ensure the user is either the sender or receiver
            await db
                .delete(friendRequests)
                .where(
                    and(
                        eq(friendRequests.id, requestId),
                        or(
                            eq(friendRequests.senderId, senderId),
                            eq(friendRequests.receiverId, senderId),
                        ),
                    ),
                );

            return NextResponse.json(
                { message: "Friend removed/rejected." },
                { status: 200 },
            );
        }

        return NextResponse.json(
            { message: "Invalid action." },
            { status: 400 },
        );
    } catch (error) {
        console.error("Error managing friends:", error);
        return NextResponse.json(
            { message: "An internal server error occurred." },
            { status: 500 },
        );
    }
}
