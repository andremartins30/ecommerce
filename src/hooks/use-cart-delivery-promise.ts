"use client";

import { useEffect, useState } from "react";
import {
  computeDeliveryPromise,
  describePromise,
  type PromiseDisclosure,
  type ShipmentPolicy,
} from "@/server/domain/delivery/delivery-promise";
import { getCartAvailability } from "@/server/services/catalog/actions";

interface FetchState {
  key: string;
  disclosure: PromiseDisclosure | null;
  loading: boolean;
}

/**
 * Resolves the delivery promise for a whole cart.
 *
 * `CartLine` (the client-side, localStorage-backed cart) carries no
 * availability or lead-time data — only ids and a display price. This hook
 * fetches current, authoritative availability for the cart's variant ids
 * (mirroring the wishlist's by-ids pattern, see useProductsByIds) and folds
 * every line into one `computeDeliveryPromise` call, so the notice reflects
 * real stock right now, not whatever was true when a line was added.
 *
 * Fetch state is tracked as one object keyed by the request it belongs to,
 * rather than separate `disclosure`/`loading` state, so the effect derives
 * "loading" from a key mismatch instead of calling setLoading on its own.
 */
export function useCartDeliveryPromise(
  variantIds: string[],
  shippingPolicy: { handlingDays: number; shipmentPolicy: ShipmentPolicy }
): { disclosure: PromiseDisclosure | null; loading: boolean } {
  const key = variantIds.slice().sort().join(",");
  const hasIds = variantIds.length > 0;

  const [state, setState] = useState<FetchState>({ key, disclosure: null, loading: hasIds });

  useEffect(() => {
    if (!hasIds) return;

    let cancelled = false;

    getCartAvailability(variantIds)
      .then((resolved) => {
        if (cancelled) return;

        if (resolved.length === 0) {
          setState({ key, disclosure: null, loading: false });
          return;
        }

        const promise = computeDeliveryPromise({
          items: resolved.map(({ variant }) => {
            const requiresProduction =
              variant.availability.kind === "MADE_TO_ORDER" || variant.availability.kind === "PARTIAL";
            const productionLeadTimeDays =
              variant.availability.kind === "MADE_TO_ORDER" || variant.availability.kind === "PARTIAL"
                ? variant.availability.productionLeadTimeDays
                : 0;
            return { ref: variant.id, requiresProduction, productionLeadTimeDays };
          }),
          settings: {
            handlingDays: shippingPolicy.handlingDays,
            shipmentPolicy: shippingPolicy.shipmentPolicy,
          },
          transit: null,
        });

        setState({ key, disclosure: describePromise(promise), loading: false });
      })
      .catch(() => {
        if (!cancelled) setState({ key, disclosure: null, loading: false });
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` is the stable, order-independent identity of variantIds; variantIds itself is a new array each render
  }, [key, hasIds, shippingPolicy.handlingDays, shippingPolicy.shipmentPolicy]);

  if (!hasIds) return { disclosure: null, loading: false };
  // While a new key's request is in flight, report loading rather than the
  // previous key's stale disclosure.
  if (state.key !== key) return { disclosure: null, loading: true };
  return { disclosure: state.disclosure, loading: state.loading };
}
