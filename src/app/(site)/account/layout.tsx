import { redirect } from "next/navigation";
import { getSessionUser } from "@/server/services/auth/session";
import { AccountSidebar } from "@/components/account/account-sidebar";

/**
 * `src/proxy.ts` already blocks unauthenticated requests to /account/**, but
 * that check must not be the only one — a matcher change or refactor could
 * silently drop that coverage (see the Next.js docs' own warning on this).
 * This layout re-checks server-side and is where the account area's own
 * pages/actions get the real signed-in user from, instead of a client-only
 * Zustand flag that a browser console could flip.
 */
export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login?redirect=/account");

  const name = user.customer?.name ?? user.email;

  return (
    <div className="container-page py-8 sm:py-10">
      <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
        <AccountSidebar name={name} email={user.email} />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
