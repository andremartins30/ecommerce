"use client";

import { useMemo, useState } from "react";
import type { ProductDetail, ProductVariant } from "@/lib/types";
import { pickDefaultVariant } from "@/lib/product-variant";

/**
 * Tracks which volume is selected on a product page.
 *
 * Availability, price and purchasability are never recomputed here — they are
 * already resolved on the server for every variant. This hook only tracks
 * *which* variant is selected and exposes it.
 */
export function useVariantSelection(product: ProductDetail) {
  const initial = useMemo(() => pickDefaultVariant(product.variants), [product.variants]);
  const [variantId, setVariantId] = useState<string | undefined>(initial?.id);

  const variant: ProductVariant | undefined = useMemo(
    () => product.variants.find((v) => v.id === variantId) ?? initial,
    [product.variants, variantId, initial]
  );

  return {
    variantId: variant?.id,
    setVariantId,
    variant,
    isReady: variant !== undefined,
    purchasable: variant?.purchasable ?? false,
  };
}
