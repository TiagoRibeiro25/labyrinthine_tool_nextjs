ALTER TABLE "users" ADD COLUMN "steam_username" text;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "steam_avatar_url" text;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "use_steam_avatar" boolean DEFAULT false NOT NULL;
