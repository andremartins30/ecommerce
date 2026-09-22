"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthUser } from "@/lib/types";
import { customers } from "@/lib/data/customers";

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string) => Promise<void>;
  register: (name: string, email: string) => Promise<void>;
  logout: () => void;
}

const DEMO_CUSTOMER = customers[0];

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: async (email: string) => {
        await new Promise((r) => setTimeout(r, 700));
        set({
          user: {
            id: DEMO_CUSTOMER.id,
            name: DEMO_CUSTOMER.name,
            email: email || DEMO_CUSTOMER.email,
            avatar: DEMO_CUSTOMER.avatar,
          },
          isAuthenticated: true,
        });
      },
      register: async (name: string, email: string) => {
        await new Promise((r) => setTimeout(r, 900));
        set({
          user: {
            id: DEMO_CUSTOMER.id,
            name: name || DEMO_CUSTOMER.name,
            email: email || DEMO_CUSTOMER.email,
            avatar: DEMO_CUSTOMER.avatar,
          },
          isAuthenticated: true,
        });
      },
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    { name: "arkive-auth" }
  )
);
