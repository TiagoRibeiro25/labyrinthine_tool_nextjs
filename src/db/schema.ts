import { relations, sql } from "drizzle-orm";
import {
	boolean,
	index,
	integer,
	pgTable,
	text,
	timestamp,
	unique,
	uniqueIndex,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";

export const users = pgTable(
	"users",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		username: text("username").notNull().unique(),
		password: varchar("password", { length: 255 }).notNull(),
		profilePictureId: text("profile_picture_id"),
		profileBannerId: text("profile_banner_id"),
		bio: text("bio"),
		favoriteCosmeticId: integer("favorite_cosmetic_id"),
		discordId: text("discord_id"),
		discordUsername: text("discord_username"),
		discordAvatarUrl: text("discord_avatar_url"),
		useDiscordAvatar: boolean("use_discord_avatar").default(false).notNull(),
		steamUsername: text("steam_username"),
		steamAvatarUrl: text("steam_avatar_url"),
		useSteamAvatar: boolean("use_steam_avatar").default(false).notNull(),
		steamProfileUrl: text("steam_profile_url"),
		profileCommentVisibility: text("profile_comment_visibility")
			.default("everyone")
			.notNull(),
		isAdministrator: boolean("is_administrator").default(false).notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("users_id_idx").on(table.id),
		index("users_username_idx").on(table.username),
		uniqueIndex("users_username_lower_unique_idx").on(sql`lower(${table.username})`),
		uniqueIndex("users_discord_id_unique_idx").on(table.discordId),
	]
);

export const userCosmetics = pgTable(
	"user_cosmetics",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		userId: uuid("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		cosmeticId: integer("cosmetic_id").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("user_cosmetics_user_id_idx").on(table.userId),
		index("user_cosmetics_cosmetic_id_idx").on(table.cosmeticId),
		unique("user_cosmetics_user_cosmetic_unique").on(table.userId, table.cosmeticId),
	]
);

export const friendRequests = pgTable(
	"friend_requests",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		senderId: uuid("sender_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		receiverId: uuid("receiver_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		status: text("status").notNull(), // pending, accepted
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(), // if accepted, this is the time of acceptance
	},
	(table) => [
		index("friend_requests_sender_id_idx").on(table.senderId),
		index("friend_requests_receiver_id_idx").on(table.receiverId),
		unique("friend_requests_sender_receiver_unique").on(table.senderId, table.receiverId),
	]
);

export const activityEvents = pgTable(
	"activity_events",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		actorUserId: uuid("actor_user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		eventType: text("event_type").notNull(),
		cosmeticId: integer("cosmetic_id"),
		puzzleType: text("puzzle_type"),
		scoreValue: integer("score_value"),
		metadata: text("metadata"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		index("activity_events_actor_user_id_idx").on(table.actorUserId),
		index("activity_events_created_at_idx").on(table.createdAt),
	]
);

export const notifications = pgTable(
	"notifications",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		userId: uuid("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		actorUserId: uuid("actor_user_id").references(() => users.id, {
			onDelete: "set null",
		}),
		type: text("type").notNull(),
		title: text("title").notNull(),
		message: text("message").notNull(),
		href: text("href"),
		isRead: boolean("is_read").notNull().default(false),
		readAt: timestamp("read_at"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		index("notifications_user_id_idx").on(table.userId),
		index("notifications_actor_user_id_idx").on(table.actorUserId),
		index("notifications_user_read_created_idx").on(
			table.userId,
			table.isRead,
			table.createdAt
		),
	]
);

export const puzzleScores = pgTable(
	"puzzle_scores",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		userId: uuid("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		puzzleType: text("puzzle_type").notNull(),
		moves: integer("moves").notNull(),
		durationMs: integer("duration_ms").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		index("puzzle_scores_user_id_idx").on(table.userId),
		index("puzzle_scores_type_moves_duration_idx").on(
			table.puzzleType,
			table.moves,
			table.durationMs
		),
		index("puzzle_scores_created_at_idx").on(table.createdAt),
	]
);

export const profileComments = pgTable(
	"profile_comments",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		profileUserId: uuid("profile_user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		authorUserId: uuid("author_user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		content: text("content").notNull(),
		isPinned: boolean("is_pinned").default(false).notNull(),
		isEdited: boolean("is_edited").default(false).notNull(),
		isHidden: boolean("is_hidden").default(false).notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("profile_comments_profile_user_id_idx").on(table.profileUserId),
		index("profile_comments_author_user_id_idx").on(table.authorUserId),
		index("profile_comments_profile_hidden_created_idx").on(
			table.profileUserId,
			table.isHidden,
			table.createdAt
		),
		index("profile_comments_profile_pinned_created_idx").on(
			table.profileUserId,
			table.isPinned,
			table.createdAt
		),
	]
);

