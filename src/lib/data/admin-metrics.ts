import { orders } from "./orders";
import { customers } from "./customers";
import { products } from "./products";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function monthKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}`;
}

export function getRevenueSeries(months = 6) {
  const now = new Date("2026-08-18T09:00:00Z");
  const buckets: { key: string; label: string; revenue: number; orders: number }[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({ key: monthKey(d), label: MONTH_LABELS[d.getMonth()], revenue: 0, orders: 0 });
  }

  const bucketMap = new Map(buckets.map((b) => [b.key, b]));

  for (const order of orders) {
    if (order.status === "cancelled") continue;
    const d = new Date(order.createdAt);
    const key = monthKey(d);
    const bucket = bucketMap.get(key);
    if (bucket) {
      bucket.revenue += order.total;
      bucket.orders += 1;
    }
  }

  return buckets;
}

export function getCategorySales() {
  const map = new Map<string, number>();
  for (const order of orders) {
    if (order.status === "cancelled" || order.status === "refunded") continue;
    for (const item of order.items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) continue;
      map.set(product.categoryId, (map.get(product.categoryId) ?? 0) + item.price * item.quantity);
    }
  }
  return map;
}

export function getTopProducts(count = 5) {
  const map = new Map<string, { productId: string; unitsSold: number; revenue: number }>();
  for (const order of orders) {
    if (order.status === "cancelled") continue;
    for (const item of order.items) {
      const existing = map.get(item.productId) ?? { productId: item.productId, unitsSold: 0, revenue: 0 };
      existing.unitsSold += item.quantity;
      existing.revenue += item.price * item.quantity;
      map.set(item.productId, existing);
    }
  }
  return Array.from(map.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, count)
    .map((entry) => ({ ...entry, product: products.find((p) => p.id === entry.productId)! }))
    .filter((entry) => entry.product);
}

export function computeOverviewMetrics() {
  const validOrders = orders.filter((o) => o.status !== "cancelled");
  const totalRevenue = validOrders.reduce((sum, o) => sum + o.total, 0);
  const totalOrders = orders.length;
  const totalCustomers = customers.length;
  const totalProducts = products.length;
  const avgOrderValue = validOrders.length ? totalRevenue / validOrders.length : 0;
  const conversionRate = 3.4;

  return {
    totalRevenue,
    totalOrders,
    totalCustomers,
    totalProducts,
    avgOrderValue,
    conversionRate,
  };
}
