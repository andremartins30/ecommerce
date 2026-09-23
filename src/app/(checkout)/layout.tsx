import Image from "next/image";
import Link from "next/link";
import { Lock } from "lucide-react";
import { getStoreSettings } from "@/server/services/settings/store-settings";

// See (auth)/layout.tsx's comment: without this, the logo/name here would be
// frozen at build time instead of reflecting live admin changes.
export const dynamic = "force-dynamic";

export default async function CheckoutLayout({ children }: { children: React.ReactNode }) {
  const settings = await getStoreSettings();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border">
        <div className="container-page flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center">
            {settings.logoUrl ? (
              <Image
                src={settings.logoUrl}
                alt={settings.name}
                width={130}
                height={36}
                className="h-8 w-auto object-contain"
                unoptimized
              />
            ) : (
              <span className="font-heading text-lg font-bold tracking-[0.14em] uppercase">{settings.name}</span>
            )}
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="size-3.5" />
            Checkout seguro
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
