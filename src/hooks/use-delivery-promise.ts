"use client";

import { useMemo } from "react";
import {
  computeDeliveryPromise,
  describePromise,
  type PromiseDisclosure,
  type ShipmentPolicy,
} from "@/server/domain/delivery/delivery-promise";
import type { ProductVariant } from "@/lib/types";

/**
 * Derives the delivery promise for a single selected variant on the product
 * page.
 *
 * `computeDeliveryPromise` is a pure function (no I/O), so running it on the
 * client here is safe — it is the same module the cart and checkout use, kept
 * as the single source of truth for the "production is never merged with
 * transit" rule. There is no destination yet on this screen (no CEP), so
 * `transit` is always null and the disclosure never shows a delivery date —
 * only the production window, when the variant needs one.
 */
export function useDeliveryPromise(
  variant: ProductVariant | undefined,
  shippingPolicy: { handlingDays: number; shipmentPolicy: ShipmentPolicy }
): PromiseDisclosure | null {
  return useMemo(() => {
    if (!variant) return null;

    const requiresProduction =
      variant.availability.kind === "MADE_TO_ORDER" || variant.availability.kind === "PARTIAL";
    const productionLeadTimeDays = requiresProduction
      ? variant.availability.kind === "MADE_TO_ORDER" || variant.availability.kind === "PARTIAL"
        ? variant.availability.productionLeadTimeDays
        : 0
      : 0;

    const promise = computeDeliveryPromise({
      items: [{ ref: variant.id, requiresProduction, productionLeadTimeDays }],
      settings: {
        handlingDays: shippingPolicy.handlingDays,
        shipmentPolicy: shippingPolicy.shipmentPolicy,
      },
      transit: null,
    });

    return describePromise(promise);
  }, [variant, shippingPolicy.handlingDays, shippingPolicy.shipmentPolicy]);
}
