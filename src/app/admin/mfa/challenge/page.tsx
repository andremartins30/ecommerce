import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser, getSessionMeta } from "@/server/services/auth/session";
import { MfaChallengeForm } from "@/components/admin/mfa-challenge-form";

export const metadata: Metadata = {
  title: "Verificação em duas etapas",
};

export default async function MfaChallengePage() {
  const user = await getSessionUser();
  if (!user || !user.adminUser) {
    redirect("/login?redirect=/admin/mfa/challenge");
  }
  if (!user.mfaEnabledAt) {
    redirect("/admin/mfa/setup");
  }

  const meta = await getSessionMeta();
  if (meta?.mfaSatisfied) {
    redirect("/admin");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-sm">
        <MfaChallengeForm />
      </div>
    </div>
  );
}
