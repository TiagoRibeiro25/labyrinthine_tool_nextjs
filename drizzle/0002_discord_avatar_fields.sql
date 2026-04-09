ALTER TABLE "users" ADD COLUMN "discord_avatar_url" text;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "use_discord_avatar" boolean DEFAULT false NOT NULL;
