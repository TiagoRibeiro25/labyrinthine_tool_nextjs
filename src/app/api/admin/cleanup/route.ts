import { lt, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { ADMIN_CLEANUP_RETENTION_DAYS } from "../../../../constants/admin";
import { REALTIME_TOPICS } from "../../../../constants/realtime";
import { db } from "../../../../db";
import { activityEvents, notifications } from "../../../../db/schema";
import { requireAdministrator } from "../../../../lib/admin-access";
import { emitRealtimeHint } from "../../../../lib/realtime";
import {
	adminCleanupBodySchema,
	getFirstZodErrorMessage,
} from "../../../../lib/validation";

export async function POST(req: Request) {
	try {
		const authResult = await requireAdministrator();
		if ("error" in authResult) {
			return authResult.error;
		}

		let body: unknown;
		try {
			body = await req.json();
		} catch {
			return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
		}

		const parsed = adminCleanupBodySchema.safeParse(body);

		if (!parsed.success) {
			return NextResponse.json(
				{ message: getFirstZodErrorMessage(parsed.error) },
				{ status: 400 }
			);
		}

		const { retentionDays } = parsed.data;
		const cleanupDays = retentionDays ?? ADMIN_CLEANUP_RETENTION_DAYS;
		const cutoff = new Date(Date.now() - cleanupDays * 24 * 60 * 60 * 1000);

		const [activityCountResult, notificationCountResult] = await Promise.all([
			db
				.select({ count: sql<number>`count(*)`.mapWith(Number) })
				.from(activityEvents)
				.where(lt(activityEvents.createdAt, cutoff)),
			db
				.select({ count: sql<number>`count(*)`.mapWith(Number) })
				.from(notifications)
				.where(lt(notifications.createdAt, cutoff)),
		]);

		await Promise.all([
			db.delete(activityEvents).where(lt(activityEvents.createdAt, cutoff)),
			db.delete(notifications).where(lt(notifications.createdAt, cutoff)),
		]);

		emitRealtimeHint({ topic: REALTIME_TOPICS.ACTIVITY });
		emitRealtimeHint({ topic: REALTIME_TOPICS.NOTIFICATIONS });

		return NextResponse.json(
			{
				message: "Cleanup completed.",
				retentionDays: cleanupDays,
				deletedActivityEvents: activityCountResult[0]?.count ?? 0,
				deletedNotifications: notificationCountResult[0]?.count ?? 0,
			},
			{ status: 200 }
		);
	} catch (error) {
		console.error("Error running admin cleanup:", error);
		return NextResponse.json(
			{ message: "An internal server error occurred." },
			{ status: 500 }
		);
	}
}
