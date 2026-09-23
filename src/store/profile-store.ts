"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { LegacyAddress as Address, LegacyPaymentMethodOnFile as PaymentMethodOnFile } from "@/lib/types";
import { customers } from "@/lib/data/customers";

const DEMO_CUSTOMER = customers[0];

interface ProfileState {
  name: string;
  email: string;
  phone: string;
  addresses: Address[];
  paymentMethods: PaymentMethodOnFile[];
  updateProfile: (data: Partial<{ name: string; email: string; phone: string }>) => void;
  addAddress: (address: Omit<Address, "id">) => void;
  updateAddress: (id: string, address: Omit<Address, "id">) => void;
  removeAddress: (id: string) => void;
  setDefaultAddress: (id: string) => void;
  addPaymentMethod: (pm: Omit<PaymentMethodOnFile, "id">) => void;
  removePaymentMethod: (id: string) => void;
  setDefaultPaymentMethod: (id: string) => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      name: DEMO_CUSTOMER.name,
      email: DEMO_CUSTOMER.email,
      phone: DEMO_CUSTOMER.phone,
      addresses: DEMO_CUSTOMER.addresses,
      paymentMethods: DEMO_CUSTOMER.paymentMethods,
      updateProfile: (data) => set((s) => ({ ...s, ...data })),
      addAddress: (address) =>
        set({
          addresses: [
            ...get().addresses,
            { ...address, id: `addr-${Date.now()}` },
          ],
        }),
      updateAddress: (id, address) =>
        set({
          addresses: get().addresses.map((a) => (a.id === id ? { ...address, id } : a)),
        }),
      removeAddress: (id) => set({ addresses: get().addresses.filter((a) => a.id !== id) }),
      setDefaultAddress: (id) =>
        set({
          addresses: get().addresses.map((a) => ({ ...a, isDefault: a.id === id })),
        }),
      addPaymentMethod: (pm) =>
        set({
          paymentMethods: [
            ...get().paymentMethods,
            { ...pm, id: `pm-${Date.now()}` },
          ],
        }),
      removePaymentMethod: (id) =>
        set({ paymentMethods: get().paymentMethods.filter((p) => p.id !== id) }),
      setDefaultPaymentMethod: (id) =>
        set({
          paymentMethods: get().paymentMethods.map((p) => ({ ...p, isDefault: p.id === id })),
        }),
    }),
    { name: "perfumaria-profile" }
  )
);
