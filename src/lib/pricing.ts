import {
  addCents,
  applyPercentage,
  cents,
  clampToZero,
  minCents,
  subtractCents,
  type Cents,
} from "@/server/domain/pricing/money";

/**
 * Order totals. Single source of truth: the cart page, the cart drawer, the
 * checkout and the order records all go through here. The code this replaces
 * duplicated the same magic numbers in three places, and the checkout screen
 * additionally hardcoded its own express shipping price.
 *
 * Everything is in integer cents.
 *
 * This module intentionally declares its own discount shape instead of
 * importing one from `@/store/cart-store`: a pricing rule must not depend on a
 * client-side store. Once totals are computed on the server (task 21) the store
 * will feed this, not the other way round.
 */

export type DiscountKind = "percentage" | "fixed" | "free_shipping";

export interface DiscountInput {
  code: string;
  kind: DiscountKind;
  /** Percent (0-100) for `percentage`, cents for `fixed`, ignored otherwise. */
  value: number;
  /** Minimum order subtotal in cents for the discount to apply. */
  minOrderCents?: number;
}

/**
 * Commercial policy. Temporary home: these move to SystemSetting so the
 * operator can change them without a deploy.
 */
export const FREE_SHIPPING_THRESHOLD_CENTS = cents(29900);
export const FLAT_SHIPPING_CENTS = cents(2490);
export const EXPRESS_SHIPPING_CENTS = cents(4990);

export interface OrderTotals {
  subtotal: Cents;
  discountAmount: Cents;
  shipping: Cents;
  total: Cents;
}

export function isDiscountApplicable(subtotalInCents: number, discount: DiscountInput | null) {
  if (!discount) return false;
  if (discount.minOrderCents === undefined) return true;
  return subtotalInCents >= discount.minOrderCents;
}

export function computeDiscountAmount(
  subtotalInCents: number,
  discount: DiscountInput | null
): Cents {
  const subtotal = cents(subtotalInCents);
  if (!discount || !isDiscountApplicable(subtotal, discount)) return cents(0);

  switch (discount.kind) {
    case "percentage":
      return applyPercentage(subtotal, discount.value);
    case "fixed":
      // A discount can never exceed what is owed.
      return minCents(cents(discount.value), subtotal);
    case "free_shipping":
      return cents(0);
  }
}

export function computeShipping(
  subtotalInCents: number,
  discount: DiscountInput | null,
  method: "standard" | "express" = "standard"
): Cents {
  const subtotal = cents(subtotalInCents);
  if (subtotal === 0) return cents(0);

  if (discount?.kind === "free_shipping" && isDiscountApplicable(subtotal, discount)) {
    return cents(0);
  }

  if (method === "express") return EXPRESS_SHIPPING_CENTS;

  return subtotal >= FREE_SHIPPING_THRESHOLD_CENTS ? cents(0) : FLAT_SHIPPING_CENTS;
}

/**
 * No tax line: Brazilian retail prices are quoted tax-inclusive. The previous
 * implementation added an 8.25% US sales tax on top of the displayed price,
 * which would be both wrong and illegal to show here.
 */
export function computeOrderTotals(
  subtotalInCents: number,
  discount: DiscountInput | null,
  method: "standard" | "express" = "standard"
): OrderTotals {
  const subtotal = cents(subtotalInCents);
  const discountAmount = computeDiscountAmount(subtotal, discount);
  const shipping = computeShipping(subtotal, discount, method);
  const payableGoods = clampToZero(subtractCents(subtotal, discountAmount));

  return {
    subtotal,
    discountAmount,
    shipping,
    total: addCents(payableGoods, shipping),
  };
}

/** Cents still missing to qualify for free shipping. Zero once qualified. */
export function amountUntilFreeShipping(subtotalInCents: number): Cents {
  const subtotal = cents(subtotalInCents);
  return clampToZero(subtractCents(FREE_SHIPPING_THRESHOLD_CENTS, subtotal));
}