export const profileCommentReactions = pgTable(
	"profile_comment_reactions",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		commentId: uuid("comment_id")
			.notNull()
			.references(() => profileComments.id, { onDelete: "cascade" }),
		userId: uuid("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		index("profile_comment_reactions_comment_id_idx").on(table.commentId),
		index("profile_comment_reactions_user_id_idx").on(table.userId),
		unique("profile_comment_reactions_comment_user_unique").on(
			table.commentId,
			table.userId
		),
	]
);

export const profileCommentReports = pgTable(
	"profile_comment_reports",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		commentId: uuid("comment_id")
			.notNull()
			.references(() => profileComments.id, { onDelete: "cascade" }),
		reporterUserId: uuid("reporter_user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		reason: text("reason").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		index("profile_comment_reports_comment_id_idx").on(table.commentId),
		index("profile_comment_reports_reporter_user_id_idx").on(table.reporterUserId),
		unique("profile_comment_reports_comment_reporter_unique").on(
			table.commentId,
			table.reporterUserId
		),
	]
);

export const userBlocks = pgTable(
	"user_blocks",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		blockerUserId: uuid("blocker_user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		blockedUserId: uuid("blocked_user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		index("user_blocks_blocker_user_id_idx").on(table.blockerUserId),
		index("user_blocks_blocked_user_id_idx").on(table.blockedUserId),
		unique("user_blocks_blocker_blocked_unique").on(
			table.blockerUserId,
			table.blockedUserId
		),
	]
);

// --- RELATIONS ---

export const usersRelations = relations(users, ({ many }) => ({
	userCosmetics: many(userCosmetics),
	sentRequests: many(friendRequests, { relationName: "sentRequests" }),
	receivedRequests: many(friendRequests, {
		relationName: "receivedRequests",
	}),
	activityEvents: many(activityEvents),
	notifications: many(notifications, { relationName: "notificationsForUser" }),
	actedNotifications: many(notifications, {
		relationName: "notificationsByActor",
	}),
	puzzleScores: many(puzzleScores),
	profileComments: many(profileComments, { relationName: "profileCommentsForUser" }),
	authoredProfileComments: many(profileComments, {
		relationName: "profileCommentsByAuthor",
	}),
	profileCommentReactions: many(profileCommentReactions),
	profileCommentReports: many(profileCommentReports),
	blockedUsers: many(userBlocks, { relationName: "usersBlockedByUser" }),
	blockedByUsers: many(userBlocks, { relationName: "usersBlockedUser" }),
}));

export const userCosmeticsRelations = relations(userCosmetics, ({ one }) => ({
	user: one(users, {
		fields: [userCosmetics.userId],
		references: [users.id],
	}),
}));

export const friendRequestsRelations = relations(friendRequests, ({ one }) => ({
	sender: one(users, {
		fields: [friendRequests.senderId],
		references: [users.id],
		relationName: "sentRequests",
	}),
	receiver: one(users, {
		fields: [friendRequests.receiverId],
		references: [users.id],
		relationName: "receivedRequests",
	}),
}));

export const activityEventsRelations = relations(activityEvents, ({ one }) => ({
	actor: one(users, {
		fields: [activityEvents.actorUserId],
		references: [users.id],
	}),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
	user: one(users, {
		fields: [notifications.userId],
		references: [users.id],
		relationName: "notificationsForUser",
	}),
	actor: one(users, {
		fields: [notifications.actorUserId],
		references: [users.id],
		relationName: "notificationsByActor",
	}),
}));

export const puzzleScoresRelations = relations(puzzleScores, ({ one }) => ({
	user: one(users, {
		fields: [puzzleScores.userId],
		references: [users.id],
	}),
}));

export const profileCommentsRelations = relations(profileComments, ({ one, many }) => ({
	profileUser: one(users, {
		fields: [profileComments.profileUserId],
		references: [users.id],
		relationName: "profileCommentsForUser",
	}),
	authorUser: one(users, {
		fields: [profileComments.authorUserId],
		references: [users.id],
		relationName: "profileCommentsByAuthor",
	}),
	reactions: many(profileCommentReactions),
	reports: many(profileCommentReports),
}));

export const profileCommentReactionsRelations = relations(
	profileCommentReactions,
	({ one }) => ({
		comment: one(profileComments, {
			fields: [profileCommentReactions.commentId],
			references: [profileComments.id],
		}),
		user: one(users, {
			fields: [profileCommentReactions.userId],
			references: [users.id],
		}),
	})
);

export const profileCommentReportsRelations = relations(
	profileCommentReports,
	({ one }) => ({
		comment: one(profileComments, {
			fields: [profileCommentReports.commentId],
			references: [profileComments.id],
		}),
		reporter: one(users, {
			fields: [profileCommentReports.reporterUserId],
			references: [users.id],
		}),
	})
);

export const userBlocksRelations = relations(userBlocks, ({ one }) => ({
	blockerUser: one(users, {
		fields: [userBlocks.blockerUserId],
		references: [users.id],
		relationName: "usersBlockedByUser",
	}),
	blockedUser: one(users, {
		fields: [userBlocks.blockedUserId],
		references: [users.id],
		relationName: "usersBlockedUser",
	}),
}));
