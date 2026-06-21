import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "../../../../../../db";
import { profileCommentReports, profileComments } from "../../../../../../db/schema";
import { requireSession, parseBody } from "../../../../../../lib/api-helpers";
import {
	createNotifications,
	getAdministratorUserIds,
} from "../../../../../../lib/social";
import { rateLimit, toRateLimitHeaders } from "../../../../../../lib/rate-limit";
import {
	profileCommentReportBodySchema,
} from "../../../../../../lib/validation";

export async function POST(
	req: Request,
	context: { params: Promise<{ commentId: string }> }
) {
	try {
		const auth = await requireSession();
		if ("error" in auth) return auth.error;

		const userId = auth.userId;
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

		const parsed = await parseBody(req, profileCommentReportBodySchema);
		if ("error" in parsed) {
			return NextResponse.json(
				{ message: "Invalid JSON body." },
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
