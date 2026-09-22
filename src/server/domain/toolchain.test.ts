import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

/**
 * Sentinel for the `unit` project: proves the node environment, TypeScript
 * transform and the `@/` path alias all resolve before real domain tests
 * start landing here.
 */
describe("unit toolchain", () => {
  it("resolves the @/ path alias", () => {
    expect(cn("a", false && "b", "c")).toBe("a c");
  });

  it("runs without a DOM", () => {
    expect(typeof globalThis.document).toBe("undefined");
  });
});
