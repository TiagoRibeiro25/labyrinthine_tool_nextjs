import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Use environment variable or fallback to docker-compose defaults
const connectionString =
    process.env.DATABASE_URL ||
    "postgresql://labyrinthine_user:labyrinthine_password@localhost:5432/labyrinthine_db";

// Cache the database connection in development.
// This avoids creating a new connection on every Next.js HMR (Hot Module Replacement) reload.
const globalForDb = globalThis as unknown as {
    conn: postgres.Sql | undefined;
};

const conn = globalForDb.conn ?? postgres(connectionString, { prepare: false });

if (process.env.NODE_ENV !== "production") {
    globalForDb.conn = conn;
}

export const db = drizzle(conn, { schema });
