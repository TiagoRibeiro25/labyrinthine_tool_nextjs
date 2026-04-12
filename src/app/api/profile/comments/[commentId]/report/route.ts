import { and, eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { db } from "../../../../../../db";
import { profileCommentReports, profileComments } from "../../../../../../db/schema";
import { authOptions } from "../../../../../../lib/auth";
import { createNotifications, getAdministratorUserIds } from "../../../../../../lib/social";
import { rateLimit, toRateLimitHeaders } from "../../../../../../lib/rate-limit";
import {
	getFirstZodErrorMessage,
	profileCommentReportBodySchema,
} from "../../../../../../lib/validation";

export async function POST(
	req: Request,
	context: { params: Promise<{ commentId: string }> }
) {
	try {
		const session = await getServerSession(authOptions);
		const sessionUser = session?.user as { id?: string } | undefined;

		if (!sessionUser?.id) {
			return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
		}

		const userId = sessionUser.id;
		const { commentId } = await context.params;

		const reportRateLimit = rateLimit({
			key: `profile-comments:report:${userId}`,
			limit: 10,
			windowMs: 10 * 60 * 1000,
		});

		if (!reportRateLimit.success) {
			return NextResponse.json(
				{ message: "Too many reports in a short period. Please try again later." },
				{ status: 429, headers: toRateLimitHeaders(reportRateLimit) }
			);
		}

		let body: unknown;
		try {
			body = await req.json();
		} catch {
			return NextResponse.json(
				{ message: "Invalid JSON body." },
				{ status: 400, headers: toRateLimitHeaders(reportRateLimit) }
			);
		}

		const parsed = profileCommentReportBodySchema.safeParse(body);
		if (!parsed.success) {
			return NextResponse.json(
				{ message: getFirstZodErrorMessage(parsed.error) },
				{ status: 400, headers: toRateLimitHeaders(reportRateLimit) }
			);
		}

		const commentRows = await db
			.select({
				id: profileComments.id,
				authorUserId: profileComments.authorUserId,
			})
			.from(profileComments)
			.where(eq(profileComments.id, commentId))
			.limit(1);

		const comment = commentRows[0];
		if (!comment) {
			return NextResponse.json(
				{ message: "Comment not found." },
				{ status: 404, headers: toRateLimitHeaders(reportRateLimit) }
			);
		}

		if (comment.authorUserId === userId) {
			return NextResponse.json(
				{ message: "You cannot report your own comment." },
				{ status: 400, headers: toRateLimitHeaders(reportRateLimit) }
			);
		}

		const existingRows = await db
			.select({ id: profileCommentReports.id })
			.from(profileCommentReports)
			.where(
				and(
					eq(profileCommentReports.commentId, commentId),
					eq(profileCommentReports.reporterUserId, userId)
				)
			)
			.limit(1);

		if (existingRows.length > 0) {
			return NextResponse.json(
				{ message: "You already reported this comment." },
				{ status: 400, headers: toRateLimitHeaders(reportRateLimit) }
			);
		}

		await db.insert(profileCommentReports).values({
			commentId,
			reporterUserId: userId,
			reason: parsed.data.reason,
		});

		const administratorIds = await getAdministratorUserIds();
		if (administratorIds.length > 0) {
			await createNotifications(
				administratorIds.map((administratorId) => ({
					userId: administratorId,
					actorUserId: userId,
					type: "profile_comment_report",
					title: "Profile comment reported",
					message: "A profile comment was reported and needs review.",
					href: "/admin?reportedCommentsPage=1",
				}))
			);
		}

		return NextResponse.json(
			{ message: "Comment reported." },
			{ status: 201, headers: toRateLimitHeaders(reportRateLimit) }
		);
	} catch (error) {
		console.error("Error reporting profile comment:", error);
		return NextResponse.json(
			{ message: "An internal server error occurred." },
			{ status: 500 }
		);
	}
}
