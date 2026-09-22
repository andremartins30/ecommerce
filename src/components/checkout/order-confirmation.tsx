"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { Check, Package } from "lucide-react";
import { useOrderStore } from "@/store/order-store";
import { useHydrated } from "@/hooks/use-hydrated";
import { OrderSummary } from "@/components/cart/order-summary";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/empty-state";
import { formatPrice } from "@/lib/format";

export function OrderConfirmation() {
  const hydrated = useHydrated();
  const order = useOrderStore((s) => s.lastOrder);

  if (!hydrated) return <div className="container-page py-20" />;

  if (!order) {
    return (
      <div className="container-page py-20">
        <EmptyState
          icon={Package}
          title="No recent order found"
          description="Looks like you haven't placed an order this session."
          actionLabel="Continue Shopping"
          actionHref="/shop"
        />
      </div>
    );
  }

  return (
    <div className="container-page max-w-3xl py-14 sm:py-20">
      <div className="flex flex-col items-center text-center">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          className="flex size-16 items-center justify-center rounded-full bg-success/15"
        >
          <Check className="size-8 text-success" strokeWidth={2} />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="mt-6 font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
        >
          Order confirmed.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22, duration: 0.5 }}
          className="mt-2 text-muted-foreground"
        >
          Thank you for your purchase. A confirmation has been sent to {order.email}.
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.5 }}
          className="mt-3 font-heading text-lg font-semibold text-foreground"
        >
          Order #{order.id}
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.5 }}
        className="mt-10 grid gap-6 sm:grid-cols-2"
      >
        <div className="space-y-4 rounded-2xl border border-border p-5">
          <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Delivery
          </h2>
          {/* Transit time only. Production time for made-to-order items is a
              separate figure and is added by the delivery promise service. */}
          <p className="text-sm text-foreground">
            Entrega estimada em {order.shippingMethod === "express" ? "1 a 2" : "4 a 7"} dias úteis
            após a postagem
          </p>
          <div>
            <p className="text-sm font-medium text-foreground">{order.shippingAddress.fullName}</p>
            <p className="text-sm text-muted-foreground">
              {order.shippingAddress.line1}
              {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""}
            </p>
            <p className="text-sm text-muted-foreground">
              {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
            </p>
          </div>
        </div>
        <div className="space-y-4 rounded-2xl border border-border p-5">
          <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Payment
          </h2>
          <p className="text-sm text-foreground">{order.paymentMethod}</p>
          <h2 className="pt-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Order Total
          </h2>
          <p className="font-heading text-lg font-semibold text-foreground">
            {formatPrice(order.total)}
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.42, duration: 0.5 }}
        className="mt-6 rounded-2xl border border-border p-5"
      >
        <h2 className="mb-4 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Items
        </h2>
        <div className="space-y-4">
          {order.items.map((item, i) => (
            <div key={`${item.productId}-${i}`} className="flex items-center gap-3">
              <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                {item.image && (
                  <Image src={item.image} alt={item.name} fill className="object-cover" sizes="56px" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-sm font-medium text-foreground">{item.name}</p>
                {item.variant && <p className="text-xs text-muted-foreground">{item.variant}</p>}
                <p className="text-xs text-muted-foreground">Qty {item.quantity}</p>
              </div>
              <span className="text-sm font-medium text-foreground">
                {formatPrice(item.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-5 border-t border-border pt-5">
          <OrderSummary
            subtotal={order.subtotal}
            discount={order.discount}
            discountLabel={order.discountCode ? `Discount (${order.discountCode})` : undefined}
            shipping={order.shipping}
            total={order.total}
          />
        </div>
      </motion.div>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button size="lg" render={<Link href="/account/orders" />}>
          Track Order
        </Button>
        <Button size="lg" variant="outline" render={<Link href="/shop" />}>
          Continue Shopping
        </Button>
        <Button size="lg" variant="ghost" render={<Link href="/account/orders" />}>
          View Orders
        </Button>
      </div>
    </div>
  );
}
