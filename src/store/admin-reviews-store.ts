"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { LegacyReview as Review } from "@/lib/types";
import { reviews as seedReviews } from "@/lib/data/reviews";

interface AdminReviewsState {
  reviews: Review[];
  setStatus: (id: string, status: Review["status"]) => void;
  deleteReview: (id: string) => void;
}

export const useAdminReviewsStore = create<AdminReviewsState>()(
  persist(
    (set, get) => ({
      reviews: seedReviews,
      setStatus: (id, status) =>
        set({ reviews: get().reviews.map((r) => (r.id === id ? { ...r, status } : r)) }),
      deleteReview: (id) => set({ reviews: get().reviews.filter((r) => r.id !== id) }),
    }),
    { name: "perfumaria-admin-reviews" }
  )
);
