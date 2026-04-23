ALTER TABLE "users" ADD COLUMN "discord_id" text;
--> statement-breakpoint
CREATE UNIQUE INDEX "users_discord_id_unique_idx" ON "users" USING btree ("discord_id");