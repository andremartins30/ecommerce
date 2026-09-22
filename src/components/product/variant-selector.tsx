"use client";

import { cn } from "@/lib/utils";
import type { ProductVariant } from "@/lib/types";

/**
 * Volume selector. Replaces the template's color/size pickers: a perfume's
 * sellable dimension is the volume, and each volume carries its own price,
 * stock and availability (resolved server-side, see availability.ts).
 *
 * A variant that cannot be bought right now is shown, not hidden — struck
 * through — so the shopper can see the full line-up and why one option is
 * unavailable, matching the pattern the original size selector used for a
 * sold-out size.
 */
export function VolumeSelector({
  variants,
  value,
  onChange,
}: {
  variants: ProductVariant[];
  value?: string;
  onChange: (variantId: string) => void;
}) {
  if (variants.length <= 1) return null;

  return (
    <div>
      <p className="mb-2.5 text-xs font-medium text-foreground">Volume</p>
      <div className="flex flex-wrap gap-2">
        {variants.map((variant) => {
          const disabled = !variant.purchasable;
          const selected = value === variant.id;
          return (
            <button
              key={variant.id}
              type="button"
              aria-pressed={selected}
              disabled={disabled}
              onClick={() => onChange(variant.id)}
              className={cn(
                "flex h-10 min-w-16 items-center justify-center rounded-lg border px-3 text-sm font-medium transition-colors",
                selected
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-foreground hover:border-foreground/50",
                disabled &&
                "pointer-events-none border-border/60 text-muted-foreground/40 line-through"
              )}
            >
              {variant.volumeMl} ml
            </button>
          );
        })}
      </div>
    </div>
  );
}
