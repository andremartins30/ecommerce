"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { ACCOUNT_NAV } from "@/lib/nav";
import { logoutAction } from "@/server/services/auth/actions";
import { cn } from "@/lib/utils";

export function AccountSidebar({ name, email }: { name: string; email: string }) {
  const pathname = usePathname();

  return (
    <>
      <div className="w-full overflow-hidden lg:hidden">
        <nav className="flex items-center gap-2 overflow-x-auto pb-3 touch-pan-x overscroll-x-contain [-webkit-overflow-scrolling:touch] no-scrollbar">
          {ACCOUNT_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "shrink-0 rounded-full border px-4 py-1.5 text-xs font-bold whitespace-nowrap transition-colors",
                pathname === item.href
                  ? "border-[#0B1A30] bg-[#0B1A30] text-white shadow-xs"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <aside className="hidden w-56 shrink-0 lg:block">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-secondary font-heading text-sm font-semibold text-foreground">
            {(name || "U").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{name || "Minha conta"}</p>
            <p className="truncate text-xs text-muted-foreground">{email || ""}</p>
          </div>
        </div>
        <nav className="flex flex-col gap-0.5">
          {ACCOUNT_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                pathname === item.href
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              )}
            >
              {item.label}
            </Link>
          ))}
          <form action={logoutAction}>
            <button
              type="submit"
              className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
            >
              <LogOut className="size-4" /> Sair
            </button>
          </form>
        </nav>
      </aside>
    </>
  );
}
