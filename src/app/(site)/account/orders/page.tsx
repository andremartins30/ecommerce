"use client";

import Link from "next/link";
import { PackageSearch } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { getOrdersByCustomer } from "@/lib/data/orders";
import { OrderStatusBadge } from "@/components/common/status-badge";
import { EmptyState } from "@/components/common/empty-state";
import { formatDate, formatPrice } from "@/lib/format";

export default function AccountOrdersPage() {
  const user = useAuthStore((s) => s.user);
  const orders = user ? getOrdersByCustomer(user.id) : [];

  return (
    <div>
      <h1 className="font-heading text-2xl font-semibold text-foreground">Orders</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">Track, manage, and review your past orders.</p>

      {orders.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={PackageSearch}
            title="No orders yet"
            description="When you place an order, it'll show up here."
            actionLabel="Start Shopping"
            actionHref="/shop"
          />
        </div>
      ) : (
        <div className="mt-8 overflow-hidden rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs text-muted-foreground uppercase">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Order</th>
                <th className="px-4 py-3 text-left font-medium">Date</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Items</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
                <th className="px-4 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-4 py-3.5 font-medium text-foreground">#{order.id}</td>
                  <td className="px-4 py-3.5 text-muted-foreground">{formatDate(order.createdAt)}</td>
                  <td className="px-4 py-3.5">
                    <OrderStatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-3.5 text-muted-foreground">{order.items.length}</td>
                  <td className="px-4 py-3.5 text-right font-medium text-foreground">
                    {formatPrice(order.total)}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <Link
                      href={`/account/orders/${order.id}`}
                      className="text-sm font-medium text-accent hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
