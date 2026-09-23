"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SearchState {
  recentSearches: string[];
  addRecent: (term: string) => void;
  removeRecent: (term: string) => void;
  clearRecent: () => void;
}

export const useSearchStore = create<SearchState>()(
  persist(
    (set, get) => ({
      recentSearches: [],
      addRecent: (term) => {
        const trimmed = term.trim();
        if (!trimmed) return;
        const next = [trimmed, ...get().recentSearches.filter((t) => t.toLowerCase() !== trimmed.toLowerCase())].slice(
          0,
          6
        );
        set({ recentSearches: next });
      },
      removeRecent: (term) =>
        set({ recentSearches: get().recentSearches.filter((t) => t !== term) }),
      clearRecent: () => set({ recentSearches: [] }),
    }),
    { name: "perfumaria-search" }
  )
);
