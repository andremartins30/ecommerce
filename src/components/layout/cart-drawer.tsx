"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/empty-state";
import { CartItem } from "@/components/cart/cart-item";
import { FreeShippingProgress } from "@/components/cart/free-shipping-progress";
import { MixedCartNotice } from "@/components/cart/mixed-cart-notice";
import { useCartStore } from "@/store/cart-store";
import { useCartDeliveryPromise } from "@/hooks/use-cart-delivery-promise";
import { formatPrice } from "@/lib/format";
import type { ShipmentPolicy } from "@/server/domain/delivery/delivery-promise";

export function CartDrawer({
  shippingPolicy,
}: {
  shippingPolicy: { handlingDays: number; shipmentPolicy: ShipmentPolicy };
}) {
  const isOpen = useCartStore((s) => s.isOpen);
  const close = useCartStore((s) => s.close);
  const lines = useCartStore((s) => s.lines);

  const activeLines = lines.filter((l) => !l.savedForLater);
  const subtotal = activeLines.reduce((sum, l) => sum + l.price * l.quantity, 0);
  const count = activeLines.reduce((sum, l) => sum + l.quantity, 0);
  const { disclosure } = useCartDeliveryPromise(
    activeLines.map((l) => l.variantId),
    shippingPolicy
  );

  return (
    <Sheet open={isOpen} onOpenChange={(open) => (open ? undefined : close())}>
      <SheetContent side="right" className="w-full p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle className="flex items-center gap-2 text-base">
            Your Bag
            {count > 0 && <span className="text-sm font-normal text-muted-foreground">({count})</span>}
          </SheetTitle>
        </SheetHeader>

        {activeLines.length === 0 ? (
          <div className="flex flex-1 items-center justify-center px-5">
            <EmptyState
              icon={ShoppingBag}
              title="Your bag is empty"
              description="Items you add will show up here."
              actionLabel="Continue Shopping"
              onAction={close}
            />
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5">
              <div className="divide-y divide-border">
                {activeLines.map((line) => (
                  <CartItem key={line.lineId} line={line} compact />
                ))}
              </div>
            </div>

            <div className="space-y-4 border-t border-border bg-muted/40 px-5 py-4">
              <FreeShippingProgress subtotal={subtotal} />
              {disclosure && <MixedCartNotice disclosure={disclosure} />}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-heading text-base font-semibold text-foreground">
                  {formatPrice(subtotal)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Shipping, taxes, and discounts calculated at checkout.
              </p>
              <div className="flex flex-col gap-2">
                <Button size="lg" render={<Link href="/checkout" />} onClick={close}>
                  Proceed to Checkout
                </Button>
                <Button size="lg" variant="outline" render={<Link href="/cart" />} onClick={close}>
                  View Bag
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
