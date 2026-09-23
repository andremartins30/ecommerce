"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { LegacyProduct as Product } from "@/lib/types";
import { products as seedProducts } from "@/lib/data/products";
import { slugify } from "@/lib/data/seed";

interface AdminProductsState {
  products: Product[];
  upsertProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  duplicateProduct: (id: string) => void;
  getById: (id: string) => Product | undefined;
}

export const useAdminProductsStore = create<AdminProductsState>()(
  persist(
    (set, get) => ({
      products: seedProducts,
      upsertProduct: (product) =>
        set({
          products: get().products.some((p) => p.id === product.id)
            ? get().products.map((p) => (p.id === product.id ? product : p))
            : [product, ...get().products],
        }),
      deleteProduct: (id) => set({ products: get().products.filter((p) => p.id !== id) }),
      duplicateProduct: (id) => {
        const original = get().products.find((p) => p.id === id);
        if (!original) return;
        const newId = `prod-${Date.now()}`;
        const copy: Product = {
          ...original,
          id: newId,
          name: `${original.name} (Copy)`,
          slug: `${slugify(original.name)}-copy-${Date.now().toString().slice(-4)}`,
          status: "draft",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set({ products: [copy, ...get().products] });
      },
      getById: (id) => get().products.find((p) => p.id === id),
    }),
    { name: "perfumaria-admin-products" }
  )
);
