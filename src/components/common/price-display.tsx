import { formatPrice } from "@/lib/format";
import { percentOff, type Cents } from "@/server/domain/pricing/money";
import { cn } from "@/lib/utils";

export function PriceDisplay({
  price,
  compareAtPrice,
  size = "md",
  className,
}: {
  /** Cents. */
  price: number;
  compareAtPrice?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const hasDiscount = !!compareAtPrice && compareAtPrice > price;
  const discountPercent = hasDiscount
    ? percentOff(price as Cents, compareAtPrice as Cents)
    : 0;

  const priceSize =
    size === "lg" ? "text-2xl" : size === "sm" ? "text-sm" : "text-base";
  const compareSize = size === "lg" ? "text-base" : "text-sm";

  return (
    <div className={cn("flex items-baseline gap-2", className)}>
      <span className={cn("font-heading font-semibold text-foreground tabular-nums", priceSize)}>
        {formatPrice(price)}
      </span>
      {hasDiscount && (
        <>
          <span className={cn("text-muted-foreground line-through tabular-nums", compareSize)}>
            {formatPrice(compareAtPrice)}
          </span>
          <span className="text-xs font-medium text-accent">-{discountPercent}%</span>
        </>
      )}
    </div>
  );
}
