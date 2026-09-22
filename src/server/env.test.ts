import { describe, expect, it } from "vitest";
import { EnvValidationError, parseEnv, usesDevOnlyDrivers } from "./env";

const VALID_SECRET = "a".repeat(32);

function baseEnv(overrides: Record<string, string | undefined> = {}) {
  return {
    DATABASE_URL: "postgresql://user:pass@localhost:5432/perfumaria",
    SESSION_SECRET: VALID_SECRET,
    ...overrides,
  };
}

describe("parseEnv", () => {
  it("accepts a minimal development environment and applies defaults", () => {
    const env = parseEnv(baseEnv());

    expect(env.NODE_ENV).toBe("development");
    expect(env.APP_URL).toBe("http://localhost:3000");
    expect(env.PAYMENT_PROVIDER).toBe("fake");
    expect(env.STORAGE_PROVIDER).toBe("local");
    expect(env.QUEUE_PROVIDER).toBe("database");
    expect(env.STORE_PRIMARY_COLOR).toBe("#1B1B1F");
  });

  it("rejects a missing DATABASE_URL", () => {
    expect(() => parseEnv({ SESSION_SECRET: VALID_SECRET })).toThrow(EnvValidationError);
  });

  it("rejects a DATABASE_URL that is not postgres", () => {
    expect(() => parseEnv(baseEnv({ DATABASE_URL: "mysql://localhost/db" }))).toThrow(
      /DATABASE_URL must be a postgres/
    );
  });

  it("rejects a short SESSION_SECRET", () => {
    expect(() => parseEnv(baseEnv({ SESSION_SECRET: "too-short" }))).toThrow(
      /SESSION_SECRET must be at least 32 characters/
    );
  });

  it("reports every problem at once instead of stopping at the first", () => {
    try {
      parseEnv({ SESSION_SECRET: "short", STORE_EMAIL: "not-an-email" });
      expect.unreachable("should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(EnvValidationError);
      const { issues } = error as EnvValidationError;
      expect(issues.length).toBeGreaterThanOrEqual(3);
      expect(issues.join("\n")).toMatch(/DATABASE_URL/);
      expect(issues.join("\n")).toMatch(/SESSION_SECRET/);
      expect(issues.join("\n")).toMatch(/STORE_EMAIL/);
    }
  });

  it("never echoes secret values in the error message", () => {
    const secret = "super-secret-but-far-too-short";
    try {
      parseEnv(baseEnv({ SESSION_SECRET: secret }));
      expect.unreachable("should have thrown");
    } catch (error) {
      expect((error as Error).message).not.toContain(secret);
    }
  });

  it("rejects an invalid provider name", () => {
    expect(() => parseEnv(baseEnv({ PAYMENT_PROVIDER: "stripe" }))).toThrow(/PAYMENT_PROVIDER/);
  });

  it("rejects a malformed primary colour", () => {
    expect(() => parseEnv(baseEnv({ STORE_PRIMARY_COLOR: "black" }))).toThrow(
      /STORE_PRIMARY_COLOR must be a hex colour/
    );
  });

  it("rejects a non-redis REDIS_URL when provided", () => {
    expect(() => parseEnv(baseEnv({ REDIS_URL: "http://localhost:6379" }))).toThrow(/REDIS_URL/);
  });
});

describe("parseEnv in production", () => {
  const productionEnv = (overrides: Record<string, string | undefined> = {}) =>
    baseEnv({
      NODE_ENV: "production",
      APP_URL: "https://loja.example.com",
      PAYMENT_PROVIDER: "mercadopago",
      SHIPPING_PROVIDER: "melhorenvio",
      FISCAL_PROVIDER: "nuvemfiscal",
      MAIL_PROVIDER: "ses",
      STORAGE_PROVIDER: "s3",
      CEP_PROVIDER: "viacep",
      ...overrides,
    });

  it("accepts an environment with only real drivers", () => {
    const env = parseEnv(productionEnv());
    expect(env.NODE_ENV).toBe("production");
    expect(usesDevOnlyDrivers(env)).toBe(false);
  });

  it("refuses the fake payment provider", () => {
    expect(() => parseEnv(productionEnv({ PAYMENT_PROVIDER: "fake" }))).toThrow(
      /PAYMENT_PROVIDER is set to the development-only driver "fake"/
    );
  });

  it("refuses the fake mail, fiscal, shipping and cep providers", () => {
    for (const key of [
      "MAIL_PROVIDER",
      "FISCAL_PROVIDER",
      "SHIPPING_PROVIDER",
      "CEP_PROVIDER",
    ] as const) {
      expect(() => parseEnv(productionEnv({ [key]: "fake" }))).toThrow(
        new RegExp(`${key} is set to the development-only driver`)
      );
    }
  });

  it("refuses local filesystem storage", () => {
    expect(() => parseEnv(productionEnv({ STORAGE_PROVIDER: "local" }))).toThrow(
      /STORAGE_PROVIDER is set to the development-only driver "local"/
    );
  });

  it("reports every development-only driver in one error", () => {
    try {
      parseEnv(
        productionEnv({
          PAYMENT_PROVIDER: "fake",
          MAIL_PROVIDER: "fake",
          STORAGE_PROVIDER: "local",
        })
      );
      expect.unreachable("should have thrown");
    } catch (error) {
      expect((error as EnvValidationError).issues).toHaveLength(3);
    }
  });

  it("requires https for APP_URL", () => {
    expect(() => parseEnv(productionEnv({ APP_URL: "http://loja.example.com" }))).toThrow(
      /APP_URL must use https in production/
    );
  });

  it("still accepts the database-backed queue, which is a real implementation", () => {
    const env = parseEnv(productionEnv({ QUEUE_PROVIDER: "database" }));
    expect(env.QUEUE_PROVIDER).toBe("database");
  });
});
