"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, X } from "lucide-react";
import { toast } from "sonner";
import type { CartLine } from "@/store/cart-store";
import { useCartStore } from "@/store/cart-store";
import { QuantitySelector } from "@/components/product/quantity-selector";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export function CartItem({ line, compact = false }: { line: CartLine; compact?: boolean }) {
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const saveForLater = useCartStore((s) => s.saveForLater);
  const moveToCart = useCartStore((s) => s.moveToCart);

  return (
    <div className={cn("flex gap-3", compact ? "py-3" : "py-5")}>
      <Link
        href={`/product/${line.slug}`}
        className={cn(
          "relative shrink-0 overflow-hidden rounded-lg bg-muted",
          compact ? "size-18" : "size-24 sm:size-28"
        )}
      >
        {line.image && (
          <Image src={line.image} alt={line.name} fill className="object-cover" sizes="140px" />
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              {line.brand}
            </p>
            <Link
              href={`/product/${line.slug}`}
              className="line-clamp-1 font-heading text-sm font-medium text-foreground hover:underline"
            >
              {line.name}
            </Link>
            {line.variantLabel && (
              <p className="mt-0.5 text-xs text-muted-foreground">{line.variantLabel}</p>
            )}
          </div>
          <button
            type="button"
            aria-label={`Remove ${line.name} from cart`}
            onClick={() => {
              removeItem(line.lineId);
              toast("Removed from cart", { description: line.name });
            }}
            className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex items-end justify-between gap-2 pt-2">
          {!line.savedForLater ? (
            <QuantitySelector
              value={line.quantity}
              onChange={(q) => updateQuantity(line.lineId, q)}
              size="sm"
            />
          ) : (
            <button
              type="button"
              onClick={() => moveToCart(line.lineId)}
              className="text-xs font-medium text-accent hover:underline"
            >
              Move to cart
            </button>
          )}
          <div className="flex items-center gap-3">
            {!line.savedForLater && !compact && (
              <button
                type="button"
                onClick={() => saveForLater(line.lineId)}
                className="hidden items-center gap-1 text-xs text-muted-foreground hover:text-foreground sm:flex"
              >
                <Heart className="size-3.5" />
                Save for later
              </button>
            )}
            <span className="text-sm font-semibold tabular-nums text-foreground">
              {formatPrice(line.price * line.quantity)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
