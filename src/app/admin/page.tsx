import Link from "next/link";
import Image from "next/image";
import { DollarSign, Package, PercentCircle, ShoppingCart, TrendingUp, Users } from "lucide-react";
import { MetricCard } from "@/components/common/metric-card";
import { RevenueChart } from "@/components/admin/charts/revenue-chart";
import { OrdersChart } from "@/components/admin/charts/orders-chart";
import { CategoryDonut } from "@/components/admin/charts/category-donut";
import { OrderStatusBadge } from "@/components/common/status-badge";
import {
  computeOverviewMetrics,
  getCategorySales,
  getRevenueSeries,
  getTopProducts,
} from "@/lib/data/admin-metrics";
import { orders } from "@/lib/data/orders";
import { getCategoryById, getCategoryName } from "@/lib/data/categories";
import { formatDate, formatPrice } from "@/lib/format";

export default function AdminOverviewPage() {
  const metrics = computeOverviewMetrics();
  const revenueSeries = getRevenueSeries(6);
  const categorySales = getCategorySales();
  const topProducts = getTopProducts(5);
  const recentOrders = orders.slice(0, 6);

  const categoryData = Array.from(categorySales.entries())
    .map(([categoryId, value]) => ({ name: getCategoryName(categoryId), value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-foreground sm:text-3xl">Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your store&apos;s performance at a glance.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard label="Total Revenue" value={metrics.totalRevenue} prefix="$" icon={DollarSign} trend={{ value: 12.4, positive: true }} />
        <MetricCard label="Orders" value={metrics.totalOrders} icon={ShoppingCart} trend={{ value: 8.1, positive: true }} />
        <MetricCard label="Customers" value={metrics.totalCustomers} icon={Users} trend={{ value: 3.2, positive: true }} />
        <MetricCard label="Products" value={metrics.totalProducts} icon={Package} />
        <MetricCard label="Conversion Rate" value={metrics.conversionRate} suffix="%" decimals={1} icon={PercentCircle} trend={{ value: 0.6, positive: false }} />
        <MetricCard label="Avg. Order Value" value={metrics.avgOrderValue} prefix="$" decimals={0} icon={TrendingUp} trend={{ value: 4.7, positive: true }} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-base font-semibold text-foreground">Revenue</h2>
            <span className="text-xs text-muted-foreground">Last 6 months</span>
          </div>
          <RevenueChart data={revenueSeries} />
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-4 font-heading text-base font-semibold text-foreground">Sales by Category</h2>
          <CategoryDonut data={categoryData} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-base font-semibold text-foreground">Orders</h2>
            <span className="text-xs text-muted-foreground">Last 6 months</span>
          </div>
          <OrdersChart data={revenueSeries} />
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-4 font-heading text-base font-semibold text-foreground">Top Products</h2>
          <ul className="space-y-4">
            {topProducts.map(({ product, unitsSold, revenue }) => (
              <li key={product.id} className="flex items-center gap-3">
                <div className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-muted">
                  <Image src={product.images[0]?.url} alt={product.name} fill className="object-cover" sizes="44px" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-medium text-foreground">{product.name}</p>
                  <p className="text-xs text-muted-foreground">{unitsSold} sold</p>
                </div>
                <span className="text-sm font-medium text-foreground">{formatPrice(revenue)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between p-5">
          <h2 className="font-heading text-base font-semibold text-foreground">Recent Orders</h2>
          <Link href="/admin/orders" className="text-sm font-medium text-accent hover:underline">
            View all
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-y border-border bg-muted/40 text-xs text-muted-foreground uppercase">
              <tr>
                <th className="px-5 py-3 text-left font-medium">Order</th>
                <th className="px-5 py-3 text-left font-medium">Customer</th>
                <th className="px-5 py-3 text-left font-medium">Date</th>
                <th className="px-5 py-3 text-left font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-muted/30">
                  <td className="px-5 py-3.5">
                    <Link href={`/admin/orders/${order.id}`} className="font-medium text-foreground hover:underline">
                      #{order.id}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-foreground">{order.customerName}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">{formatDate(order.createdAt)}</td>
                  <td className="px-5 py-3.5">
                    <OrderStatusBadge status={order.status} />
                  </td>
                  <td className="px-5 py-3.5 text-right font-medium text-foreground">
                    {formatPrice(order.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
