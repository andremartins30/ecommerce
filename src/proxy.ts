import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser, getSessionMeta } from "@/server/services/auth/session";

/**
 * Route protection.
 *
 * Next.js 16 renamed `middleware.ts` to `proxy.ts` (the old name is
 * deprecated) and Proxy now runs on the Node.js runtime by default — which is
 * what makes it safe to call `getSessionUser()` here: it queries the
 * `Session` table through Prisma directly, so a stolen cookie can be
 * revoked server-side by deleting/marking its row. A stateless signed cookie
 * could not offer that.
 *
 * This only checks *that* a session exists (and, for /admin, that it belongs
 * to staff). It does not check *what* that session is allowed to do — RBAC
 * (permissions per role) is task 18. A Server Action must still verify
 * authorization on its own; Proxy is a first gate, not the only one (see the
 * Next.js docs' own warning that a Proxy matcher change can silently drop
 * coverage without every action re-checking auth itself).
 */

const PROTECTED_ACCOUNT_PREFIX = "/account";
const PROTECTED_ADMIN_PREFIX = "/admin";

/** The MFA setup/challenge routes are themselves under /admin but must stay reachable while MFA is unsatisfied, or no one could ever clear the gate below. */
const MFA_ROUTES = ["/admin/mfa/setup", "/admin/mfa/challenge"];

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminRoute = pathname.startsWith(PROTECTED_ADMIN_PREFIX);
  const isAccountRoute = pathname.startsWith(PROTECTED_ACCOUNT_PREFIX);

  if (!isAdminRoute && !isAccountRoute) {
    return NextResponse.next();
  }

  const user = await getSessionUser();

  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminRoute && (!user.adminUser || !user.adminUser.isActive)) {
    // A signed-in customer hitting /admin is not "unauthenticated" — send
    // them home rather than to a login screen they already passed.
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (isAdminRoute && !MFA_ROUTES.some((route) => pathname.startsWith(route))) {
    // MFA is mandatory for staff (AdminUser.mfaRequired). Route-level here
    // because it applies to every /admin page uniformly; requireReauth() in
    // session.ts is the separate, narrower, per-action gate for specific
    // sensitive Server Actions.
    if (!user.mfaEnabledAt) {
      return NextResponse.redirect(new URL("/admin/mfa/setup", request.url));
    }

    const meta = await getSessionMeta();
    if (!meta?.mfaSatisfied) {
      return NextResponse.redirect(new URL("/admin/mfa/challenge", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/account/:path*"],
};
