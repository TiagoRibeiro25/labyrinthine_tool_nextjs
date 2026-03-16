import { defineConfig } from "drizzle-kit";

export default defineConfig({
    schema: "./src/db/schema.ts",
    out: "./drizzle",
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.DATABASE_URL || "postgresql://labyrinthine_user:labyrinthine_password@localhost:5432/labyrinthine_db",
    },
    verbose: true,
    strict: true,
});
