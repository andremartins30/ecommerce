import { Factory, Truck } from "lucide-react";
import type { PromiseDisclosure } from "@/server/domain/delivery/delivery-promise";
import { formatDays } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * The production/transport split, spelled out above the CTA.
 *
 * Renders only the facts `describePromise` decided to disclose — never a
 * single merged "chega em X dias". On the product page there is no
 * destination yet, so `disclosure.showTransit` is always false here; the
 * second line always points the shopper to the cart for a shipping estimate.
 */
export function DeliveryPromiseNotice({
  disclosure,
  className,
}: {
  disclosure: PromiseDisclosure;
  className?: string;
}) {
  if (!disclosure.showProduction) return null;

  return (
    <div className={cn("flex items-start gap-2.5 text-sm text-foreground", className)}>
      <Factory className="mt-0.5 size-4 shrink-0 text-accent" />
      <div>
        <p>
          Produção em até <strong>{formatDays(disclosure.productionDays)}</strong> antes do envio.
        </p>
        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Truck className="size-3.5 shrink-0" />
          Prazo de transporte calculado no carrinho, informando o CEP.
        </p>
      </div>
    </div>
  );
}
