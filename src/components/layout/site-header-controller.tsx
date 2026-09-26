"use client";

import { SiteHeader } from "@/components/layout/header";

export function SiteHeaderController({
  userDisplayName,
  storeName,
  logoUrl,
  phone,
  cartCount,
}: {
  userDisplayName: string | null;
  storeName: string;
  logoUrl: string;
  phone?: string;
  cartCount: number;
}) {
  return (
    <SiteHeader
      transparent={false}
      userDisplayName={userDisplayName}
      storeName={storeName}
      logoUrl={logoUrl}
      phone={phone}
      cartCount={cartCount}
    />
  );
}
