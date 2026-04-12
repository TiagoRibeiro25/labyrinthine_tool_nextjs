import { aliasedTable, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "../db";
import {
	profileCommentReports,
	profileComments,
	users,
} from "../db/schema";

export interface ReportedCommentRow {
	commentId: string;
	reportCount: number;
	latestReason: string | null;
	comment: {
		id: string;
		content: string;
		isHidden: boolean;
		createdAt: Date;
		updatedAt: Date;
		author: {
			id: string;
			username: string;
		};
		profile: {
			id: string;
			username: string;
		};
	};
}

export interface ReportedCommentsPagination {
	page: number;
	limit: number;
	totalItems: number;
	totalPages: number;
	hasNextPage: boolean;
	hasPreviousPage: boolean;
}

export interface ReportedCommentsPage {
	data: ReportedCommentRow[];
	pagination: ReportedCommentsPagination;
}

export interface ModerateReportedCommentInput {
	commentId: string;
	action: "hide" | "delete" | "dismiss";
}

export async function getReportedCommentsPage(
	page: number,
	limit: number
): Promise<ReportedCommentsPage> {
	const safeLimit = Math.min(Math.max(1, limit), 50);
	const totalItemsResult = await db
		.select({
			count: sql<number>`count(distinct ${profileCommentReports.commentId})`.mapWith(Number),
		})
		.from(profileCommentReports);

	const totalItems = totalItemsResult[0]?.count ?? 0;
	const totalPages = Math.max(1, Math.ceil(totalItems / safeLimit));
	const safePage = Math.min(Math.max(1, page), totalPages);
	const offset = (safePage - 1) * safeLimit;

	const summaryRows = await db
		.select({
			commentId: profileCommentReports.commentId,
			reportCount: sql<number>`count(*)`.mapWith(Number),
		})
		.from(profileCommentReports)
		.groupBy(profileCommentReports.commentId)
		.orderBy(desc(sql`max(${profileCommentReports.createdAt})`))
		.limit(safeLimit)
		.offset(offset);

	const commentIds = summaryRows.map((row) => row.commentId);
	if (commentIds.length === 0) {
		return {
			data: [],
			pagination: {
				page: safePage,
				limit: safeLimit,
				totalItems,
				totalPages,
				hasNextPage: safePage < totalPages,
				hasPreviousPage: safePage > 1,
			},
		};
	}

	const profileOwner = aliasedTable(users, "profile_owner");
	const [commentRows, latestReasonRows] = await Promise.all([
		db
			.select({
				id: profileComments.id,
				content: profileComments.content,
				isHidden: profileComments.isHidden,
				createdAt: profileComments.createdAt,
				updatedAt: profileComments.updatedAt,
				authorId: users.id,
				authorUsername: users.username,
				profileId: profileComments.profileUserId,
				profileUsername: profileOwner.username,
			})
			.from(profileComments)
			.innerJoin(users, eq(users.id, profileComments.authorUserId))
			.innerJoin(profileOwner, eq(profileOwner.id, profileComments.profileUserId))
			.where(inArray(profileComments.id, commentIds)),
		db
			.select({
				commentId: profileCommentReports.commentId,
				reason: profileCommentReports.reason,
			})
			.from(profileCommentReports)
			.where(inArray(profileCommentReports.commentId, commentIds))
			.orderBy(desc(profileCommentReports.createdAt)),
	]);

	const commentMap = new Map(commentRows.map((row) => [row.id, row]));
	const latestReasonMap = new Map<string, string>();
	for (const row of latestReasonRows) {
		if (!latestReasonMap.has(row.commentId)) {
			latestReasonMap.set(row.commentId, row.reason);
		}
	}

	const orderedRows = summaryRows
		.map((row) => {
			const comment = commentMap.get(row.commentId);
			if (!comment) {
				return null;
			}

			return {
				commentId: row.commentId,
				reportCount: row.reportCount,
				latestReason: latestReasonMap.get(row.commentId) ?? null,
				comment: {
					id: comment.id,
					content: comment.content,
					isHidden: comment.isHidden,
					createdAt: comment.createdAt,
					updatedAt: comment.updatedAt,
					author: {
						id: comment.authorId,
						username: comment.authorUsername,
					},
					profile: {
						id: comment.profileId,
						username: comment.profileUsername,
					},
				},
			} satisfies ReportedCommentRow;
		})
		.filter((value): value is ReportedCommentRow => Boolean(value));

	return {
		data: orderedRows,
		pagination: {
			page: safePage,
			limit: safeLimit,
			totalItems,
			totalPages,
			hasNextPage: safePage < totalPages,
			hasPreviousPage: safePage > 1,
		},
	};
}

export async function moderateReportedComment({
	commentId,
	action,
}: ModerateReportedCommentInput): Promise<{ message: string }> {
	const commentRows = await db
		.select({ id: profileComments.id, isHidden: profileComments.isHidden })
		.from(profileComments)
		.where(eq(profileComments.id, commentId))
		.limit(1);

	const comment = commentRows[0];
	if (!comment && action !== "dismiss") {
		throw new Error("Comment not found.");
	}

	if (action === "hide") {
		await db
			.update(profileComments)
			.set({ isHidden: true, updatedAt: new Date() })
			.where(eq(profileComments.id, commentId));
	}

	if (action === "delete") {
		await db.delete(profileComments).where(eq(profileComments.id, commentId));
	}

	await db
		.delete(profileCommentReports)
		.where(eq(profileCommentReports.commentId, commentId));

	return {
		message:
			action === "hide"
				? "Comment hidden and reports cleared."
				: action === "delete"
					? "Comment deleted and reports cleared."
					: "Reports dismissed.",
	};
}
