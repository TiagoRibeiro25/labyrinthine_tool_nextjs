CREATE UNIQUE INDEX "users_username_lower_unique_idx" ON "users" USING btree (lower("username"));
