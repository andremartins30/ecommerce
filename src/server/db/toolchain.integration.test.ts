import { describe, expect, it } from "vitest";

/**
 * Sentinel for the `integration` project: proves the project is picked up,
 * runs in a node environment and executes in a single fork so that later
 * database tests can rely on transactions and row locks behaving predictably.
 *
 * Real database-backed integration tests arrive with the Prisma schema.
 */
describe("integration toolchain", () => {
  it("runs in a node environment", () => {
    expect(typeof globalThis.document).toBe("undefined");
    expect(typeof process.versions.node).toBe("string");
  });

  it("runs serially in a single worker", () => {
    // `fileParallelism: false` keeps integration files from overlapping, which
    // is what makes the concurrency tests in later tasks meaningful.
    expect(process.env.VITEST_POOL_ID).toBe("1");
  });
});
