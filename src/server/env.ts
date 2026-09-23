import { z } from "zod";

/**
 * Environment validation, executed once at boot.
 *
 * Two hard rules live here:
 *
 * 1. The app refuses to start with an incomplete or malformed environment.
 *    Failing at boot is far cheaper than discovering a missing secret during a
 *    customer's checkout.
 * 2. Development-only provider drivers (the in-memory / on-disk fakes) are
 *    rejected when NODE_ENV is "production". The fakes exist so the domain can
 *    be built and tested before real payment, shipping and fiscal accounts
 *    exist — they must never be able to reach production by accident.
 *
 * Error messages name the offending variables but never echo their values.
 */

const PAYMENT_PROVIDERS = ["fake", "mercadopago", "pagarme", "pagbank", "asaas"] as const;
const SHIPPING_PROVIDERS = ["fake", "melhorenvio", "correios", "frenet", "jadlog"] as const;
const FISCAL_PROVIDERS = ["fake", "nuvemfiscal", "focusnfe", "plugnotas", "enotas"] as const;
const MAIL_PROVIDERS = ["fake", "ses", "smtp"] as const;
const STORAGE_PROVIDERS = ["local", "s3"] as const;
const QUEUE_PROVIDERS = ["database", "sqs"] as const;
const CEP_PROVIDERS = ["fake", "viacep", "brasilapi"] as const;

/**
 * Drivers that are acceptable in development and test but must never run in
 * production. `queue=database` is deliberately absent: a durable table-backed
 * queue is a legitimate production choice.
 */
const DEV_ONLY_DRIVERS: Record<string, string> = {
  PAYMENT_PROVIDER: "fake",
  SHIPPING_PROVIDER: "fake",
  FISCAL_PROVIDER: "fake",
  MAIL_PROVIDER: "fake",
  STORAGE_PROVIDER: "local",
  CEP_PROVIDER: "fake",
};

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  // --- Infrastructure -------------------------------------------------------
  DATABASE_URL: z
    .string()
    .min(1, "is required")
    .refine(
      (value) => value.startsWith("postgres://") || value.startsWith("postgresql://"),
      "must be a postgres:// or postgresql:// connection string"
    ),
  REDIS_URL: z
    .string()
    .min(1)
    .refine(
      (value) => value.startsWith("redis://") || value.startsWith("rediss://"),
      "must be a redis:// or rediss:// connection string"
    )
    .optional(),
  APP_URL: z.string().url("must be an absolute URL").default("http://localhost:3000"),

  // --- Secrets --------------------------------------------------------------
  // 32 bytes is the floor for signing session and CSRF tokens.
  SESSION_SECRET: z
    .string()
    .min(32, "must be at least 32 characters of high-entropy random data"),

  // AES-256-GCM key for encrypting TOTP secrets at rest (they must be
  // reversible to generate a code, unlike passwords, so Argon2 cannot be
  // used here). Exactly 32 bytes once decoded from base64url — see
  // src/server/services/auth/mfa-crypto.ts.
  MFA_ENCRYPTION_KEY: z
    .string()
    .min(32, "must be at least 32 characters of high-entropy random data"),

  // --- Store identity -------------------------------------------------------
  // These seed SystemSetting on first boot. Once the store exists, the admin
  // panel is the source of truth and these are only bootstrap defaults.
  STORE_NAME: z.string().min(1).default("Alquimia Perfumes Artesanais"),
  STORE_LOGO: z.string().default("/logo-alquimia.png"),
  STORE_FAVICON: z.string().default(""),
  STORE_PRIMARY_COLOR: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "must be a hex colour such as #1B1B1F")
    .default("#1B1B1F"),
  STORE_EMAIL: z.string().email("must be a valid e-mail address").default("contato@alquimia.com.br"),
  STORE_PHONE: z.string().default(""),
  STORE_WHATSAPP: z.string().default(""),
  STORE_CNPJ: z.string().default(""),
  STORE_ADDRESS: z.string().default(""),

  // --- Provider selection ---------------------------------------------------
  PAYMENT_PROVIDER: z.enum(PAYMENT_PROVIDERS).default("fake"),
  SHIPPING_PROVIDER: z.enum(SHIPPING_PROVIDERS).default("fake"),
  FISCAL_PROVIDER: z.enum(FISCAL_PROVIDERS).default("fake"),
  MAIL_PROVIDER: z.enum(MAIL_PROVIDERS).default("fake"),
  STORAGE_PROVIDER: z.enum(STORAGE_PROVIDERS).default("local"),
  QUEUE_PROVIDER: z.enum(QUEUE_PROVIDERS).default("database"),
  CEP_PROVIDER: z.enum(CEP_PROVIDERS).default("fake"),
});

export type Env = z.infer<typeof envSchema>;

export class EnvValidationError extends Error {
  readonly issues: string[];

  constructor(issues: string[]) {
    super(
      [
        "Invalid environment configuration:",
        ...issues.map((issue) => `  - ${issue}`),
        "",
        "See .env.example for the full list of variables.",
      ].join("\n")
    );
    this.name = "EnvValidationError";
    this.issues = issues;
  }
}

/**
 * Pure parser: takes a raw environment bag and returns the validated env, or
 * throws EnvValidationError listing every problem at once. Kept pure so it can
 * be unit tested without mutating the real process environment.
 */
export function parseEnv(raw: NodeJS.ProcessEnv | Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(raw);

  if (!result.success) {
    const issues = result.error.issues.map((issue) => {
      const key = issue.path.join(".") || "(root)";
      return `${key} ${issue.message}`;
    });
    throw new EnvValidationError(issues);
  }

  const env = result.data;

  if (env.NODE_ENV === "production") {
    const devOnly = Object.entries(DEV_ONLY_DRIVERS)
      .filter(([key, devValue]) => env[key as keyof Env] === devValue)
      .map(
        ([key, devValue]) =>
          `${key} is set to the development-only driver "${devValue}", which cannot be used in production`
      );

    const insecureAppUrl = env.APP_URL.startsWith("https://")
      ? []
      : ["APP_URL must use https in production"];

    const issues = [...devOnly, ...insecureAppUrl];
    if (issues.length > 0) throw new EnvValidationError(issues);
  }

  return env;
}

let cached: Env | undefined;

/**
 * Validated environment for server-side code. Lazily parsed so that importing
 * a module does not crash tooling that has no environment configured.
 */
export function getEnv(): Env {
  cached ??= parseEnv(process.env);
  return cached;
}

/** Test-only: forget the cached environment. */
export function resetEnvCache(): void {
  cached = undefined;
}

/** True when a provider is running on a development-only driver. */
export function usesDevOnlyDrivers(env: Env): boolean {
  return Object.entries(DEV_ONLY_DRIVERS).some(
    ([key, devValue]) => env[key as keyof Env] === devValue
  );
}

export const PROVIDER_OPTIONS = {
  payment: PAYMENT_PROVIDERS,
  shipping: SHIPPING_PROVIDERS,
  fiscal: FISCAL_PROVIDERS,
  mail: MAIL_PROVIDERS,
  storage: STORAGE_PROVIDERS,
  queue: QUEUE_PROVIDERS,
  cep: CEP_PROVIDERS,
} as const;
