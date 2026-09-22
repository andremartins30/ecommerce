"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { LegacyProduct as Product, LegacyProductVariant as ProductVariant } from "@/lib/types";
import type { DiscountInput } from "@/lib/pricing";

export interface CartLine {
  lineId: string;
  productId: string;
  slug: string;
  name: string;
  brand: string;
  image: string;
  /**
   * Cents, snapshotted when the line was added. Display only — the server
   * recomputes the authoritative price at checkout and never trusts this.
   */
  price: number;
  variantId: string;
  variantLabel?: string;
  quantity: number;
  savedForLater?: boolean;
}

/**
 * The shape the pricing module expects. Declared there, not here: a pricing
 * rule must not depend on a client store. The store carries the coupon, the
 * pricing module decides what it is worth.
 */
export type AppliedDiscount = DiscountInput;

interface CartState {
  lines: CartLine[];
  isOpen: boolean;
  lastAdded?: string;
  appliedDiscount: AppliedDiscount | null;
  open: () => void;
  close: () => void;
  toggle: () => void;
  addItem: (product: Product, variant: ProductVariant, quantity?: number) => void;
  removeItem: (lineId: string) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  saveForLater: (lineId: string) => void;
  moveToCart: (lineId: string) => void;
  applyDiscount: (discount: AppliedDiscount) => void;
  removeDiscount: () => void;
  clear: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      isOpen: false,
      lastAdded: undefined,
      appliedDiscount: null,
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
            lastAdded: lineId,
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
          lastAdded: lineId,
        });
      },
      removeItem: (lineId) => set({ lines: get().lines.filter((l) => l.lineId !== lineId) }),
      updateQuantity: (lineId, quantity) =>
        set({
          lines: get().lines.map((l) =>
            l.lineId === lineId ? { ...l, quantity: Math.max(1, quantity) } : l
          ),
        }),
      saveForLater: (lineId) =>
        set({
          lines: get().lines.map((l) =>
            l.lineId === lineId ? { ...l, savedForLater: true } : l
          ),
        }),
      moveToCart: (lineId) =>
        set({
          lines: get().lines.map((l) =>
            l.lineId === lineId ? { ...l, savedForLater: false } : l
          ),
        }),
      applyDiscount: (discount) => set({ appliedDiscount: discount }),
      removeDiscount: () => set({ appliedDiscount: null }),
      clear: () => set({ lines: [], appliedDiscount: null }),
    }),
    { name: "arkive-cart" }
  )
);

export const useCartCount = () =>
  useCartStore((s) =>
    s.lines.filter((l) => !l.savedForLater).reduce((sum, l) => sum + l.quantity, 0)
  );

export const useCartSubtotal = () =>
  useCartStore((s) =>
    s.lines
      .filter((l) => !l.savedForLater)
      .reduce((sum, l) => sum + l.price * l.quantity, 0)
  );
