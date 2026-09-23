"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_NAV } from "@/lib/nav";
import { ADMIN_ICONS } from "@/components/admin/admin-icon";
import { cn } from "@/lib/utils";

/**
 * `permissionKeys` hides items a role couldn't act on anyway — this is
 * presentation only, never the enforcement boundary (see ARCHITECTURE.md
 * and rbac.ts's own comment). Every write action re-checks the same
 * permission on the server regardless of what this menu shows.
 */
export function AdminSidebar({
  onNavigate,
  permissionKeys = [],
}: {
  onNavigate?: () => void;
  permissionKeys?: string[];
}) {
  const pathname = usePathname();
  const visibleNav = ADMIN_NAV.filter(
    (item) => !("permission" in item) || permissionKeys.includes(item.permission)
  );

  return (
    <div className="flex h-full flex-col">
      <Link href="/admin" className="flex items-center gap-2 px-5 py-5">
        <span className="font-heading text-lg font-extrabold tracking-[0.1em] text-[#0B1A30] uppercase">NEBULA</span>
        <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
          Admin
        </span>
      </Link>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3">
        {visibleNav.map((item) => {
          const Icon = ADMIN_ICONS[item.icon];
          const isActive = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
              )}
            >
              {Icon && <Icon className="size-4 shrink-0" strokeWidth={1.75} />}
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border p-4">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
        >
          ← Back to Store
        </Link>
      </div>
    </div>
  );
}
