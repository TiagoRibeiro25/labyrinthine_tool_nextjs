import { relations } from "drizzle-orm";
import {
    pgTable,
    uuid,
    varchar,
    text,
    boolean,
    timestamp,
    index,
    unique,
} from "drizzle-orm/pg-core";

export const users = pgTable(
    "users",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        username: text("username").notNull().unique(),
        password: varchar("password", { length: 255 }).notNull(),
        profilePictureId: text("profile_picture_id"),
        discordUsername: text("discord_username"),
        steamProfileUrl: text("steam_profile_url"),
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
    ],
);

export const cosmetics = pgTable(
    "cosmetics",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        name: text("name").notNull(),
        type: text("type").notNull(), // disc, hat, clothing, wrist, flashlight, lantern, glowstick, face
        source: text("source").notNull(), // shop, event, ...
        pictureId: text("picture_id"),
        notes: text("notes"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at")
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [
        index("cosmetics_id_idx").on(table.id),
        index("cosmetics_type_idx").on(table.type),
        index("cosmetics_source_idx").on(table.source),
    ],
);

export const userCosmetics = pgTable(
    "user_cosmetics",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        userId: uuid("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        cosmeticId: uuid("cosmetic_id")
            .notNull()
            .references(() => cosmetics.id, { onDelete: "cascade" }),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at")
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [
        index("user_cosmetics_user_id_idx").on(table.userId),
        index("user_cosmetics_cosmetic_id_idx").on(table.cosmeticId),
        unique("user_cosmetics_user_cosmetic_unique").on(
            table.userId,
            table.cosmeticId,
        ),
    ],
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
        unique("friend_requests_sender_receiver_unique").on(
            table.senderId,
            table.receiverId,
        ),
    ],
);

// --- RELATIONS ---

export const usersRelations = relations(users, ({ many }) => ({
    userCosmetics: many(userCosmetics),
    sentRequests: many(friendRequests, { relationName: "sentRequests" }),
    receivedRequests: many(friendRequests, { relationName: "receivedRequests" }),
}));

export const cosmeticsRelations = relations(cosmetics, ({ many }) => ({
    userCosmetics: many(userCosmetics),
}));

export const userCosmeticsRelations = relations(userCosmetics, ({ one }) => ({
    user: one(users, {
        fields: [userCosmetics.userId],
        references: [users.id],
    }),
    cosmetic: one(cosmetics, {
        fields: [userCosmetics.cosmeticId],
        references: [cosmetics.id],
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
