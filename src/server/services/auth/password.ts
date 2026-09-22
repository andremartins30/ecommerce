import { hash, verify } from "@node-rs/argon2";

/**
 * Password hashing.
 *
 * `@node-rs/argon2` produces Argon2id hashes by default (native binding,
 * Node-only — never import this module from `src/proxy.ts` or anything else
 * that might run on the Edge runtime). The output format is
 * `$argon2id$v=19$m=...,t=...,p=...$salt$hash`, which is exactly what the
 * database's `users_password_hash_is_argon2id` CHECK constraint requires
 * (`passwordHash LIKE '$argon2id$%'`) — a bcrypt or scrypt hash would be
 * rejected at the INSERT, not just look wrong.
 *
 * Parameters follow OWASP's current minimum recommendation for Argon2id
 * (19 MiB memory, 2 iterations, 1 degree of parallelism) as a floor; tuned
 * higher here since this only ever runs on the server, not per-request on a
 * latency-sensitive path shared with anonymous traffic.
 */
const HASH_OPTIONS = {
  memoryCost: 19456, // 19 MiB
  timeCost: 2,
  parallelism: 1,
};

export async function hashPassword(plaintext: string): Promise<string> {
  return hash(plaintext, HASH_OPTIONS);
}

/**
 * Verifies a plaintext password against a stored hash.
 *
 * Never throws on a wrong password — returns false. Only throws if the
 * stored hash is malformed, which should be impossible given the CHECK
 * constraint, but a corrupt row must not be treated as a match.
 */
export async function verifyPassword(hashValue: string, plaintext: string): Promise<boolean> {
  try {
    return await verify(hashValue, plaintext);
  } catch {
    return false;
  }
}
