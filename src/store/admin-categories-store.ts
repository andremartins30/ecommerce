"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { LegacyCategory as Category } from "@/lib/types";
import { categories as seedCategories } from "@/lib/data/categories";

interface AdminCategoriesState {
  categories: Category[];
  upsertCategory: (category: Category) => void;
  deleteCategory: (id: string) => void;
}

export const useAdminCategoriesStore = create<AdminCategoriesState>()(
  persist(
    (set, get) => ({
      categories: seedCategories,
      upsertCategory: (category) =>
        set({
          categories: get().categories.some((c) => c.id === category.id)
            ? get().categories.map((c) => (c.id === category.id ? category : c))
            : [...get().categories, category],
        }),
      deleteCategory: (id) => set({ categories: get().categories.filter((c) => c.id !== id) }),
    }),
    { name: "arkive-admin-categories" }
  )
);
