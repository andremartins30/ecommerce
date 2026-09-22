import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Architectural guard for the rule stated in ARCHITECTURE.md: `domain/` is pure.
 *
 * A documented boundary that nothing enforces is a boundary that erodes. The
 * first `import { prisma }` inside a pricing rule is what turns a
 * millisecond-fast business test suite into one that needs a database.
 */

const DOMAIN_DIR = path.join(process.cwd(), "src", "server", "domain");

const FORBIDDEN_IMPORTS: { pattern: RegExp; why: string }[] = [
  { pattern: /from\s+["'].*db\/client["']/, why: "the domain must not reach for the database" },
  { pattern: /from\s+["']@prisma\//, why: "the domain must not depend on Prisma" },
  { pattern: /from\s+["']react["']/, why: "the domain must not depend on React" },
  { pattern: /from\s+["']next\//, why: "the domain must not depend on Next.js" },
  { pattern: /from\s+["']@\/store\//, why: "the domain must not depend on client state" },
  { pattern: /from\s+["']@\/components\//, why: "the domain must not depend on components" },
  { pattern: /\bfetch\s*\(/, why: "the domain must not make network calls" },
];

function collectSourceFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...collectSourceFiles(full));
      continue;
    }
    if (entry.endsWith(".ts") && !entry.endsWith(".test.ts")) files.push(full);
  }
  return files;
}

describe("domain purity", () => {
  const files = collectSourceFiles(DOMAIN_DIR);

  it("finds domain modules to check", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files.map((f) => [path.relative(process.cwd(), f), f] as const))(
    "%s has no infrastructure dependency",
    (_label, file) => {
      const source = readFileSync(file, "utf8");
      for (const { pattern, why } of FORBIDDEN_IMPORTS) {
        expect(pattern.test(source), `${path.basename(file)}: ${why}`).toBe(false);
      }
    }
  );
});
