import { cn } from "@/lib/utils";
import type { LegacyOrderStatus as OrderStatus } from "@/lib/types";

const orderStatusStyles: Record<OrderStatus, string> = {
  processing: "bg-info/10 text-info",
  shipped: "bg-accent/10 text-accent",
  delivered: "bg-success/10 text-success",
  cancelled: "bg-muted text-muted-foreground",
  refunded: "bg-destructive/10 text-destructive",
};

const orderStatusLabels: Record<OrderStatus, string> = {
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export function OrderStatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap",
        orderStatusStyles[status],
        className
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {orderStatusLabels[status]}
    </span>
  );
}

type StockLevel = "in-stock" | "low-stock" | "out-of-stock";

const stockStyles: Record<StockLevel, string> = {
  "in-stock": "bg-success/10 text-success",
  "low-stock": "bg-warning/15 text-warning",
  "out-of-stock": "bg-destructive/10 text-destructive",
};

const stockLabels: Record<StockLevel, string> = {
  "in-stock": "In Stock",
  "low-stock": "Low Stock",
  "out-of-stock": "Out of Stock",
};

export function stockLevelFor(stock: number): StockLevel {
  if (stock <= 0) return "out-of-stock";
  if (stock <= 8) return "low-stock";
  return "in-stock";
}

export function StockBadge({ stock, className }: { stock: number; className?: string }) {
  const level = stockLevelFor(stock);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap",
        stockStyles[level],
        className
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {stockLabels[level]}
    </span>
  );
}

const genericStyles: Record<string, string> = {
  active: "bg-success/10 text-success",
  vip: "bg-accent/10 text-accent",
  inactive: "bg-muted text-muted-foreground",
  draft: "bg-muted text-muted-foreground",
  archived: "bg-muted text-muted-foreground",
  approved: "bg-success/10 text-success",
  pending: "bg-warning/15 text-warning",
  rejected: "bg-destructive/10 text-destructive",
  scheduled: "bg-info/10 text-info",
  expired: "bg-muted text-muted-foreground",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium capitalize whitespace-nowrap",
        genericStyles[status] ?? "bg-secondary text-secondary-foreground",
        className
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}
