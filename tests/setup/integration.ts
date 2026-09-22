import dotenv from "dotenv";
import { testDatabaseUrl } from "./global-integration";

/**
 * Runs before any test module is imported.
 *
 * This has to be a setup file rather than a plain import inside a helper: ESM
 * import statements are hoisted, so a `dotenv.config()` call sitting next to an
 * import of the database client would run *after* that client had already been
 * evaluated with an empty environment.
 *
 * It also redirects DATABASE_URL to the dedicated test database, so integration
 * tests can truncate tables freely without touching development data.
 */

dotenv.config({ path: ".env.local", quiet: true });
dotenv.config({ path: ".env", quiet: true });

if (!process.env.DATABASE_URL) {
  throw new Error(
    "Integration tests need DATABASE_URL. Copy .env.example to .env.local and " +
    "run `npm run db:up`."
  );
}

process.env.DATABASE_URL = testDatabaseUrl(process.env.DATABASE_URL);
