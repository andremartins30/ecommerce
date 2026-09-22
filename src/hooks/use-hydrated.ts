"use client";

import { useEffect, useState } from "react";

/**
 * Tracks whether the component has mounted on the client. Used to defer
 * rendering of persisted client-only state (cart, wishlist, auth) until
 * after hydration so the server and first client render always match.
 */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time mount flag, cannot cascade
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
