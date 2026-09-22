"use client";

import { useEffect, useState } from "react";
import type { ProductSummary } from "@/lib/types";

interface FetchState {
  key: string;
  items: ProductSummary[];
  loading: boolean;
}

/**
 * Resolves a client-held list of product ids into current ProductSummary data
 * via /api/products/by-ids. Used by the wishlist and the compare tray, both of
 * which store only ids client-side.
 *
 * Tracks fetch state as one object keyed by the request it belongs to, rather
 * than separate `items`/`loading` state variables: that is what lets the
 * effect derive "loading" from data instead of calling `setLoading` on its own
 * (https://react.dev/learn/you-might-not-need-an-effect).
 */
export function useProductsByIds(ids: string[]) {
  const key = ids.join(",");
  const hasIds = ids.length > 0;

  const [state, setState] = useState<FetchState>({ key, items: [], loading: hasIds });

  useEffect(() => {
    if (!hasIds) return;

    let cancelled = false;

    fetch(`/api/products/by-ids?ids=${encodeURIComponent(key)}`)
      .then((res) => (res.ok ? res.json() : { items: [] }))
      .then((data: { items: ProductSummary[] }) => {
        if (!cancelled) setState({ key, items: data.items, loading: false });
      })
      .catch(() => {
        if (!cancelled) setState({ key, items: [], loading: false });
      });

    return () => {
      cancelled = true;
    };
  }, [key, hasIds]);

  if (!hasIds) return { items: [], loading: false };
  // While a new key's request is in flight, report loading rather than the
  // previous key's stale items.
  if (state.key !== key) return { items: [], loading: true };
  return { items: state.items, loading: state.loading };
}
