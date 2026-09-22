"use client";

import Link from "next/link";
import { Heart, Package, PackageCheck, ShoppingBag } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { useWishlistStore } from "@/store/wishlist-store";
import { getOrdersByCustomer } from "@/lib/data/orders";
import { MetricCard } from "@/components/common/metric-card";
import { OrderStatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatPrice } from "@/lib/format";

export function AccountOverviewClient({
  recommended,
}: {
  /** Server-fetched real catalogue data, rendered as a child slot. */
  recommended: React.ReactNode;
}) {
  const user = useAuthStore((s) => s.user);
  const wishlistCount = useWishlistStore((s) => s.productIds.length);
  const orders = user ? getOrdersByCustomer(user.id) : [];
  const pending = orders.filter((o) => o.status === "processing" || o.status === "shipped");
  const delivered = orders.filter((o) => o.status === "delivered");

  return (
    <div className="space-y-10">
      <div className="rounded-2xl border border-border bg-secondary/40 p-6 sm:p-8">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Bem-vindo de volta
        </p>
        <h1 className="mt-1.5 font-heading text-2xl font-semibold text-foreground sm:text-3xl">
          {user?.name ?? "visitante"}
        </h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Acompanhe seus pedidos, lista de desejos e recomendações.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetricCard label="Pedidos" value={orders.length} icon={ShoppingBag} />
        <MetricCard label="Em andamento" value={pending.length} icon={Package} />
        <MetricCard label="Entregues" value={delivered.length} icon={PackageCheck} />
        <MetricCard label="Lista de desejos" value={wishlistCount} icon={Heart} />
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold text-foreground">Pedidos recentes</h2>
          <Link href="/account/orders" className="text-sm font-medium text-foreground underline underline-offset-4">
            Ver todos
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center">
            <p className="text-sm text-muted-foreground">Você ainda não fez nenhum pedido.</p>
            <Button className="mt-4" render={<Link href="/shop" />}>
              Começar a comprar
            </Button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-border">
                {orders.slice(0, 5).map((order) => (
                  <tr key={order.id}>
                    <td className="px-4 py-3.5">
                      <Link href={`/account/orders/${order.id}`} className="font-medium text-foreground hover:underline">
                        #{order.id}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground">{formatDate(order.createdAt)}</td>
                    <td className="px-4 py-3.5">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3.5 text-right font-medium text-foreground">
                      {formatPrice(order.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {recommended}
    </div>
  );
}
