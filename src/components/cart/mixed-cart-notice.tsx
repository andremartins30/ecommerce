import { AlertTriangle, Factory } from "lucide-react";
import type { PromiseDisclosure } from "@/server/domain/delivery/delivery-promise";
import { formatDays } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Cart-level delivery notice.
 *
 * Same rule as the product page: production and transit are never merged
 * into one number. Additionally warns when the store ships once
 * (SINGLE_SHIPMENT) and the cart mixes ready-stock with made-to-order items —
 * the ready-stock item waits for the slowest one, and the shopper has to know
 * that before paying, not after.
 */
export function MixedCartNotice({
  disclosure,
  className,
}: {
  disclosure: PromiseDisclosure;
  className?: string;
}) {
  if (!disclosure.showProduction) return null;

  return (
    <div className={cn("space-y-2 rounded-lg border border-border bg-muted/30 p-3.5 text-sm", className)}>
      <div className="flex items-start gap-2.5 text-foreground">
        <Factory className="mt-0.5 size-4 shrink-0 text-accent" />
        <p>
          Itens sob encomenda deste pedido têm produção em até{" "}
          <strong>{formatDays(disclosure.productionDays)}</strong> antes do envio. O prazo de
          transporte é calculado no checkout, após informar o CEP.
        </p>
      </div>
      {disclosure.showSingleShipmentWarning && (
        <div className="flex items-start gap-2.5 text-amber-700 dark:text-amber-400">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <p>
            Este pedido é enviado em uma única remessa: os itens de pronta entrega aguardam a
            conclusão da produção dos demais.
          </p>
        </div>
      )}
    </div>
  );
}
