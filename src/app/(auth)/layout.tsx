import Image from "next/image";
import Link from "next/link";
import { HERO_IMAGES } from "@/lib/data/images";
import { getStoreSettings } from "@/server/services/settings/store-settings";

// Without a per-request signal (no cookies() read here), Next would
// statically prerender this layout and bake in whatever SystemSetting
// held at build time — an admin changing the store name/logo in
// /admin/settings would then not show up here until the next deploy.
export const dynamic = "force-dynamic";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const settings = await getStoreSettings();

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden lg:block">
        <Image
          src={HERO_IMAGES.homeSecondary}
          alt={settings.name}
          fill
          priority
          sizes="50vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/20" />
        <div className="absolute inset-0 flex flex-col justify-between p-10">
          <Link href="/" className="font-heading text-xl font-extrabold tracking-[0.1em] text-white uppercase">
            {settings.name}
          </Link>
          <p className="max-w-sm font-heading text-2xl font-bold leading-snug text-white text-balance">
            &ldquo;Perfumaria artesanal, prazos que se cumprem.&rdquo;
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 sm:px-10">
        <Link href="/" className="mb-10 flex items-center lg:hidden">
          {settings.logoUrl ? (
            <Image
              src={settings.logoUrl}
              alt={settings.name}
              width={150}
              height={40}
              className="h-9 w-auto object-contain"
              unoptimized
            />
          ) : (
            <span className="font-heading text-2xl font-extrabold tracking-[0.1em] text-[#0B1A30] uppercase">
              {settings.name}
            </span>
          )}
        </Link>
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
