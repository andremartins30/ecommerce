import { execFileSync } from "node:child_process";
import dotenv from "dotenv";
import { Client } from "pg";

/**
 * Vitest globalSetup for the integration project.
 *
 * Integration tests write to a **dedicated database**, never to the development
 * one. The first version of this suite shared it, and running `npm test` quietly
 * emptied the seeded catalogue — the kind of thing that costs an afternoon to
 * diagnose.
 *
 * This creates `<database>_test` if it is missing and brings its schema up to
 * date with `prisma migrate deploy`.
 */

dotenv.config({ path: ".env.local", quiet: true });
dotenv.config({ path: ".env", quiet: true });

export function testDatabaseUrl(developmentUrl: string): string {
  const url = new URL(developmentUrl);
  const name = url.pathname.replace(/^\//, "");
  if (name.endsWith("_test")) return developmentUrl;
  url.pathname = `/${name}_test`;
  return url.toString();
}

export default async function setup() {
  const developmentUrl = process.env.DATABASE_URL;
  if (!developmentUrl) {
    throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local and run `npm run db:up`.");
  }

  const testUrl = testDatabaseUrl(developmentUrl);
  const parsed = new URL(testUrl);
  const testDatabaseName = parsed.pathname.replace(/^\//, "");

  // Connect to the maintenance database to create the test one if needed.
  const adminUrl = new URL(testUrl);
  adminUrl.pathname = "/postgres";

  const admin = new Client({ connectionString: adminUrl.toString() });
  await admin.connect();
  try {
    const existing = await admin.query("select 1 from pg_database where datname = $1", [
      testDatabaseName,
    ]);
    if (existing.rowCount === 0) {
      // Identifier cannot be parameterised; the name is derived from our own
      // configured URL and validated here rather than taken from user input.
      if (!/^[a-zA-Z0-9_]+$/.test(testDatabaseName)) {
        throw new Error(`Refusing to create a database with an unsafe name: ${testDatabaseName}`);
      }
      await admin.query(`CREATE DATABASE "${testDatabaseName}"`);
    }
  } finally {
    await admin.end();
  }

  execFileSync("npx", ["prisma", "migrate", "deploy"], {
    env: { ...process.env, DATABASE_URL: testUrl },
    stdio: "pipe",
    shell: process.platform === "win32",
  });
}
