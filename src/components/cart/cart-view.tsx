"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { useHydrated } from "@/hooks/use-hydrated";
import { CartItem } from "@/components/cart/cart-item";
import { CouponInput } from "@/components/cart/coupon-input";
import { FreeShippingProgress } from "@/components/cart/free-shipping-progress";
import { OrderSummary } from "@/components/cart/order-summary";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { computeOrderTotals } from "@/lib/pricing";

export function CartView() {
  const hydrated = useHydrated();
  const lines = useCartStore((s) => s.lines);
  const appliedDiscount = useCartStore((s) => s.appliedDiscount);
  const applyDiscount = useCartStore((s) => s.applyDiscount);
  const removeDiscount = useCartStore((s) => s.removeDiscount);

  const activeLines = lines.filter((l) => !l.savedForLater);
  const savedLines = lines.filter((l) => l.savedForLater);
  const subtotal = activeLines.reduce((sum, l) => sum + l.price * l.quantity, 0);
  const { discountAmount, shipping, total } = computeOrderTotals(subtotal, appliedDiscount);

  if (!hydrated) return <div className="container-page py-14" />;

  if (activeLines.length === 0 && savedLines.length === 0) {
    return (
      <div className="container-page py-14">
        <EmptyState
          icon={ShoppingBag}
          title="Your bag is empty"
          description="Looks like you haven't added anything yet. Let's fix that."
          actionLabel="Continue Shopping"
          actionHref="/shop"
        />
      </div>
    );
  }

  return (
    <div className="container-page py-10 sm:py-14">
      <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        Your Bag
      </h1>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
        <div>
          {activeLines.length > 0 ? (
            <div className="divide-y divide-border">
              {activeLines.map((line) => (
                <CartItem key={line.lineId} line={line} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nothing in your bag yet — items you save for later are below.
            </p>
          )}

          {savedLines.length > 0 && (
            <div className="mt-10">
              <h2 className="font-heading text-lg font-semibold text-foreground">
                Saved for Later ({savedLines.length})
              </h2>
              <div className="mt-2 divide-y divide-border">
                {savedLines.map((line) => (
                  <CartItem key={line.lineId} line={line} />
                ))}
              </div>
            </div>
          )}

          <Link href="/shop" className="mt-8 inline-block text-sm font-medium text-foreground underline underline-offset-4">
            Continue Shopping
          </Link>
        </div>

        {activeLines.length > 0 && (
          <div className="h-fit space-y-6 rounded-2xl border border-border bg-card p-6">
            <FreeShippingProgress subtotal={subtotal} />
            <Separator />
            <CouponInput
              appliedCode={appliedDiscount?.code ?? null}
              onApply={applyDiscount}
              onRemove={removeDiscount}
            />
            <Separator />
            <OrderSummary
              subtotal={subtotal}
              discount={discountAmount}
              discountLabel={appliedDiscount ? `Desconto (${appliedDiscount.code})` : undefined}
              shipping={shipping}
              total={total}
            />
            <Button size="lg" className="w-full" render={<Link href="/checkout" />}>
              Proceed to Checkout
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
