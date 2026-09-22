"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { toast } from "sonner";

interface CompareState {
  productIds: string[];
  toggle: (productId: string, productName?: string) => void;
  add: (productId: string, productName?: string) => void;
  remove: (productId: string, productName?: string) => void;
  has: (productId: string) => boolean;
  clear: () => void;
}

const MAX_COMPARE_ITEMS = 4;

export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      productIds: [],
      toggle: (productId, productName) => {
        const exists = get().productIds.includes(productId);
        if (exists) {
          get().remove(productId, productName);
        } else {
          get().add(productId, productName);
        }
      },
      add: (productId, productName) => {
        const current = get().productIds;
        if (current.includes(productId)) return;

        if (current.length >= MAX_COMPARE_ITEMS) {
          toast.error("Comparison limit reached", {
            description: `You can compare up to ${MAX_COMPARE_ITEMS} products at a time.`,
          });
          return;
        }

        set({ productIds: [...current, productId] });
        toast.success("Added to comparison", {
          description: productName ? `${productName} added` : "Product added to compare list",
        });
      },
      remove: (productId, productName) => {
        set((s) => ({ productIds: s.productIds.filter((id) => id !== productId) }));
        toast.info("Removed from comparison", {
          description: productName ? `${productName} removed` : "Product removed from compare list",
        });
      },
      has: (productId) => get().productIds.includes(productId),
      clear: () => {
        set({ productIds: [] });
        toast.info("Comparison list cleared");
      },
    }),
    { name: "nebula-compare" }
  )
);

export const useCompareCount = () => useCompareStore((s) => s.productIds.length);
