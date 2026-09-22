import type { LegacyDiscount as Discount } from "@/lib/types";
import { daysAgo } from "./seed";
import { fromReais } from "@/server/domain/pricing/money";

/**
 * `value` is a percentage for "percentage" discounts and **cents** for "fixed".
 * `minOrder` is always cents.
 */
export const discounts: Discount[] = [
  {
    id: "disc-001",
    code: "BEMVINDO15",
    type: "percentage",
    value: 15,
    minOrder: 0,
    usageLimit: 1000,
    usageCount: 412,
    startsAt: daysAgo(180),
    expiresAt: daysAgo(-180),
    status: "active",
  },
  {
    id: "disc-002",
    code: "FRETEGRATIS",
    type: "free_shipping",
    value: 0,
    minOrder: fromReais(199),
    usageLimit: 5000,
    usageCount: 1830,
    startsAt: daysAgo(240),
    expiresAt: daysAgo(-90),
    status: "active",
  },
  {
    id: "disc-003",
    code: "NICHO50",
    type: "fixed",
    value: fromReais(50),
    minOrder: fromReais(399),
    usageLimit: 500,
    usageCount: 388,
    startsAt: daysAgo(60),
    expiresAt: daysAgo(-10),
    status: "active",
  },
  {
    id: "disc-004",
    code: "VIP20",
    type: "percentage",
    value: 20,
    minOrder: fromReais(599),
    usageLimit: 200,
    usageCount: 61,
    startsAt: daysAgo(30),
    expiresAt: daysAgo(-60),
    status: "active",
  },
  {
    id: "disc-005",
    code: "NATAL10",
    type: "percentage",
    value: 10,
    minOrder: 0,
    usageLimit: 2000,
    usageCount: 2000,
    startsAt: daysAgo(400),
    expiresAt: daysAgo(340),
    status: "expired",
  },
  {
    id: "disc-006",
    code: "LANCAMENTO30",
    type: "fixed",
    value: fromReais(30),
    minOrder: fromReais(249),
    usageLimit: 300,
    usageCount: 0,
    startsAt: daysAgo(-10),
    expiresAt: daysAgo(-40),
    status: "scheduled",
  },
];

export function getDiscountByCode(code: string) {
  return discounts.find(
    (d) => d.code.toLowerCase() === code.toLowerCase() && d.status === "active"
  );
}
