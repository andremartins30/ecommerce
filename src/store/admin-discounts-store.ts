"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { LegacyDiscount as Discount } from "@/lib/types";
import { discounts as seedDiscounts } from "@/lib/data/discounts";

interface AdminDiscountsState {
  discounts: Discount[];
  upsertDiscount: (discount: Discount) => void;
  deleteDiscount: (id: string) => void;
}

export const useAdminDiscountsStore = create<AdminDiscountsState>()(
  persist(
    (set, get) => ({
      discounts: seedDiscounts,
      upsertDiscount: (discount) =>
        set({
          discounts: get().discounts.some((d) => d.id === discount.id)
            ? get().discounts.map((d) => (d.id === discount.id ? discount : d))
            : [discount, ...get().discounts],
        }),
      deleteDiscount: (id) => set({ discounts: get().discounts.filter((d) => d.id !== id) }),
    }),
    { name: "perfumaria-admin-discounts" }
  )
);
