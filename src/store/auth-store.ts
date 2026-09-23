"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthUser } from "@/lib/types";
import { customers } from "@/lib/data/customers";

/**
 * DEMO-DATA STORE — no longer the source of truth for "is this browser
 * signed in?"
 *
 * Real authentication (task 16) lives entirely server-side now:
 * src/server/services/auth/session.ts resolves the signed-in user from the
 * HttpOnly session cookie, src/proxy.ts blocks /admin and /account
 * server-side, and src/app/(site)/layout.tsx passes the real display name
 * down to the header. Nothing calls `login`/`register`/`logout` here
 * anymore — they were removed along with the mock login/register forms.
 *
 * What still reads this store (`account-overview-client.tsx`,
 * account/orders/page.tsx, account/profile/page.tsx) does so only to keep
 * showing demo order history and profile data until orders and profiles are
 * migrated to the database (tasks 20/22). `user` here is always the same
 * demo customer, unrelated to whoever actually signed in. Do not use
 * `isAuthenticated` from this store for anything security-relevant.
 */

interface AuthState {
  user: AuthUser;
}

const DEMO_CUSTOMER = customers[0];

const DEMO_USER: AuthUser = {
  id: DEMO_CUSTOMER.id,
  name: DEMO_CUSTOMER.name,
  email: DEMO_CUSTOMER.email,
  avatar: DEMO_CUSTOMER.avatar,
};

export const useAuthStore = create<AuthState>()(
  persist(
    () => ({
      user: DEMO_USER,
    }),
    { name: "perfumaria-auth" }
  )
);
