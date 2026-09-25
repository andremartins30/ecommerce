import { redirect } from "next/navigation";
import { requireUser } from "@/server/services/auth/session";
import { getAccountProfile } from "@/server/services/account/profile-queries";
import { ProfileForm } from "@/components/account/profile-form";
import { ChangePasswordForm } from "@/components/account/change-password-form";

/**
 * Real customer data now (Task 20) — reads through `requireUser()` +
 * `getAccountProfile()`, never the old `profile-store`/`auth-store` demo
 * data. The account layout already redirects unauthenticated visitors, but
 * this is a Server Component and can enforce it again independently (same
 * defense-in-depth reasoning as admin/layout.tsx).
 */
export default async function ProfilePage() {
  const user = await requireUser();
  const profile = await getAccountProfile(user.id);

  if (!profile) {
    // A signed-in User without a Customer profile (e.g. a staff-only
    // account) has nothing to show here.
    redirect("/account");
  }

  return (
    <div className="max-w-xl space-y-10">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-foreground">Perfil</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Gerencie suas informações pessoais.</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex size-16 items-center justify-center rounded-full bg-secondary font-heading text-xl font-semibold text-foreground">
          {(profile.name || "U").charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{profile.email}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {profile.emailVerified ? "E-mail verificado" : "E-mail não verificado"}
          </p>
        </div>
      </div>

      <ProfileForm profile={profile} />

      <div className="border-t border-border" />

      <ChangePasswordForm />
    </div>
  );
}
