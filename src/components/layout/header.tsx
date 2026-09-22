"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Heart,
  Menu,
  Search,
  ShoppingBag,
  ArrowLeftRight,
  Headphones,
  ChevronDown,
  LayoutGrid,
  Sparkles,
  User,
} from "lucide-react";
import { NAV_LINKS } from "@/lib/nav";
import { useCartCount, useCartStore } from "@/store/cart-store";
import { useWishlistCount } from "@/store/wishlist-store";
import { useCompareCount } from "@/store/compare-store";
import { useAuthStore } from "@/store/auth-store";
import { useUiStore } from "@/store/ui-store";
import { useHydrated } from "@/hooks/use-hydrated";
import { cn } from "@/lib/utils";

export function SiteHeader({ transparent = false }: { transparent?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const pathname = usePathname();
  const hydrated = useHydrated();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const cartCount = useCartCount();
  const wishlistCount = useWishlistCount();
  const compareCount = useCompareCount();
  const openCart = useCartStore((s) => s.open);
  const openSearch = useUiStore((s) => s.openSearch);
  const toggleMobileNav = useUiStore((s) => s.toggleMobileNav);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 20);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full bg-white shadow-xs">
      {/* Top Tier: Logo, Search Bar, Quick Actions */}
      <div className="border-b border-black/5 bg-white">
        <div className="container-page flex h-20 items-center justify-between gap-4 lg:gap-8">
          {/* Mobile hamburger */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              aria-label="Open menu"
              onClick={() => toggleMobileNav(true)}
              className="-ml-2 flex size-10 items-center justify-center rounded-lg text-slate-800 hover:bg-slate-100"
            >
              <Menu className="size-6" />
            </button>
          </div>

          {/* Logo & Slogan */}
          <Link href="/" className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#0B1A30] text-white shadow-xs">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                <path d="M3 6h18" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-heading text-xl font-extrabold tracking-[0.08em] text-[#0B1A30] uppercase">
                Nebula
              </span>
              <span className="text-[10px] font-medium tracking-tight text-slate-500">
                Live Better. Every Day.
              </span>
            </div>
          </Link>

          {/* Center: Search Bar */}
          <div className="hidden max-w-2xl flex-1 lg:block">
            <div
              onClick={openSearch}
              className="group relative flex h-11.5 w-full cursor-pointer items-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50/70 px-4 transition-all duration-200 hover:border-slate-300 hover:bg-white hover:shadow-xs"
            >
              <input
                type="text"
                readOnly
                placeholder="Search for products, brands and more..."
                className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-hidden"
              />
              <button
                type="button"
                aria-label="Submit search"
                className="absolute top-1/2 right-1.5 -translate-y-1/2 flex size-8.5 items-center justify-center rounded-md bg-[#0B1A30] text-white transition-transform duration-150 active:scale-95"
              >
                <Search className="size-4" />
              </button>
            </div>
          </div>

          {/* Right Action Icons: Wishlist, Compare, Cart */}
          <div className="flex items-center gap-2 sm:gap-6">
            {/* Mobile search button */}
            <button
              aria-label="Search"
              onClick={openSearch}
              className="flex size-9.5 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 lg:hidden"
            >
              <Search className="size-5" />
            </button>

            {/* Account / Sign In */}
            <Link
              href={hydrated && isAuthenticated ? "/account" : "/register"}
              className="group flex flex-col items-center gap-1 text-slate-700 transition-colors hover:text-[#0B1A30]"
            >
              <div className="relative">
                <User className="size-5 transition-transform duration-200 group-hover:scale-110" strokeWidth={1.75} />
                {hydrated && isAuthenticated && (
                  <span className="absolute -top-1 -right-1 size-2 rounded-full bg-emerald-500 ring-2 ring-white" />
                )}
              </div>
              <span className="hidden text-[11px] font-medium sm:block">
                {hydrated && isAuthenticated ? (user?.name?.split(" ")[0] ?? "Account") : "Sign Up"}
              </span>
            </Link>

            {/* Wishlist */}
            <Link
              href="/wishlist"
              className="group flex flex-col items-center gap-1 text-slate-700 transition-colors hover:text-[#0B1A30]"
            >
              <div className="relative">
                <Heart className="size-5 transition-transform duration-200 group-hover:scale-110" strokeWidth={1.75} />
                {hydrated && wishlistCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 flex size-4.5 items-center justify-center rounded-full bg-[#0B1A30] text-[10px] font-bold text-white shadow-xs">
                    {wishlistCount}
                  </span>
                )}
              </div>
              <span className="hidden text-[11px] font-medium sm:block">Wishlist</span>
            </Link>

            {/* Compare */}
            <Link
              href="/compare"
              className="group hidden flex-col items-center gap-1 text-slate-700 transition-colors hover:text-[#0B1A30] sm:flex"
            >
              <div className="relative">
                <ArrowLeftRight className="size-5 transition-transform duration-200 group-hover:scale-110" strokeWidth={1.75} />
                {hydrated && compareCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 flex size-4.5 items-center justify-center rounded-full bg-[#0B1A30] text-[10px] font-bold text-white shadow-xs">
                    {compareCount}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-medium">Compare</span>
            </Link>

            {/* Cart */}
            <button
              onClick={openCart}
              aria-label="Open cart"
              className="group flex flex-col items-center gap-1 text-slate-700 transition-colors hover:text-[#0B1A30]"
            >
              <div className="relative">
                <ShoppingBag className="size-5 transition-transform duration-200 group-hover:scale-110" strokeWidth={1.75} />
                {hydrated && cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 flex size-4.5 items-center justify-center rounded-full bg-[#0B1A30] text-[10px] font-bold text-white shadow-xs">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="hidden text-[11px] font-medium sm:block">Cart</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Tier: Dark Navy Sub-Navigation Bar */}
      <div className="hidden bg-[#0B1A30] text-white lg:block">
        <div className="container-page flex h-12 items-center justify-between">
          <div className="flex items-center gap-8">
            {/* Shop by Categories Trigger */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setCategoryMenuOpen(!categoryMenuOpen)}
                className="flex h-12 items-center gap-2.5 bg-[#0F2444] px-5 text-sm font-semibold tracking-wide text-white transition-colors hover:bg-[#132d54]"
              >
                <LayoutGrid className="size-4" />
                <span>Shop by Categories</span>
                <ChevronDown className={cn("size-3.5 transition-transform duration-200", categoryMenuOpen && "rotate-180")} />
              </button>

              {/* Dropdown Menu when toggled */}
              {categoryMenuOpen && (
                <div
                  onMouseLeave={() => setCategoryMenuOpen(false)}
                  className="absolute top-full left-0 z-50 w-64 rounded-b-xl border border-slate-200 bg-white py-2 text-slate-800 shadow-xl"
                >
                  <Link href="/categorias/contratipos" className="flex items-center justify-between px-4 py-2.5 text-xs font-medium hover:bg-slate-50">
                    <span>Contratipos</span>
                    <span className="text-slate-400">›</span>
                  </Link>
                  <Link href="/categorias/importados" className="flex items-center justify-between px-4 py-2.5 text-xs font-medium hover:bg-slate-50">
                    <span>Importados</span>
                    <span className="text-slate-400">›</span>
                  </Link>
                  <Link href="/categorias/nicho" className="flex items-center justify-between px-4 py-2.5 text-xs font-medium hover:bg-slate-50">
                    <span>Nicho</span>
                    <span className="text-slate-400">›</span>
                  </Link>
                  <div className="my-1 border-t border-slate-100" />
                  <Link href="/shop?collection=sale" className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50">
                    <Sparkles className="size-3.5" />
                    <span>Promoções</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Nav Links */}
            <nav className="flex items-center gap-6">
              {NAV_LINKS.map((link) => {
                const isActive = pathname === link.href.split("?")[0];
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "text-xs font-medium tracking-wide text-slate-200 transition-colors hover:text-white",
                      isActive && "font-semibold text-white"
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right: Support hotline */}
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <Headphones className="size-4 text-slate-400" />
            <span>Support: <strong className="font-semibold text-white">(123) 456-7890</strong></span>
          </div>
        </div>
      </div>
    </header>
  );
}
