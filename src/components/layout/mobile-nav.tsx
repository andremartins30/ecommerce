"use client";

import Link from "next/link";
import { ArrowLeftRight, Heart, Search, User } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { NAV_LINKS } from "@/lib/nav";
import { useUiStore } from "@/store/ui-store";
import type { Category } from "@/lib/types";

export function MobileNav({ categories = [] }: { categories?: Category[] }) {
  const isOpen = useUiStore((s) => s.isMobileNavOpen);
  const toggle = useUiStore((s) => s.toggleMobileNav);
  const openSearch = useUiStore((s) => s.openSearch);

  function close() {
    toggle(false);
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => toggle(open)}>
      <SheetContent side="left" className="w-full p-0 sm:max-w-xs">
        <SheetHeader className="border-b border-slate-200 px-5 py-4">
          <SheetTitle className="font-heading text-lg font-extrabold tracking-[0.1em] text-[#0B1A30] uppercase">
            Perfumaria
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <button
            onClick={() => {
              close();
              openSearch();
            }}
            className="mb-5 flex w-full items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-500"
          >
            <Search className="size-4" />
            Search products…
          </button>

          <nav className="flex flex-col">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={close}
                className="border-b border-slate-100 py-3.5 font-heading text-base font-medium text-slate-800"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {categories.length > 0 && (
            <>
              <p className="mt-6 mb-2 text-xs font-semibold tracking-wide text-slate-400 uppercase">
                Categorias
              </p>
              <nav className="flex flex-col">
                {categories.map((c) => (
                  <Link
                    key={c.id}
                    href={`/categorias/${c.slug}`}
                    onClick={close}
                    className="py-2 text-sm text-slate-600 hover:text-slate-900"
                  >
                    {c.name}
                  </Link>
                ))}
              </nav>
            </>
          )}

          <Separator className="my-5" />

          <div className="flex flex-col gap-1">
            <Link
              href="/compare"
              onClick={close}
              className="flex items-center gap-2.5 py-2.5 text-sm font-medium text-slate-800"
            >
              <ArrowLeftRight className="size-4 text-slate-500" /> Compare Products
            </Link>
            <Link
              href="/wishlist"
              onClick={close}
              className="flex items-center gap-2.5 py-2.5 text-sm font-medium text-slate-800"
            >
              <Heart className="size-4 text-slate-500" /> Wishlist
            </Link>
            <Link
              href="/account"
              onClick={close}
              className="flex items-center gap-2.5 py-2.5 text-sm font-medium text-slate-800"
            >
              <User className="size-4 text-slate-500" /> Account
            </Link>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
