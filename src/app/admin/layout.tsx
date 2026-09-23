import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { getSessionUser } from "@/server/services/auth/session";
import { getStoreSettings } from "@/server/services/settings/store-settings";

export const metadata: Metadata = {
  title: {
    default: "Admin",
    template: "%s — Admin",
  },
};

/**
 * `src/proxy.ts` already blocks non-staff requests to /admin/**, but that
 * check must not be the only one (see the Next.js docs' own warning on
 * matcher coverage silently dropping). This re-checks server-side and is
 * where the real admin name comes from for the topbar, instead of the
 * hardcoded "AM" avatar the mock admin used to show.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [user, settings] = await Promise.all([getSessionUser(), getStoreSettings()]);
  if (!user || !user.adminUser || !user.adminUser.isActive) {
    redirect(user ? "/" : "/login?redirect=/admin");
  }

  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:block">
        <div className="sticky top-0 h-screen">
          <AdminSidebar permissionKeys={user.adminUser.permissionKeys} storeName={settings.name} logoUrl={settings.logoUrl} />
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar
          adminName={user.adminUser.name}
          adminEmail={user.email}
          permissionKeys={user.adminUser.permissionKeys}
          storeName={settings.name}
          logoUrl={settings.logoUrl}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
