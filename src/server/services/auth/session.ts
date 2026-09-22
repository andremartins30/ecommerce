import { cookies } from "next/headers";
import { prisma } from "@/server/db/client";
import { generateOpaqueToken, hashToken } from "@/server/services/auth/tokens";
import { getEnv } from "@/server/env";

/**
 * Server-side sessions, backed by the `Session` table.
 *
 * One cookie carries an opaque token; the database only ever stores its
 * hash (see tokens.ts). This is what makes a session revocable server-side —
 * a stolen cookie can be invalidated by deleting/marking its row, which a
 * signed-but-stateless JWT could never allow without a separate denylist.
 *
 * Node-only: this module talks to Prisma directly. `src/proxy.ts` runs on the
 * Node.js runtime by default in Next 16, so it is safe to import this from
 * there too — but keep the query it runs minimal (see `getSessionUser`).
 */

export const SESSION_COOKIE_NAME = "session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface SessionUser {
  id: string;
  email: string;
  emailVerified: boolean;
  isActive: boolean;
  customer: { id: string; name: string } | null;
  adminUser: { id: string; name: string; isActive: boolean } | null;
}

function cookieOptions(expiresAt: Date) {
  const env = getEnv();
  return {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    expires: expiresAt,
  };
}

/**
 * Creates a session row and sets the cookie on the current response.
 * Only callable from a Server Action or Route Handler (cookies() write access).
 */
export async function createSession(
  userId: string,
  request?: { ipAddress?: string | null; userAgent?: string | null }
): Promise<void> {
  const token = generateOpaqueToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await prisma.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
      ipAddress: request?.ipAddress ?? null,
      userAgent: request?.userAgent ?? null,
    },
  });

  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, token, cookieOptions(expiresAt));
}

/** Revokes the current session (if any) and clears the cookie. */
export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    await prisma.session.updateMany({
      where: { tokenHash: hashToken(token), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  store.delete(SESSION_COOKIE_NAME);
}

/**
 * Resolves the current session's user, or null when there is no session, it
 * expired, or it was revoked. Never throws on an absent/invalid cookie — the
 * caller decides whether that is an error.
 *
 * Touches `lastUsedAt` on every call so idle sessions can be distinguished
 * from active ones later (e.g. a "log out other devices" feature), without
 * making that write block the read — it is fired and not awaited.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const tokenHash = hashToken(token);
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      expiresAt: true,
      revokedAt: true,
      user: {
        select: {
          id: true,
          email: true,
          emailVerified: true,
          isActive: true,
          customer: { select: { id: true, name: true } },
          adminUser: { select: { id: true, name: true, isActive: true } },
        },
      },
    },
  });

  if (!session || session.revokedAt || session.expiresAt < new Date()) return null;
  if (!session.user.isActive) return null;

  void prisma.session.update({ where: { id: session.id }, data: { lastUsedAt: new Date() } }).catch(() => {});

  return session.user;
}

/** Throws-if-absent variant for Server Components/Actions that require auth. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new AuthError("Not authenticated");
  return user;
}

/** Throws-if-absent variant for admin-only Server Components/Actions. */
export async function requireAdmin(): Promise<SessionUser & { adminUser: NonNullable<SessionUser["adminUser"]> }> {
  const user = await requireUser();
  if (!user.adminUser || !user.adminUser.isActive) {
    throw new AuthError("Admin access required");
  }
  return user as SessionUser & { adminUser: NonNullable<SessionUser["adminUser"]> };
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}
