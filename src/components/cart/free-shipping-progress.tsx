"use client";

import { motion } from "motion/react";
import { Truck } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { amountUntilFreeShipping, FREE_SHIPPING_THRESHOLD_CENTS } from "@/lib/pricing";
import { cn } from "@/lib/utils";

/** `subtotal` in cents. The threshold comes from the pricing module, not a
 *  local constant that can drift away from what checkout actually charges. */
export function FreeShippingProgress({ subtotal, className }: { subtotal: number; className?: string }) {
  const remaining = amountUntilFreeShipping(subtotal);
  const percent = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD_CENTS) * 100);
  const qualified = remaining === 0;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2 text-xs text-foreground">
        <Truck className="size-3.5 shrink-0 text-accent" />
        {qualified ? (
          <span className="font-medium">You&apos;ve unlocked free shipping</span>
        ) : (
          <span>
            Add <span className="font-semibold">{formatPrice(remaining)}</span> more for free
            shipping
          </span>
        )}
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full rounded-full bg-accent"
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}
