import type {
  LegacyOrder as Order,
  LegacyOrderItem as OrderItem,
  LegacyOrderStatus as OrderStatus,
  LegacyOrderTimelineEvent as OrderTimelineEvent,
} from "@/lib/types";
import { customers } from "./customers";
import { products } from "./products";
import { daysAgo, pick, pickMany, randInt, seededRandom } from "./seed";
import { computeOrderTotals } from "@/lib/pricing";

const statuses: OrderStatus[] = [
  "processing",
  "processing",
  "shipped",
  "shipped",
  "delivered",
  "delivered",
  "delivered",
  "delivered",
  "cancelled",
  "refunded",
];

const paymentMethods = [
  "PIX",
  "Visa •••• 4242",
  "Mastercard •••• 8821",
  "Elo •••• 1005",
  "Boleto bancário",
];

function buildTimeline(status: OrderStatus, createdAt: string): OrderTimelineEvent[] {
  const base = new Date(createdAt);
  const step = (n: number) => {
    const d = new Date(base);
    d.setDate(d.getDate() + n);
    return d.toISOString();
  };
  const stages = ["Order Placed", "Confirmed", "Packed", "Shipped", "Delivered"];
  const doneCount =
    status === "processing"
      ? 2
      : status === "shipped"
        ? 4
        : status === "delivered"
          ? 5
          : status === "cancelled" || status === "refunded"
            ? 1
            : 0;

  return stages.map((label, i) => ({
    label,
    date: i < doneCount ? step(i) : "",
    done: i < doneCount,
  }));
}

function buildItems(rng: () => number): OrderItem[] {
  const count = randInt(rng, 1, 4);
  const picked = pickMany(rng, products, count);
  return picked.map((p) => ({
    productId: p.id,
    name: p.name,
    image: p.images[0]?.url ?? "",
    variant: p.variants[0]
      ? [p.variants[0].color, p.variants[0].size].filter(Boolean).join(" / ")
      : undefined,
    price: p.price,
    quantity: randInt(rng, 1, 2),
  }));
}

export const orders: Order[] = Array.from({ length: 25 }, (_, index) => {
  const rng = seededRandom(`order-${index}`);
  const customer = pick(rng, customers);
  const status = statuses[index % statuses.length];
  const createdAt = daysAgo(randInt(rng, 1, 200));
  const items = buildItems(rng);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  // Totals go through the shared pricing module rather than duplicating the
  // policy constants here, which is how the old code drifted out of sync.
  const appliedDiscount =
    rng() > 0.7 ? { code: "BEMVINDO15", kind: "percentage" as const, value: 10 } : null;
  const { discountAmount, shipping, total } = computeOrderTotals(subtotal, appliedDiscount);

  const address = customer.addresses[0];

  return {
    id: `LC-${10000 + index * 7 + 482}`,
    customerId: customer.id,
    customerName: customer.name,
    customerEmail: customer.email,
    status,
    items,
    subtotal,
    discount: discountAmount,
    shipping,
    total,
    paymentMethod: pick(rng, paymentMethods),
    shippingAddress: address,
    createdAt,
    updatedAt: createdAt,
    timeline: buildTimeline(status, createdAt),
    trackingNumber:
      status === "shipped" || status === "delivered"
        ? `1Z${randInt(rng, 100000000, 999999999)}US`
        : undefined,
  };
}).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

export function getOrderById(id: string) {
  return orders.find((o) => o.id === id);
}

export function getOrdersByCustomer(customerId: string) {
  return orders.filter((o) => o.customerId === customerId);
}
