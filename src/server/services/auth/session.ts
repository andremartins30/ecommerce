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
  mfaEnabledAt: Date | null;
  customer: { id: string; name: string } | null;
  adminUser:
  | {
    id: string;
    name: string;
    isActive: boolean;
    mfaRequired: boolean;
    /** Flattened union of every permission key granted by every role this admin holds. */
    permissionKeys: string[];
  }
  | null;
}

export interface SessionMeta {
  /** True once the TOTP step of *this* session has been satisfied. */
  mfaSatisfied: boolean;
  /** Set by a fresh password/TOTP re-check; null means the elevated window has not been opened (or has expired). */
  reauthenticatedAt: Date | null;
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
/** Shared query + liveness checks between getSessionUser and getSessionMeta, to avoid two divergent copies of "what makes a session valid". */
async function findLiveSession() {
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
      mfaSatisfied: true,
      reauthenticatedAt: true,
      user: {
        select: {
          id: true,
          email: true,
          emailVerified: true,
          isActive: true,
          mfaEnabledAt: true,
          customer: { select: { id: true, name: true } },
          adminUser: {
            select: {
              id: true,
              name: true,
              isActive: true,
              mfaRequired: true,
              roles: {
                select: {
                  role: {
                    select: {
                      permissions: { select: { permission: { select: { key: true } } } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!session || session.revokedAt || session.expiresAt < new Date()) return null;
  if (!session.user.isActive) return null;

  void prisma.session.update({ where: { id: session.id }, data: { lastUsedAt: new Date() } }).catch(() => { });

  return session;
}

/** Flattens `adminUser.roles[].role.permissions[].permission.key` into a deduplicated set of keys. */
function flattenPermissionKeys(
  roles: { role: { permissions: { permission: { key: string } }[] } }[]
): string[] {
  const keys = new Set<string>();
  for (const { role } of roles) {
    for (const { permission } of role.permissions) {
      keys.add(permission.key);
    }
  }
  return [...keys];
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await findLiveSession();
  if (!session) return null;

  const { user } = session;
  return {
    id: user.id,
    email: user.email,
    emailVerified: user.emailVerified,
    isActive: user.isActive,
    mfaEnabledAt: user.mfaEnabledAt,
    customer: user.customer,
    adminUser: user.adminUser
      ? {
        id: user.adminUser.id,
        name: user.adminUser.name,
        isActive: user.adminUser.isActive,
        mfaRequired: user.adminUser.mfaRequired,
        permissionKeys: flattenPermissionKeys(user.adminUser.roles),
      }
      : null,
  };
}

/** Session-level state (as opposed to user-level): whether MFA/reauth have been satisfied for *this* session. */
export async function getSessionMeta(): Promise<SessionMeta | null> {
  const session = await findLiveSession();
  if (!session) return null;
  return { mfaSatisfied: session.mfaSatisfied, reauthenticatedAt: session.reauthenticatedAt };
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

/** How long a reauthentication (or a fresh login's implicit reauth) keeps a session "elevated" for sensitive actions. */
const REAUTH_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Throws unless the current session was reauthenticated (password + TOTP if
 * MFA is enrolled) within the last 15 minutes. Meant for specific sensitive
 * Server Actions (e.g. deleting a product, issuing a refund) — this is
 * deliberately per-action, not a route-level gate like the MFA check in
 * proxy.ts, because "sensitive" varies action by action.
 */
export async function requireReauth(): Promise<void> {
  const meta = await getSessionMeta();
  if (!meta || !meta.reauthenticatedAt) {
    throw new ReauthRequiredError();
  }
  const elapsed = Date.now() - meta.reauthenticatedAt.getTime();
  if (elapsed > REAUTH_WINDOW_MS) {
    throw new ReauthRequiredError();
  }
}

/** Marks the current session as reauthenticated now. Call after re-verifying the user's password (and TOTP, if enrolled). */
export async function markReauthenticated(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  if (!token) throw new AuthError("Not authenticated");

  await prisma.session.updateMany({
    where: { tokenHash: hashToken(token), revokedAt: null },
    data: { reauthenticatedAt: new Date() },
  });
}

/** Marks the current session as having satisfied its TOTP challenge. Call only after a verified 6-digit code (or a valid recovery code). */
export async function markMfaSatisfied(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  if (!token) throw new AuthError("Not authenticated");

  await prisma.session.updateMany({
    where: { tokenHash: hashToken(token), revokedAt: null },
    data: { mfaSatisfied: true },
  });
}

/** Thrown by requireReauth so callers can distinguish "not logged in at all" from "logged in but needs to confirm identity again". */
export class ReauthRequiredError extends Error {
  constructor() {
    super("Reauthentication required");
    this.name = "ReauthRequiredError";
  }
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}
