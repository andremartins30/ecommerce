"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { toast } from "sonner";
import type { CartLine } from "@/server/services/cart/cart-queries";
import { removeItem, updateItemQuantity } from "@/server/services/cart/cart-actions";
import { QuantitySelector } from "@/components/product/quantity-selector";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export function CartItem({
  line,
  compact = false,
  onChanged,
}: {
  line: CartLine;
  compact?: boolean;
  onChanged?: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [quantity, setQuantity] = useState(line.quantity);

  function handleRemove() {
    startTransition(async () => {
      const result = await removeItem(line.id);
      if (result.success) {
        toast("Removido da sacola", { description: line.productName });
        onChanged?.();
      } else {
        toast.error(result.formError ?? "Não foi possível remover o item.");
      }
    });
  }

  function handleQuantityChange(next: number) {
    setQuantity(next);
    startTransition(async () => {
      const result = await updateItemQuantity({ itemId: line.id, quantity: next });
      if (result.success) {
        onChanged?.();
      } else {
        setQuantity(line.quantity);
        toast.error(result.formError ?? "Não foi possível atualizar a quantidade.");
      }
    });
  }

  const variantLabel = `${line.volumeMl} ml`;

  return (
    <div className={cn("flex gap-3", compact ? "py-3" : "py-5", isPending && "opacity-60")}>
      <Link
        href={`/produto/${line.productSlug}`}
        className={cn(
          "relative shrink-0 overflow-hidden rounded-lg bg-muted",
          compact ? "size-18" : "size-24 sm:size-28"
        )}
      >
        {line.image && (
          <Image src={line.image.url} alt={line.image.alt || line.productName} fill className="object-cover" sizes="140px" />
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              {line.brandName}
            </p>
            <Link
              href={`/produto/${line.productSlug}`}
              className="line-clamp-1 font-heading text-sm font-medium text-foreground hover:underline"
            >
              {line.productName}
            </Link>
            <p className="mt-0.5 text-xs text-muted-foreground">{variantLabel}</p>
            {!line.variant.purchasable && (
              <p className="mt-1 text-xs font-medium text-destructive">Indisponível no momento</p>
            )}
          </div>
          <button
            type="button"
            aria-label={`Remover ${line.productName} da sacola`}
            onClick={handleRemove}
            disabled={isPending}
            className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex items-end justify-between gap-2 pt-2">
          <QuantitySelector
            value={quantity}
            onChange={handleQuantityChange}
            max={line.variant.maxQuantity ?? undefined}
            size="sm"
          />
          <span className="text-sm font-semibold tabular-nums text-foreground">
            {formatPrice(line.variant.priceCents * quantity)}
          </span>
        </div>
      </div>
    </div>
  );
}
