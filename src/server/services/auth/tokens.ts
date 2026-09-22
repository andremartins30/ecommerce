import { randomBytes, createHash } from "node:crypto";

/**
 * Opaque token generation for sessions, email verification and password
 * reset.
 *
 * The pattern is identical for all three (see Session, EmailVerificationToken
 * and PasswordResetToken in schema.prisma): a high-entropy random string is
 * handed to the client (in a cookie or a link), and only its SHA-256 hash is
 * stored. A database leak (a backup, a slow query log, a compromised read
 * replica) never hands out anything usable — the raw token cannot be
 * recovered from the hash, and the hash alone cannot be presented back as a
 * valid credential.
 */

/** 256 bits of entropy, base64url-encoded so it is cookie- and URL-safe. */
export function generateOpaqueToken(): string {
  return randomBytes(32).toString("base64url");
}

/** SHA-256 is enough here: the token itself already carries 256 bits of entropy, so this hash only needs to be irreversible, not slow. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
