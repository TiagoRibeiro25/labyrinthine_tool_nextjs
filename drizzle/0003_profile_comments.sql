ALTER TABLE "users" ADD COLUMN "profile_comment_visibility" text DEFAULT 'everyone' NOT NULL;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "allow_non_friend_profile_comments" boolean DEFAULT true NOT NULL;
--> statement-breakpoint
CREATE TABLE "profile_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_user_id" uuid NOT NULL,
	"author_user_id" uuid NOT NULL,
	"content" text NOT NULL,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"is_edited" boolean DEFAULT false NOT NULL,
	"is_hidden" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profile_comments" ADD CONSTRAINT "profile_comments_profile_user_id_users_id_fk" FOREIGN KEY ("profile_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "profile_comments" ADD CONSTRAINT "profile_comments_author_user_id_users_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE TABLE "profile_comment_reactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"comment_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "profile_comment_reactions_comment_user_unique" UNIQUE("comment_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "profile_comment_reactions" ADD CONSTRAINT "profile_comment_reactions_comment_id_profile_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."profile_comments"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "profile_comment_reactions" ADD CONSTRAINT "profile_comment_reactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE TABLE "profile_comment_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"comment_id" uuid NOT NULL,
	"reporter_user_id" uuid NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "profile_comment_reports_comment_reporter_unique" UNIQUE("comment_id","reporter_user_id")
);
--> statement-breakpoint
ALTER TABLE "profile_comment_reports" ADD CONSTRAINT "profile_comment_reports_comment_id_profile_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."profile_comments"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "profile_comment_reports" ADD CONSTRAINT "profile_comment_reports_reporter_user_id_users_id_fk" FOREIGN KEY ("reporter_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE TABLE "user_blocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"blocker_user_id" uuid NOT NULL,
	"blocked_user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_blocks_blocker_blocked_unique" UNIQUE("blocker_user_id","blocked_user_id")
);
--> statement-breakpoint
ALTER TABLE "user_blocks" ADD CONSTRAINT "user_blocks_blocker_user_id_users_id_fk" FOREIGN KEY ("blocker_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "user_blocks" ADD CONSTRAINT "user_blocks_blocked_user_id_users_id_fk" FOREIGN KEY ("blocked_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "profile_comments_profile_user_id_idx" ON "profile_comments" USING btree ("profile_user_id");
--> statement-breakpoint
CREATE INDEX "profile_comments_author_user_id_idx" ON "profile_comments" USING btree ("author_user_id");
--> statement-breakpoint
CREATE INDEX "profile_comments_profile_hidden_created_idx" ON "profile_comments" USING btree ("profile_user_id","is_hidden","created_at");
--> statement-breakpoint
CREATE INDEX "profile_comments_profile_pinned_created_idx" ON "profile_comments" USING btree ("profile_user_id","is_pinned","created_at");
--> statement-breakpoint
CREATE INDEX "profile_comment_reactions_comment_id_idx" ON "profile_comment_reactions" USING btree ("comment_id");
--> statement-breakpoint
CREATE INDEX "profile_comment_reactions_user_id_idx" ON "profile_comment_reactions" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "profile_comment_reports_comment_id_idx" ON "profile_comment_reports" USING btree ("comment_id");
--> statement-breakpoint
CREATE INDEX "profile_comment_reports_reporter_user_id_idx" ON "profile_comment_reports" USING btree ("reporter_user_id");
--> statement-breakpoint
CREATE INDEX "user_blocks_blocker_user_id_idx" ON "user_blocks" USING btree ("blocker_user_id");
--> statement-breakpoint
CREATE INDEX "user_blocks_blocked_user_id_idx" ON "user_blocks" USING btree ("blocked_user_id");
