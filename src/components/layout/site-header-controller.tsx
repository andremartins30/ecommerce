"use client";

import { SiteHeader } from "@/components/layout/header";

export function SiteHeaderController({
  userDisplayName,
  storeName,
  logoUrl,
  phone,
}: {
  userDisplayName: string | null;
  storeName: string;
  logoUrl: string;
  phone?: string;
}) {
  return (
    <SiteHeader
      transparent={false}
      userDisplayName={userDisplayName}
      storeName={storeName}
      logoUrl={logoUrl}
      phone={phone}
    />
  );
}
