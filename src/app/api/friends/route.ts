import { and, eq, or } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "../../../db";
import { friendRequests, users } from "../../../db/schema";
import { requireSession, parseBody } from "../../../lib/api-helpers";
import { rateLimit, toRateLimitHeaders } from "../../../lib/rate-limit";
import { getClientIpFromHeaders } from "../../../lib/request";
import { createNotifications } from "../../../lib/social";
import { friendsActionSchema } from "../../../lib/validation";

async function findUserByUsername(username: string) {
	const result = await db
		.select()
		.from(users)
		.where(eq(users.username, username))
		.limit(1);
	return result[0] ?? null;
}

async function findExistingFriendRequest(userId1: string, userId2: string) {
	const result = await db
		.select()
		.from(friendRequests)
		.where(
			or(
				and(
					eq(friendRequests.senderId, userId1),
					eq(friendRequests.receiverId, userId2)
				),
				and(
					eq(friendRequests.senderId, userId2),
					eq(friendRequests.receiverId, userId1)
				)
			)
		)
		.limit(1);
	return result[0] ?? null;
}

export async function POST(req: Request) {
	try {
		const auth = await requireSession();
		if ("error" in auth) return auth.error;

		const senderId = auth.userId;
		const currentUserResult = await db
			.select({ username: users.username })
			.from(users)
			.where(eq(users.id, senderId))
			.limit(1);

		const currentUser = currentUserResult[0];

		if (!currentUser) {
			return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
		}

		const clientIp = getClientIpFromHeaders(req.headers);

		const userRateLimit = rateLimit({
			key: `friends:user:${senderId}`,
			limit: 80,
			windowMs: 60 * 1000,
		});

		if (!userRateLimit.success) {
			return NextResponse.json(
				{
					message:
						"Too many friend actions in a short period. Please try again in a moment.",
				},
				{ status: 429, headers: toRateLimitHeaders(userRateLimit) }
			);
		}

		const parsed = await parseBody(req, friendsActionSchema);
		if ("error" in parsed) {
			return NextResponse.json(
				{ message: "Invalid JSON body." },
				{ status: 400, headers: toRateLimitHeaders(userRateLimit) }
			);
		}

		const { action, receiverUsername, requestId } = parsed.data;

		if (action === "add") {
			const addRateLimit = rateLimit({
				key: `friends:add:${senderId}:${clientIp}`,
				limit: 20,
				windowMs: 10 * 60 * 1000,
			});

			if (!addRateLimit.success) {
				return NextResponse.json(
					{
						message: "Too many friend request attempts. Please try again later.",
					},
					{ status: 429, headers: toRateLimitHeaders(addRateLimit) }
				);
			}
		}

		// ACTION: ADD FRIEND
		if (action === "add") {
			if (!receiverUsername) {
				return NextResponse.json(
					{ message: "Receiver username is required." },
					{ status: 400 }
				);
			}

			// Find receiver user
			const receiver = await findUserByUsername(receiverUsername);

			if (!receiver) {
				return NextResponse.json({ message: "User not found." }, { status: 404 });
			}

			if (receiver.id === senderId) {
				return NextResponse.json(
					{ message: "You cannot add yourself as a friend." },
					{ status: 400 }
				);
			}

			// Check if request already exists
			const existingRequest = await findExistingFriendRequest(senderId, receiver.id);

			if (existingRequest) {
				return NextResponse.json(
					{
						message: "Friend request already exists or you are already friends.",
					},
					{ status: 400 }
				);
			}

			// Create new pending friend request
			await db.insert(friendRequests).values({
				senderId: senderId,
				receiverId: receiver.id,
				status: "pending",
			});

			await createNotifications([
				{
					userId: receiver.id,
					actorUserId: senderId,
					type: "friend_request",
					title: "New friend request",
					message: `${currentUser.username} sent you a friend request.`,
					href: `/profile/${currentUser.username}`,
				},
			]);

			return NextResponse.json({ message: "Friend request sent." }, { status: 200 });
		}

		// ACTION: ACCEPT FRIEND
		if (action === "accept") {
			if (!requestId) {
				return NextResponse.json({ message: "Request ID is required." }, { status: 400 });
			}

			// Verify the request exists and the current user is the receiver
			const targetRequestResult = await db
				.select()
				.from(friendRequests)
				.where(
					and(eq(friendRequests.id, requestId), eq(friendRequests.receiverId, senderId))
				)
				.limit(1);

			const targetRequest = targetRequestResult[0];

			if (!targetRequest) {
				return NextResponse.json(
					{ message: "Friend request not found or unauthorized." },
					{ status: 404 }
				);
			}

			// Update status to accepted
			await db
				.update(friendRequests)
				.set({ status: "accepted" })
				.where(eq(friendRequests.id, requestId));

			await createNotifications([
				{
					userId: targetRequest.senderId,
					actorUserId: senderId,
					type: "friend_accepted",
					title: "Friend request accepted",
					message: `${currentUser.username} accepted your friend request.`,
					href: `/profile/${currentUser.username}`,
				},
			]);

			return NextResponse.json({ message: "Friend request accepted." }, { status: 200 });
		}

		// ACTION: REJECT OR REMOVE FRIEND
		if (action === "reject" || action === "remove") {
			if (!requestId && !receiverUsername) {
				return NextResponse.json(
					{ message: "Request ID or receiver username is required." },
					{ status: 400 }
				);
			}

			let targetRequestId = requestId;

			if (!targetRequestId && receiverUsername) {
				const receiver = await findUserByUsername(receiverUsername);

				if (!receiver) {
					return NextResponse.json({ message: "User not found." }, { status: 404 });
				}

				const existingRequest = await findExistingFriendRequest(senderId, receiver.id);

				if (!existingRequest) {
					return NextResponse.json(
						{ message: "Friend request not found." },
						{ status: 404 }
					);
				}

				targetRequestId = existingRequest.id;
			}

			if (!targetRequestId) {
				return NextResponse.json({ message: "Request ID is required." }, { status: 400 });
			}

			// Delete the request (either reject pending or remove accepted)
			// Ensure the user is either the sender or receiver
			await db
				.delete(friendRequests)
				.where(
					and(
						eq(friendRequests.id, targetRequestId),
						or(
							eq(friendRequests.senderId, senderId),
							eq(friendRequests.receiverId, senderId)
						)
					)
				);

			return NextResponse.json({ message: "Friend removed/rejected." }, { status: 200 });
		}

		return NextResponse.json({ message: "Invalid action." }, { status: 400 });
	} catch (error) {
		console.error("Error managing friends:", error);
		return NextResponse.json(
			{ message: "An internal server error occurred." },
			{ status: 500 }
		);
	}
}
