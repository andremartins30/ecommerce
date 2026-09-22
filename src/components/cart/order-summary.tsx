import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export function OrderSummary({
  subtotal,
  discount = 0,
  discountLabel,
  shipping,
  total,
  className,
}: {
  /** All amounts in cents. */
  subtotal: number;
  discount?: number;
  discountLabel?: string;
  shipping: number;
  total: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3 text-sm", className)}>
      <Row label="Subtotal" value={formatPrice(subtotal)} />
      {discount > 0 && (
        <Row label={discountLabel ?? "Desconto"} value={`-${formatPrice(discount)}`} valueClassName="text-success" />
      )}
      <Row label="Frete" value={shipping === 0 ? "Grátis" : formatPrice(shipping)} />
      {/* No tax row: Brazilian retail prices already include tax. */}
      <div className="border-t border-border pt-3">
        <Row
          label="Total"
          value={formatPrice(total)}
          labelClassName="font-heading text-base font-semibold text-foreground"
          valueClassName="font-heading text-lg font-semibold text-foreground"
        />
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  labelClassName,
  valueClassName,
}: {
  label: string;
  value: string;
  labelClassName?: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={cn("text-muted-foreground", labelClassName)}>{label}</span>
      <span className={cn("font-medium text-foreground tabular-nums", valueClassName)}>{value}</span>
    </div>
  );
}
