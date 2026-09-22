import Link from "next/link";
import NextImage from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getOrderById } from "@/lib/data/orders";
import { OrderStatusBadge } from "@/components/common/status-badge";
import { OrderTimeline } from "@/components/account/order-timeline";
import { OrderSummary } from "@/components/cart/order-summary";
import { Button } from "@/components/ui/button";
import { formatDate, formatPrice } from "@/lib/format";

export default async function AccountOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = getOrderById(id);
  if (!order) notFound();

  return (
    <div>
      <Link href="/account/orders" className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" /> Back to Orders
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-foreground">Order #{order.id}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Placed on {formatDate(order.createdAt)}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="mt-8 rounded-2xl border border-border p-5 sm:p-6">
        <OrderTimeline timeline={order.timeline} cancelled={order.status === "cancelled"} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div>
          <h2 className="font-heading text-lg font-semibold text-foreground">Items</h2>
          <div className="mt-4 divide-y divide-border rounded-2xl border border-border">
            {order.items.map((item, i) => (
              <div key={`${item.productId}-${i}`} className="flex items-center gap-3 p-4">
                <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {item.image && (
                    <NextImage src={item.image} alt={item.name} fill className="object-cover" sizes="64px" />
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

          {order.trackingNumber && (
            <div className="mt-4 flex items-center justify-between rounded-xl border border-border bg-muted/40 p-4">
              <div>
                <p className="text-xs text-muted-foreground">Tracking Number</p>
                <p className="text-sm font-medium text-foreground">{order.trackingNumber}</p>
              </div>
              <Button variant="outline" size="sm">
                Track Package
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-border p-5">
            <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Shipping Address
            </h2>
            <p className="mt-2 text-sm font-medium text-foreground">{order.shippingAddress.fullName}</p>
            <p className="text-sm text-muted-foreground">
              {order.shippingAddress.line1}
              {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""}
            </p>
            <p className="text-sm text-muted-foreground">
              {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
            </p>
          </div>
          <div className="rounded-2xl border border-border p-5">
            <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Payment</h2>
            <p className="mt-2 text-sm text-foreground">{order.paymentMethod}</p>
          </div>
          <div className="rounded-2xl border border-border p-5">
            <OrderSummary
              subtotal={order.subtotal}
              discount={order.discount}
              shipping={order.shipping}
              total={order.total}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
