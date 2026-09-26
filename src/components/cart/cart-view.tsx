"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import type { CartView as CartViewData } from "@/server/services/cart/cart-queries";
import { CartItem } from "@/components/cart/cart-item";
import { CouponInput } from "@/components/cart/coupon-input";
import { FreeShippingProgress } from "@/components/cart/free-shipping-progress";
import { OrderSummary } from "@/components/cart/order-summary";
import { MixedCartNotice } from "@/components/cart/mixed-cart-notice";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { computeDeliveryPromise, describePromise, type ShipmentPolicy } from "@/server/domain/delivery/delivery-promise";

export function CartView({
  cart,
  shippingPolicy,
}: {
  cart: CartViewData;
  shippingPolicy: { handlingDays: number; shipmentPolicy: ShipmentPolicy };
}) {
  const router = useRouter();

  const disclosure = useMemo(() => {
    if (cart.lines.length === 0) return null;
    const promise = computeDeliveryPromise({
      items: cart.lines.map((line) => {
        const requiresProduction =
          line.variant.availability.kind === "MADE_TO_ORDER" || line.variant.availability.kind === "PARTIAL";
        const productionLeadTimeDays = requiresProduction
          ? (line.variant.availability as { productionLeadTimeDays: number }).productionLeadTimeDays
          : 0;
        return { ref: line.variantId, requiresProduction, productionLeadTimeDays };
      }),
      settings: { handlingDays: shippingPolicy.handlingDays, shipmentPolicy: shippingPolicy.shipmentPolicy },
      transit: null,
    });
    return describePromise(promise);
  }, [cart.lines, shippingPolicy.handlingDays, shippingPolicy.shipmentPolicy]);

  function refresh() {
    router.refresh();
  }

  if (cart.lines.length === 0) {
    return (
      <div className="container-page py-14">
        <EmptyState
          icon={ShoppingBag}
          title="Sua sacola está vazia"
          description="Parece que você ainda não adicionou nada. Vamos resolver isso."
          actionLabel="Continuar comprando"
          actionHref="/shop"
        />
      </div>
    );
  }

  return (
    <div className="container-page py-10 sm:py-14">
      <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        Sua sacola
      </h1>

      {cart.removedCount > 0 && (
        <p className="mt-3 rounded-lg border border-warning/30 bg-warning/10 px-4 py-2.5 text-sm text-foreground">
          {cart.removedCount === 1
            ? "1 item foi removido da sua sacola porque não está mais disponível."
            : `${cart.removedCount} itens foram removidos da sua sacola porque não estão mais disponíveis.`}
        </p>
      )}

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="divide-y divide-border">
            {cart.lines.map((line) => (
              <CartItem key={line.id} line={line} onChanged={refresh} />
            ))}
          </div>

          <Link href="/shop" className="mt-8 inline-block text-sm font-medium text-foreground underline underline-offset-4">
            Continuar comprando
          </Link>
        </div>

        <div className="h-fit space-y-6 rounded-2xl border border-border bg-card p-6">
          <FreeShippingProgress subtotal={cart.subtotalCents} />
          {disclosure && <MixedCartNotice disclosure={disclosure} />}
          <Separator />
          <CouponInput coupon={cart.coupon} onChanged={refresh} />
          <Separator />
          <OrderSummary
            subtotal={cart.subtotalCents}
            discount={cart.discountCents}
            discountLabel={cart.coupon?.valid ? `Desconto (${cart.coupon.code})` : undefined}
            shipping={cart.shippingCents}
            total={cart.totalCents}
          />
          <Button size="lg" className="w-full" render={<Link href="/checkout" />}>
            Ir para o checkout
          </Button>
        </div>
      </div>
    </div>
  );
}
