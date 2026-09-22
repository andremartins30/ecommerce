"use client";

import { create } from "zustand";
import type { ProductSummary as Product } from "@/lib/types";

interface UiState {
  isSearchOpen: boolean;
  isMobileNavOpen: boolean;
  quickViewProduct: Product | null;
  openSearch: () => void;
  closeSearch: () => void;
  toggleMobileNav: (open?: boolean) => void;
  openQuickView: (product: Product) => void;
  closeQuickView: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  isSearchOpen: false,
  isMobileNavOpen: false,
  quickViewProduct: null,
  openSearch: () => set({ isSearchOpen: true }),
  closeSearch: () => set({ isSearchOpen: false }),
  toggleMobileNav: (open) => set((s) => ({ isMobileNavOpen: open ?? !s.isMobileNavOpen })),
  openQuickView: (product) => set({ quickViewProduct: product }),
  closeQuickView: () => set({ quickViewProduct: null }),
}));
