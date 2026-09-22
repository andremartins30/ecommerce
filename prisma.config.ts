import path from "node:path";
import dotenv from "dotenv";
import { defineConfig, env } from "prisma/config";

// Mirror Next.js precedence: .env.local wins over .env. dotenv does not
// overwrite already-set variables, so loading .env.local first is what gives it
// priority. Without this the CLI would read a different database than the app.
dotenv.config({ path: ".env.local", quiet: true });
dotenv.config({ path: ".env", quiet: true });

/**
 * Prisma 7 configuration.
 *
 * The connection URL lives here instead of schema.prisma. It is read from the
 * environment — never committed — and the same variable feeds the runtime
 * client through the pg driver adapter in src/server/db/client.ts.
 */
export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    path: path.join("prisma", "migrations"),
    // tsx rather than Node's native type stripping: the generated Prisma client
    // relies on bundler-style extensionless imports.
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
