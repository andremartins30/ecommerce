import Image from "next/image";
import { MetricCard } from "@/components/common/metric-card";
import { RevenueChart } from "@/components/admin/charts/revenue-chart";
import { OrdersChart } from "@/components/admin/charts/orders-chart";
import { CategoryDonut } from "@/components/admin/charts/category-donut";
import {
  computeOverviewMetrics,
  getCategorySales,
  getRevenueSeries,
  getTopProducts,
} from "@/lib/data/admin-metrics";
import { customers } from "@/lib/data/customers";
import { getCategoryById } from "@/lib/data/categories";
import { formatPrice } from "@/lib/format";
import { DollarSign, Repeat, ShoppingCart, UserPlus } from "lucide-react";

export default function AdminAnalyticsPage() {
  const metrics = computeOverviewMetrics();
  const revenueSeries = getRevenueSeries(12);
  const categorySales = getCategorySales();
  const topProducts = getTopProducts(8);
  const totalCategoryRevenue = Array.from(categorySales.values()).reduce((a, b) => a + b, 0);

  const categoryData = Array.from(categorySales.entries())
    .map(([categoryId, value]) => ({ name: getCategoryById(categoryId)?.name ?? categoryId, value }))
    .sort((a, b) => b.value - a.value);

  const vipCustomers = customers.filter((c) => c.status === "vip").length;
  const repeatRate = Math.round(
    (customers.filter((c) => c.ordersCount > 1).length / customers.length) * 100
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-foreground sm:text-3xl">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">Deeper insight into revenue, products, and customers.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Revenue (12mo)" value={revenueSeries.reduce((s, m) => s + m.revenue, 0)} prefix="$" icon={DollarSign} />
        <MetricCard label="Avg. Order Value" value={metrics.avgOrderValue} prefix="$" decimals={0} icon={ShoppingCart} />
        <MetricCard label="VIP Customers" value={vipCustomers} icon={UserPlus} />
        <MetricCard label="Repeat Purchase Rate" value={repeatRate} suffix="%" icon={Repeat} />
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-4 font-heading text-base font-semibold text-foreground">Revenue Trend</h2>
        <RevenueChart data={revenueSeries} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-4 font-heading text-base font-semibold text-foreground">Orders</h2>
          <OrdersChart data={revenueSeries} />
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-4 font-heading text-base font-semibold text-foreground">Sales by Category</h2>
          <CategoryDonut data={categoryData} />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card">
        <div className="p-5">
          <h2 className="font-heading text-base font-semibold text-foreground">Top Products</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-y border-border bg-muted/40 text-xs text-muted-foreground uppercase">
              <tr>
                <th className="px-5 py-3 text-left font-medium">Product</th>
                <th className="px-5 py-3 text-left font-medium">Category</th>
                <th className="px-5 py-3 text-right font-medium">Units Sold</th>
                <th className="px-5 py-3 text-right font-medium">Revenue</th>
                <th className="px-5 py-3 text-right font-medium">Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {topProducts.map(({ product, unitsSold, revenue }) => (
                <tr key={product.id} className="hover:bg-muted/30">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="relative size-9 shrink-0 overflow-hidden rounded-md bg-muted">
                        <Image src={product.images[0]?.url} alt={product.name} fill className="object-cover" sizes="36px" />
                      </div>
                      <span className="line-clamp-1 font-medium text-foreground">{product.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">
                    {getCategoryById(product.categoryId)?.name}
                  </td>
                  <td className="px-5 py-3.5 text-right text-foreground">{unitsSold}</td>
                  <td className="px-5 py-3.5 text-right font-medium text-foreground">{formatPrice(revenue)}</td>
                  <td className="px-5 py-3.5 text-right text-muted-foreground">
                    {totalCategoryRevenue ? Math.round((revenue / totalCategoryRevenue) * 100) : 0}%
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
