"use client";

import { SiteHeader } from "@/components/layout/header";

export function SiteHeaderController({ userDisplayName }: { userDisplayName: string | null }) {
  return <SiteHeader transparent={false} userDisplayName={userDisplayName} />;
}
