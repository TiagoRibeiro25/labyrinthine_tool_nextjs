import { z } from "zod";

const steamProfileRegex =
    /^https?:\/\/(www\.)?steamcommunity\.com\/(id|profiles)\/[a-zA-Z0-9_-]+\/?$/;

export const registerBodySchema = z.object({
    username: z
        .string()
        .trim()
        .min(3, "Username must be at least 3 characters long.")
        .max(32, "Username must be at most 32 characters long.")
        .regex(
            /^[a-zA-Z0-9_-]+$/,
            "Username can only contain letters, numbers, underscores, and hyphens.",
        ),
    password: z
        .string()
        .min(6, "Password must be at least 6 characters long.")
        .max(128, "Password must be at most 128 characters long."),
});

export const friendsActionSchema = z
    .object({
        action: z.enum(["add", "accept", "reject", "remove"]),
        receiverUsername: z.preprocess(
            (value) => (value === null ? undefined : value),
            z
                .string()
                .trim()
                .min(3, "Receiver username must be at least 3 characters long.")
                .max(
                    32,
                    "Receiver username must be at most 32 characters long.",
                )
                .regex(
                    /^[a-zA-Z0-9_-]+$/,
                    "Receiver username can only contain letters, numbers, underscores, and hyphens.",
                )
                .optional(),
        ),
        requestId: z.preprocess(
            (value) => (value === null ? undefined : value),
            z.string().uuid("Invalid request ID format.").optional(),
        ),
    })
    .superRefine((data, ctx) => {
        if (data.action === "add" && !data.receiverUsername) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["receiverUsername"],
                message: "Receiver username is required when adding a friend.",
            });
        }

        if (
            (data.action === "accept" || data.action === "reject") &&
            !data.requestId
        ) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["requestId"],
                message: `Request ID is required when action is "${data.action}".`,
            });
        }

        if (
            data.action === "remove" &&
            !data.requestId &&
            !data.receiverUsername
        ) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["requestId"],
                message:
                    'Request ID or receiver username is required when action is "remove".',
            });
        }
    });

export const profileUpdateSchema = z.object({
    discordUsername: z
        .string()
        .trim()
        .min(2, "Discord username must be at least 2 characters long.")
        .max(64, "Discord username must be at most 64 characters long.")
        .optional()
        .or(z.literal("")),
    steamProfileUrl: z
        .string()
        .trim()
        .regex(
            steamProfileRegex,
            "Invalid Steam Profile URL. Must be a valid steamcommunity.com link.",
        )
        .optional()
        .or(z.literal("")),
    profilePictureId: z
        .string()
        .trim()
        .regex(/^\d+$/, "Profile picture ID must be numeric.")
        .optional(),
});

export const cosmeticsToggleBodySchema = z.union([
    z.object({
        cosmeticId: z
            .number()
            .int("Cosmetic ID must be an integer.")
            .nonnegative("Cosmetic ID must be zero or greater."),
    }),
    z.object({
        cosmeticIds: z
            .array(
                z
                    .number()
                    .int("Each cosmetic ID must be an integer.")
                    .nonnegative("Each cosmetic ID must be zero or greater."),
            )
            .min(1, "At least one cosmetic ID must be provided."),
        action: z.enum(["unlock", "lock"]),
    }),
]);

export const searchQuerySchema = z.object({
    q: z
        .string()
        .trim()
        .min(1, "Search query is required.")
        .max(64, "Search query is too long."),
});

export const leaderboardPaginationQuerySchema = z.object({
    page: z.coerce
        .number()
        .int("Page must be an integer.")
        .min(1, "Page must be at least 1.")
        .default(1),
    limit: z.coerce
        .number()
        .int("Limit must be an integer.")
        .min(1, "Limit must be at least 1.")
        .max(50, "Limit cannot be greater than 50.")
        .default(20),
});

export const missingCosmeticsQuerySchema = z.object({
    cosmeticId: z.coerce
        .number()
        .int("Cosmetic ID must be an integer.")
        .nonnegative("Cosmetic ID must be zero or greater."),
});

export function getFirstZodErrorMessage(error: z.ZodError): string {
    return error.issues[0]?.message ?? "Invalid request payload.";
}

export type RegisterBody = z.infer<typeof registerBodySchema>;
export type FriendsActionBody = z.infer<typeof friendsActionSchema>;
export type ProfileUpdateBody = z.infer<typeof profileUpdateSchema>;
export type CosmeticsToggleBody = z.infer<typeof cosmeticsToggleBodySchema>;
