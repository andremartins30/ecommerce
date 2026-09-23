import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { getEnv } from "@/server/env";

/**
 * Cryptographic primitives for MFA (TOTP).
 *
 * The TOTP shared secret is different from a password: the server must be
 * able to read it back to generate/verify a 6-digit code, so it cannot go
 * through a one-way hash like Argon2 (see password.ts). It is instead
 * encrypted with AES-256-GCM under a key that never leaves the environment
 * (`MFA_ENCRYPTION_KEY`), which is the standard shape for "reversible but not
 * plaintext-in-the-database" secrets.
 *
 * Recovery codes are the opposite: the user presents one exactly once, so
 * they are treated like passwords — hashed one-way and compared, never
 * decrypted back.
 */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH_BYTES = 12; // 96-bit IV is the GCM-recommended size.

/** Derives a stable 32-byte key from MFA_ENCRYPTION_KEY, whatever its raw length. */
function deriveKey(): Buffer {
  const env = getEnv();
  return createHash("sha256").update(env.MFA_ENCRYPTION_KEY).digest();
}

/**
 * Encrypts a TOTP secret for storage in `User.mfaSecret`.
 * Output format: `<ivBase64url>.<authTagBase64url>.<ciphertextBase64url>`.
 */
export function encryptMfaSecret(plainSecret: string): string {
  const key = deriveKey();
  const iv = randomBytes(IV_LENGTH_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const ciphertext = Buffer.concat([cipher.update(plainSecret, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [iv.toString("base64url"), authTag.toString("base64url"), ciphertext.toString("base64url")].join(".");
}

/** Reverses `encryptMfaSecret`. Throws if the value was tampered with or the key is wrong. */
export function decryptMfaSecret(encrypted: string): string {
  const [ivPart, authTagPart, ciphertextPart] = encrypted.split(".");
  if (!ivPart || !authTagPart || !ciphertextPart) {
    throw new Error("Malformed encrypted MFA secret");
  }

  const key = deriveKey();
  const iv = Buffer.from(ivPart, "base64url");
  const authTag = Buffer.from(authTagPart, "base64url");
  const ciphertext = Buffer.from(ciphertextPart, "base64url");

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext.toString("utf8");
}

const RECOVERY_CODE_COUNT = 8;
/** Formatted as XXXX-XXXX (base32-ish, unambiguous alphabet — no 0/O/1/I/L). */
const RECOVERY_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function randomRecoveryCode(): string {
  const chars = Array.from(randomBytes(8), (byte) => RECOVERY_CODE_ALPHABET[byte % RECOVERY_CODE_ALPHABET.length]);
  const raw = chars.join("");
  return `${raw.slice(0, 4)}-${raw.slice(4, 8)}`;
}

/** Generates a fresh batch of plaintext recovery codes, shown to the user exactly once. */
export function generateRecoveryCodes(count: number = RECOVERY_CODE_COUNT): string[] {
  return Array.from({ length: count }, randomRecoveryCode);
}

/** One-way hash for storage in `User.mfaRecoveryCodes`. Same primitive as tokens.ts's hashToken. */
export function hashRecoveryCode(code: string): string {
  return createHash("sha256").update(code.trim().toUpperCase()).digest("hex");
}

/**
 * Verifies a submitted recovery code against the stored hashes and returns
 * the matched hash (so the caller can remove exactly that one — recovery
 * codes are single-use), or null if it doesn't match any of them.
 */
export function matchRecoveryCode(submitted: string, storedHashes: string[]): string | null {
  const submittedHash = hashRecoveryCode(submitted);
  return storedHashes.find((hash) => hash === submittedHash) ?? null;
}
