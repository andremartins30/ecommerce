"use client";

import { use, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Printer } from "lucide-react";
import { toast } from "sonner";
import { useAdminOrdersStore } from "@/store/admin-orders-store";
import { useHydrated } from "@/hooks/use-hydrated";
import { OrderStatusBadge } from "@/components/common/status-badge";
import { OrderTimeline } from "@/components/account/order-timeline";
import { OrderSummary } from "@/components/cart/order-summary";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatDate, formatPrice } from "@/lib/format";
import { PackageX } from "lucide-react";
import type { LegacyOrderStatus as OrderStatus } from "@/lib/types";

export default function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const hydrated = useHydrated();
  const order = useAdminOrdersStore((s) => s.getById(id));
  const updateStatus = useAdminOrdersStore((s) => s.updateStatus);
  const [confirmAction, setConfirmAction] = useState<"cancel" | "refund" | null>(null);

  if (!hydrated) return null;

  if (!order) {
    return (
      <EmptyState
        icon={PackageX}
        title="Order not found"
        actionLabel="Back to Orders"
        actionHref="/admin/orders"
      />
    );
  }

  function handleConfirm() {
    if (!order) return;
    if (confirmAction === "cancel") {
      updateStatus(order.id, "cancelled");
      toast.success("Order cancelled");
    } else if (confirmAction === "refund") {
      updateStatus(order.id, "refunded");
      toast.success("Order refunded");
    }
    setConfirmAction(null);
  }

  return (
    <div className="space-y-6 print:space-y-4">
      <Link href="/admin/orders" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground print:hidden">
        <ArrowLeft className="size-3.5" /> Back to Orders
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-foreground sm:text-3xl">Order #{order.id}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Placed on {formatDate(order.createdAt)} by {order.customerName}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <Select value={order.status} onValueChange={(v) => { updateStatus(order.id, v as OrderStatus); toast.success("Order status updated"); }}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.print()}>
            <Printer className="size-3.5" /> Print Invoice
          </Button>
          {order.status !== "cancelled" && order.status !== "refunded" && (
            <Button variant="outline" size="sm" onClick={() => setConfirmAction("cancel")}>
              Cancel Order
            </Button>
          )}
          {order.status === "delivered" && (
            <Button variant="destructive" size="sm" onClick={() => setConfirmAction("refund")}>
              Refund
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 print:hidden">
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="rounded-2xl border border-border p-5 sm:p-6 print:border-0 print:p-0">
        <OrderTimeline timeline={order.timeline} cancelled={order.status === "cancelled"} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div>
          <h2 className="font-heading text-lg font-semibold text-foreground">Items</h2>
          <div className="mt-4 divide-y divide-border rounded-2xl border border-border">
            {order.items.map((item, i) => (
              <div key={`${item.productId}-${i}`} className="flex items-center gap-3 p-4">
                <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted print:hidden">
                  {item.image && <Image src={item.image} alt={item.name} fill className="object-cover" sizes="64px" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-medium text-foreground">{item.name}</p>
                  {item.variant && <p className="text-xs text-muted-foreground">{item.variant}</p>}
                  <p className="text-xs text-muted-foreground">Qty {item.quantity}</p>
                </div>
                <span className="text-sm font-medium text-foreground">{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-border p-5">
            <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Customer</h2>
            <p className="mt-2 text-sm font-medium text-foreground">{order.customerName}</p>
            <p className="text-sm text-muted-foreground">{order.customerEmail}</p>
          </div>
          <div className="rounded-2xl border border-border p-5">
            <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Shipping Address</h2>
            <p className="mt-2 text-sm text-foreground">{order.shippingAddress.fullName}</p>
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

      <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmAction === "cancel" ? "Cancel this order?" : "Issue a refund?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === "cancel"
                ? "This will cancel the order and notify the customer. This cannot be undone."
                : `This will refund ${formatPrice(order.total)} to the customer's original payment method.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Back</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {confirmAction === "cancel" ? "Cancel Order" : "Confirm Refund"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
