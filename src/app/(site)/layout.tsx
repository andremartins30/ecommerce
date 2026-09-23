import { SiteHeaderController } from "@/components/layout/site-header-controller";
import { SiteFooter } from "@/components/layout/footer";
import { CartDrawer } from "@/components/layout/cart-drawer";
import { SearchOverlay } from "@/components/layout/search-overlay";
import { MobileNav } from "@/components/layout/mobile-nav";
import { QuickViewDialog } from "@/components/product/quick-view-dialog";
import { FloatingCompareBar } from "@/components/compare/floating-compare-bar";
import { listCategories } from "@/server/services/catalog/queries";
import { getStoreSettings } from "@/server/services/settings/store-settings";
import { getSessionUser } from "@/server/services/auth/session";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [categories, settings, user] = await Promise.all([
    listCategories(),
    getStoreSettings(),
    getSessionUser(),
  ]);
  const shippingPolicy = { handlingDays: settings.handlingDays, shipmentPolicy: settings.shipmentPolicy };
  const userDisplayName = user ? user.customer?.name ?? user.email : null;

  return (
    <div className="flex min-h-screen flex-col bg-[#F8F9FA]">
      <SiteHeaderController
        userDisplayName={userDisplayName}
        storeName={settings.name}
        logoUrl={settings.logoUrl}
        phone={settings.phone || undefined}
      />
      <main className="flex-1">{children}</main>
      <SiteFooter
        storeName={settings.name}
        logoUrl={settings.logoUrl}
        email={settings.email || undefined}
        phone={settings.phone || undefined}
      />
      <CartDrawer shippingPolicy={shippingPolicy} />
      <SearchOverlay />
      <MobileNav categories={categories} />
      <QuickViewDialog />
      <FloatingCompareBar />
    </div>
  );
}
