import { requireAdmin, AuthError, type SessionUser } from "@/server/services/auth/session";

/**
 * Permission-gating for admin Server Actions.
 *
 * Every permission key here must exist in `Permission.key` (seeded by
 * `seedRolesAndPermissions` in prisma/seed.ts) — this module does not define
 * new ones, it only checks what a role already grants. Menu-item hiding in
 * admin-sidebar.tsx is presentation only; this is the actual enforcement
 * boundary, and it always runs on the server.
 */

export type AdminSessionUser = SessionUser & { adminUser: NonNullable<SessionUser["adminUser"]> };

/**
 * Resolves the current admin and throws unless their roles grant `key`.
 * Always call this at the top of a Server Action before touching the
 * database — never rely on a hidden menu item as the only gate.
 */
export async function requirePermission(key: string): Promise<AdminSessionUser> {
  const user = await requireAdmin();
  if (!hasPermission(user, key)) {
    throw new AuthError(`Missing permission: ${key}`);
  }
  return user;
}

/** Non-throwing check, for UI-only decisions (e.g. hiding a button an action would reject anyway). Never use this as the only enforcement. */
export function hasPermission(user: Pick<AdminSessionUser, "adminUser">, key: string): boolean {
  return user.adminUser.permissionKeys.includes(key);
}
