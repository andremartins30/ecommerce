"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { useHydrated } from "@/hooks/use-hydrated";
import { Button } from "@/components/ui/button";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const hydrated = useHydrated();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const pathname = usePathname();

  if (!hydrated) return null;

  if (!isAuthenticated) {
    return (
      <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-secondary">
          <LockKeyhole className="size-6 text-foreground" strokeWidth={1.5} />
        </div>
        <h1 className="mt-5 font-heading text-2xl font-semibold text-foreground">
          Sign in to continue
        </h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Sign in to view your orders, wishlist, addresses, and account settings.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href={`/login?redirect=${encodeURIComponent(pathname)}`}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-[#0B1A30] px-6 text-xs font-bold text-white shadow-xs transition-colors hover:bg-[#122b50]"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-6 text-xs font-bold text-slate-700 shadow-xs transition-colors hover:bg-slate-50"
          >
            Create Account
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
