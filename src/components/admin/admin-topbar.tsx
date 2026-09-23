"use client";

import { useState } from "react";
import { Bell, Menu, Search } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logoutAction } from "@/server/services/auth/actions";
import Link from "next/link";

export function AdminTopbar({
  adminName,
  adminEmail,
  permissionKeys = [],
}: {
  adminName: string;
  adminEmail: string;
  permissionKeys?: string[];
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const initials = adminName
    .split(" ")
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur-md sm:px-6">
      <button
        aria-label="Open menu"
        onClick={() => setMobileOpen(true)}
        className="rounded-md p-2 text-foreground lg:hidden"
      >
        <Menu className="size-5" />
      </button>

      <div className="relative hidden max-w-sm flex-1 sm:block">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          placeholder="Search orders, products, customers…"
          className="h-9 w-full rounded-lg border border-border bg-muted/40 pl-9 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button className="relative flex size-9 items-center justify-center rounded-full hover:bg-muted" aria-label="Notifications">
          <Bell className="size-[18px]" />
          <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-accent" />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-full pr-1 pl-1">
            <span className="flex size-8 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-foreground">
              {initials || "?"}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <p className="truncate font-medium text-foreground">{adminName}</p>
              <p className="truncate text-xs font-normal text-muted-foreground">{adminEmail}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href="/admin/settings" />}>Configurações</DropdownMenuItem>
            <DropdownMenuItem render={<Link href="/" />}>Voltar à loja</DropdownMenuItem>
            <DropdownMenuSeparator />
            <form action={logoutAction}>
              <DropdownMenuItem render={<button type="submit" className="w-full text-left" />}>
                Sair
              </DropdownMenuItem>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 bg-sidebar p-0 text-sidebar-foreground">
          <SheetTitle className="sr-only">Admin Menu</SheetTitle>
          <AdminSidebar onNavigate={() => setMobileOpen(false)} permissionKeys={permissionKeys} />
        </SheetContent>
      </Sheet>
    </header>
  );
}
