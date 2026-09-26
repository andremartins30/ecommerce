"use client";

import { useEffect, useState, useTransition } from "react";
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
import { useCartStore } from "@/store/cart-store";
import { fetchCartView } from "@/server/services/cart/cart-actions";
import type { CartView } from "@/server/services/cart/cart-queries";
import { formatPrice } from "@/lib/format";

/**
 * The drawer keeps its own copy of the cart (fetched on open, refreshed
 * after any mutation inside it) rather than reading Server Component props
 * — it can be opened from anywhere in the site (see `openCart()` in
 * header.tsx/product-detail.tsx), not just from a page that already fetched
 * one.
 */
export function CartDrawer() {
  const isOpen = useCartStore((s) => s.isOpen);
  const close = useCartStore((s) => s.close);
  const [cart, setCart] = useState<CartView | null>(null);
  const [, startTransition] = useTransition();

  function refresh() {
    startTransition(async () => {
      setCart(await fetchCartView());
    });
  }

  useEffect(() => {
    if (isOpen) refresh();
  }, [isOpen]);

  const lines = cart?.lines ?? [];
  const count = lines.reduce((sum, l) => sum + l.quantity, 0);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => (open ? undefined : close())}>
      <SheetContent side="right" className="w-full p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle className="flex items-center gap-2 text-base">
            Sua sacola
            {count > 0 && <span className="text-sm font-normal text-muted-foreground">({count})</span>}
          </SheetTitle>
        </SheetHeader>

        {lines.length === 0 ? (
          <div className="flex flex-1 items-center justify-center px-5">
            <EmptyState
              icon={ShoppingBag}
              title="Sua sacola está vazia"
              description="Os itens que você adicionar aparecem aqui."
              actionLabel="Continuar comprando"
              onAction={close}
            />
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5">
              <div className="divide-y divide-border">
                {lines.map((line) => (
                  <CartItem key={line.id} line={line} compact onChanged={refresh} />
                ))}
              </div>
            </div>

            <div className="space-y-4 border-t border-border bg-muted/40 px-5 py-4">
              <FreeShippingProgress subtotal={cart?.subtotalCents ?? 0} />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-heading text-base font-semibold text-foreground">
                  {formatPrice(cart?.subtotalCents ?? 0)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Frete, impostos e descontos calculados no checkout.
              </p>
              <div className="flex flex-col gap-2">
                <Button size="lg" render={<Link href="/checkout" />} onClick={close}>
                  Ir para o checkout
                </Button>
                <Button size="lg" variant="outline" render={<Link href="/cart" />} onClick={close}>
                  Ver sacola
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
