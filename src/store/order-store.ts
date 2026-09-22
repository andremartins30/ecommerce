"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { LegacyAddress as Address, LegacyOrderItem as OrderItem } from "@/lib/types";

export interface PlacedOrder {
  id: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  discountCode?: string;
  shipping: number;
  shippingMethod: "standard" | "express";
  total: number;
  paymentMethod: string;
  shippingAddress: Address;
  email: string;
  createdAt: string;
}

interface OrderState {
  lastOrder: PlacedOrder | null;
  setLastOrder: (order: PlacedOrder) => void;
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set) => ({
      lastOrder: null,
      setLastOrder: (order) => set({ lastOrder: order }),
    }),
    { name: "arkive-last-order" }
  )
);

let counter = 0;
export function generateOrderId() {
  counter += 1;
  const random = Math.floor(1000 + Math.random() * 8999);
  return `LC-${random}${counter}`;
}
