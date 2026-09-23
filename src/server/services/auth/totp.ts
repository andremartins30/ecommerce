import * as OTPAuth from "otpauth";

/**
 * TOTP (RFC 6238) generation and verification, wrapping `otpauth`.
 *
 * `otpauth` was chosen over `speakeasy` because it is actively maintained,
 * pure JS (no native bindings, unlike `@node-rs/argon2` — that trade-off is
 * fine for a password hash that runs once per login, but a QR/TOTP library
 * has no such performance requirement), and TypeScript-native.
 */

const ISSUER = "Perfumaria Admin";
const DIGITS = 6;
const PERIOD_SECONDS = 30;

function totpFor(label: string, secretBase32: string): OTPAuth.TOTP {
  return new OTPAuth.TOTP({
    issuer: ISSUER,
    label,
    algorithm: "SHA1",
    digits: DIGITS,
    period: PERIOD_SECONDS,
    secret: OTPAuth.Secret.fromBase32(secretBase32),
  });
}

/** Generates a fresh random base32 secret, ready to be encrypted and stored. */
export function generateTotpSecret(): string {
  return new OTPAuth.Secret({ size: 20 }).base32;
}

/** `otpauth://` URI for QR-code enrollment, scoped to the user's e-mail so multiple accounts are distinguishable in an authenticator app. */
export function buildTotpUri(email: string, secretBase32: string): string {
  return totpFor(email, secretBase32).toString();
}

/**
 * Verifies a 6-digit code against the secret, allowing ±1 time step (30s) of
 * clock drift — tight enough to keep the window narrow, loose enough that a
 * phone a few seconds off doesn't lock the admin out.
 */
export function verifyTotpCode(email: string, secretBase32: string, code: string): boolean {
  const sanitized = code.trim().replace(/\s+/g, "");
  if (!/^\d{6}$/.test(sanitized)) return false;

  const delta = totpFor(email, secretBase32).validate({ token: sanitized, window: 1 });
  return delta !== null;
}
