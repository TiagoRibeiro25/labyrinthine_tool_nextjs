ALTER TABLE "users" ADD COLUMN "created_via_discord" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
UPDATE "users" SET "created_via_discord" = true WHERE "discord_id" IS NOT NULL;
