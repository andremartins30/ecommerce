import { defineConfig } from "vitest/config";

/**
 * Three test projects with deliberately different boundaries:
 *
 * - `unit`        pure domain logic (src/server/domain/**) plus shared libs.
 *                 No DOM, no database, no network. Fast enough to run on every
 *                 save. This is where the mandatory business cases
 *                 (availability, backorder, lead time, delivery promise) live.
 * - `component`   React components rendered with Testing Library in jsdom.
 * - `integration` services that talk to PostgreSQL. Run serially in a single
 *                 fork so transactions and row locks behave like production.
 */
export default defineConfig({
  resolve: {
    // Resolves the `@/*` alias from tsconfig.json natively.
    tsconfigPaths: true,
  },
  test: {
    globals: false,
    projects: [
      {
        test: {
          name: "unit",
          environment: "node",
          include: [
            "src/server/domain/**/*.test.ts",
            "src/lib/**/*.test.ts",
            "src/server/env.test.ts",
          ],
        },
      },
      {
        test: {
          name: "component",
          environment: "jsdom",
          setupFiles: ["./tests/setup/component.ts"],
          include: ["src/components/**/*.test.tsx", "src/hooks/**/*.test.ts?(x)"],
        },
      },
      {
        test: {
          name: "integration",
          environment: "node",
          // Creates and migrates the dedicated test database once per run.
          globalSetup: ["./tests/setup/global-integration.ts"],
          setupFiles: ["./tests/setup/integration.ts"],
          include: ["src/server/**/*.integration.test.ts", "prisma/**/*.integration.test.ts"],
          // A shared database cannot be written to by parallel workers without
          // making the concurrency tests meaningless: one file at a time, in a
          // forked process, so transactions and row locks behave like
          // production.
          pool: "forks",
          fileParallelism: false,
          testTimeout: 30_000,
          hookTimeout: 30_000,
        },
      },
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/server/**", "src/lib/**"],
      exclude: ["**/*.test.ts", "**/*.test.tsx", "src/server/db/generated/**"],
    },
  },
});
