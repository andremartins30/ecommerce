import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/server/services/auth/session";
import { MfaSetupForm } from "@/components/admin/mfa-setup-form";

export const metadata: Metadata = {
  title: "Configurar autenticação em duas etapas",
};

/**
 * Mandatory MFA enrollment for staff (AdminUser.mfaRequired). Reachable even
 * though proxy.ts otherwise redirects unsatisfied-MFA admins away from
 * /admin/** — this route is explicitly exempted there, or no one could ever
 * get here to enroll.
 */
export default async function MfaSetupPage() {
  const user = await getSessionUser();
  if (!user || !user.adminUser) {
    redirect("/login?redirect=/admin/mfa/setup");
  }
  if (user.mfaEnabledAt) {
    redirect("/admin");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-md">
        <MfaSetupForm email={user.email} />
      </div>
    </div>
  );
}
