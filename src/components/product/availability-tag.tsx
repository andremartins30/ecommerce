import { CheckCircle2, Clock, XCircle } from "lucide-react";
import type { AvailabilityDisplay } from "@/lib/types";
import { formatDays, pluralize } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Renders an `AvailabilityDisplay` (resolved server-side, see
 * resolveAvailabilityDisplay) as the sentence a shopper actually reads.
 *
 * This is the one place that turns the domain decision into Portuguese copy —
 * every screen that shows availability goes through here, so the wording never
 * drifts between the card, the product page and the cart.
 */
export function AvailabilityTag({
  availability,
  compact = false,
  className,
}: {
  availability: AvailabilityDisplay;
  /** Card context: shorter, single-line text. */
  compact?: boolean;
  className?: string;
}) {
  switch (availability.kind) {
    case "READY_STOCK":
      return (
        <span className={cn("inline-flex items-center gap-1 text-xs text-success", className)}>
          <CheckCircle2 className="size-3.5 shrink-0" />
          {compact ? "Pronta entrega" : renderReadyStock(availability.availableStock, availability.lowStock)}
        </span>
      );

    case "PARTIAL":
      return (
        <span className={cn("inline-flex items-center gap-1 text-xs text-foreground", className)}>
          <Clock className="size-3.5 shrink-0 text-accent" />
          {compact
            ? `Sob encomenda · até ${availability.productionLeadTimeDays} dias`
            : `${pluralize(availability.availableStock, "unidade")} em estoque · demais unidades sob encomenda, produção em até ${formatDays(availability.productionLeadTimeDays)}`}
        </span>
      );

    case "MADE_TO_ORDER":
      return (
        <span className={cn("inline-flex items-center gap-1 text-xs text-foreground", className)}>
          <Clock className="size-3.5 shrink-0 text-accent" />
          {compact
            ? `Sob encomenda · até ${availability.productionLeadTimeDays} dias`
            : `Sob encomenda — produção em até ${formatDays(availability.productionLeadTimeDays)}`}
        </span>
      );

    case "OUT_OF_STOCK":
      return (
        <span className={cn("inline-flex items-center gap-1 text-xs text-muted-foreground", className)}>
          <XCircle className="size-3.5 shrink-0" />
          Indisponível
        </span>
      );

    case "DISCONTINUED":
      return (
        <span className={cn("inline-flex items-center gap-1 text-xs text-muted-foreground", className)}>
          <XCircle className="size-3.5 shrink-0" />
          Produto descontinuado
        </span>
      );
  }
}

function renderReadyStock(availableStock: number, lowStock: boolean): string {
  if (!lowStock) return "Pronta entrega";
  return `Pronta entrega — ${pluralize(availableStock, "unidade")} em estoque`;
}
