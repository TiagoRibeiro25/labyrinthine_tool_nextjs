import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../../../../lib/auth";
import {
	getReportedCommentsPage,
	moderateReportedComment,
} from "../../../../lib/admin-reported-comments";

export async function GET(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		const sessionUser = session?.user as { id?: string } | undefined;
		if (!sessionUser?.id) {
			return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
		}

		const url = new URL(req.url);
		const page = Number(url.searchParams.get("page") ?? "1");
		const limit = Number(url.searchParams.get("limit") ?? "10");

		const comments = await getReportedCommentsPage(page, limit);
		return NextResponse.json(comments, { status: 200 });
	} catch (error) {
		console.error("Error fetching reported comments:", error);
		return NextResponse.json(
			{ message: "An internal server error occurred." },
			{ status: 500 }
		);
	}
}

export async function PATCH(req: Request) {
	try {
		const session = await getServerSession(authOptions);
		const sessionUser = session?.user as { id?: string } | undefined;
		if (!sessionUser?.id) {
			return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
		}

		let body: unknown;
		try {
			body = await req.json();
		} catch {
			return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
		}

		if (
			!body ||
			typeof body !== "object" ||
			!("commentId" in body) ||
			!("action" in body)
		) {
			return NextResponse.json(
				{ message: "commentId and action are required." },
				{ status: 400 }
			);
		}

		const commentId = String((body as { commentId: unknown }).commentId || "").trim();
		const action = String((body as { action: unknown }).action || "").trim();

		if (!commentId || !action) {
			return NextResponse.json(
				{ message: "commentId and action are required." },
				{ status: 400 }
			);
		}

		if (!["hide", "delete", "dismiss"].includes(action)) {
			return NextResponse.json({ message: "Invalid action." }, { status: 400 });
		}

		const result = await moderateReportedComment({
			commentId,
			action: action as "hide" | "delete" | "dismiss",
		});

		return NextResponse.json(result, { status: 200 });
	} catch (error) {
		console.error("Error moderating reported comment:", error);
		return NextResponse.json(
			{
				message:
					error instanceof Error ? error.message : "An internal server error occurred.",
			},
			{ status: 500 }
		);
	}
}
