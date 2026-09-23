"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { LegacyOrder as Order, LegacyOrderStatus as OrderStatus } from "@/lib/types";
import { orders as seedOrders } from "@/lib/data/orders";

interface AdminOrdersState {
  orders: Order[];
  updateStatus: (id: string, status: OrderStatus) => void;
  getById: (id: string) => Order | undefined;
}

export const useAdminOrdersStore = create<AdminOrdersState>()(
  persist(
    (set, get) => ({
      orders: seedOrders,
      updateStatus: (id, status) =>
        set({
          orders: get().orders.map((o) =>
            o.id === id ? { ...o, status, updatedAt: new Date().toISOString() } : o
          ),
        }),
      getById: (id) => get().orders.find((o) => o.id === id),
    }),
    { name: "perfumaria-admin-orders" }
  )
);
