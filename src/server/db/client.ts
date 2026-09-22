import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/client";

/**
 * Prisma client singleton.
 *
 * Prisma 7 requires a driver adapter rather than a connection string in the
 * schema, so the pg pool is created here and the URL comes from the validated
 * environment.
 *
 * The instance is cached on `globalThis` in development because Next.js reloads
 * modules on every edit, and a fresh pool per reload exhausts the database's
 * connection limit within a few minutes of editing.
 */

function createClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local and start the " +
        "database with `docker compose up -d`."
    );
  }

  const adapter = new PrismaPg({ connectionString });

  return new PrismaClient({
    adapter,
    // Queries are noisy; warnings and errors are not. Never log query
    // parameters, which would put customer data and tokens in the logs.
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createClient> | undefined;
};

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export type Db = typeof prisma;
