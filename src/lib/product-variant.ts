import type { ProductVariant } from "@/lib/types";

/**
 * The variant a shopper lands on: the cheapest one they can actually buy, or
 * the cheapest overall when nothing is purchasable. Landing on an unbuyable
 * volume when a buyable one exists is a small thing that quietly costs sales.
 *
 * Pure and framework-free so both the server mapper and client components (the
 * volume selection hook) can share it without pulling server-only code into the
 * client bundle.
 */
export function pickDefaultVariant(variants: ProductVariant[]): ProductVariant | undefined {
  const purchasable = variants.filter((v) => v.purchasable);
  const pool = purchasable.length > 0 ? purchasable : variants;
  return pool.reduce<ProductVariant | undefined>(
    (cheapest, variant) =>
      cheapest === undefined || variant.priceCents < cheapest.priceCents ? variant : cheapest,
    undefined
  );
}
