import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthError } from "@/server/services/auth/session";
import { requirePermission } from "@/server/services/auth/rbac";
import { getStoreSettings } from "@/server/services/settings/store-settings";
import { StoreIdentityForm } from "@/components/admin/store-identity-form";

export const metadata: Metadata = {
  title: "Configurações",
};

/**
 * Store identity settings — name, logo, favicon, brand colour and contact
 * details. Backed by SystemSetting (see store-settings.ts), not hardcoded
 * strings: this is the one place an operator changes "who is this store"
 * without a code deploy.
 *
 * Restricted to `settings.write` (SUPER_ADMIN/ADMIN only, per the seeded role
 * map) — same pattern as /admin/auditoria.
 */
export default async function AdminSettingsPage() {
  try {
    await requirePermission("settings.write");
  } catch (error) {
    if (error instanceof AuthError) redirect("/admin");
    throw error;
  }

  const settings = await getStoreSettings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-foreground sm:text-3xl">Configurações</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Identidade da loja exibida no site, e-mails e painel administrativo.
        </p>
      </div>

      <StoreIdentityForm settings={settings} />
    </div>
  );
}
