"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { LegacyProduct as Product, LegacyProductVariant as ProductVariant } from "@/lib/types";

/**
 * As of Task 21, the real cart (line items, quantities, pricing, coupon) is
 * persisted server-side — see `src/server/services/cart/`. What is left
 * here is:
 *
 * 1. `isOpen`/`open`/`close`/`toggle` — the cart *drawer's* UI state, which
 *    has no reason to live on the server; header.tsx and product-detail.tsx
 *    still call `open()` to pop the drawer after adding an item, and
 *    cart-drawer.tsx reads `isOpen` to render it.
 * 2. `lines`/`addItem`/etc — kept only because compare-view.tsx (a page that
 *    is itself still 100% mock/legacy apparel data, unrelated to the real
 *    perfumery catalogue) calls `addItem()` against its own mock products.
 *    Nothing that touches real products reads or writes this anymore. This
 *    is dead weight scheduled for removal once /compare is migrated to real
 *    data — not before, or that page would have nothing to add to.
 */

export interface CartLine {
  lineId: string;
  productId: string;
  slug: string;
  name: string;
  brand: string;
  image: string;
  price: number;
  variantId: string;
  variantLabel?: string;
  quantity: number;
}

interface CartState {
  lines: CartLine[];
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  addItem: (product: Product, variant: ProductVariant, quantity?: number) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      isOpen: false,
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((s) => ({ isOpen: !s.isOpen })),
      addItem: (product, variant, quantity = 1) => {
        const lineId = `${product.id}-${variant.id}`;
        const existing = get().lines.find((l) => l.lineId === lineId);
        if (existing) {
          set({
            lines: get().lines.map((l) =>
              l.lineId === lineId ? { ...l, quantity: l.quantity + quantity } : l
            ),
          });
          return;
        }
        const variantLabel = [variant.color, variant.size].filter(Boolean).join(" / ");
        set({
          lines: [
            ...get().lines,
            {
              lineId,
              productId: product.id,
              slug: product.slug,
              name: product.name,
              brand: product.brand,
              image: product.images[0]?.url ?? "",
              price: product.price + (variant.priceDelta ?? 0),
              variantId: variant.id,
              variantLabel: variantLabel || undefined,
              quantity,
            },
          ],
        });
      },
    }),
    { name: "perfumaria-cart" }
  )
);
