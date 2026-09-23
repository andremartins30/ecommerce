"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WishlistState {
  productIds: string[];
  toggle: (productId: string) => void;
  add: (productId: string) => void;
  remove: (productId: string) => void;
  has: (productId: string) => boolean;
  clear: () => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      productIds: [],
      toggle: (productId) => {
        const exists = get().productIds.includes(productId);
        set({
          productIds: exists
            ? get().productIds.filter((id) => id !== productId)
            : [...get().productIds, productId],
        });
      },
      add: (productId) =>
        set((s) =>
          s.productIds.includes(productId)
            ? s
            : { productIds: [...s.productIds, productId] }
        ),
      remove: (productId) =>
        set((s) => ({ productIds: s.productIds.filter((id) => id !== productId) })),
      has: (productId) => get().productIds.includes(productId),
      clear: () => set({ productIds: [] }),
    }),
    { name: "perfumaria-wishlist" }
  )
);

export const useWishlistCount = () => useWishlistStore((s) => s.productIds.length);
