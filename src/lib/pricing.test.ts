import { describe, expect, it } from "vitest";
import {
  amountUntilFreeShipping,
  computeDiscountAmount,
  computeOrderTotals,
  computeShipping,
  EXPRESS_SHIPPING_CENTS,
  FLAT_SHIPPING_CENTS,
  FREE_SHIPPING_THRESHOLD_CENTS,
  type DiscountInput,
} from "./pricing";
import { formatBRL } from "@/server/domain/pricing/money";

const percentage: DiscountInput = { code: "BEMVINDO15", kind: "percentage", value: 15 };
const fixed: DiscountInput = { code: "MENOS50", kind: "fixed", value: 5000 };
const freeShipping: DiscountInput = { code: "FRETEGRATIS", kind: "free_shipping", value: 0 };

describe("computeDiscountAmount", () => {
  it("rounds a percentage discount to the cent", () => {
    // 24990 * 15% = 3748.5 -> 3749. The replaced code rounded to whole units.
    expect(computeDiscountAmount(24990, percentage)).toBe(3749);
  });

  it("caps a fixed discount at the subtotal", () => {
    expect(computeDiscountAmount(3000, fixed)).toBe(3000);
    expect(computeDiscountAmount(30000, fixed)).toBe(5000);
  });

  it("gives no goods discount for free shipping coupons", () => {
    expect(computeDiscountAmount(24990, freeShipping)).toBe(0);
  });

  it("ignores a discount below its minimum order", () => {
    const withMinimum: DiscountInput = { ...percentage, minOrderCents: 30000 };
    expect(computeDiscountAmount(24990, withMinimum)).toBe(0);
    expect(computeDiscountAmount(30000, withMinimum)).toBe(4500);
  });

  it("returns zero without a discount", () => {
    expect(computeDiscountAmount(24990, null)).toBe(0);
  });
});

describe("computeShipping", () => {
  it("charges flat shipping below the free threshold", () => {
    expect(computeShipping(24990, null)).toBe(FLAT_SHIPPING_CENTS);
  });

  it("is free at or above the threshold", () => {
    expect(computeShipping(FREE_SHIPPING_THRESHOLD_CENTS, null)).toBe(0);
    expect(computeShipping(50000, null)).toBe(0);
  });

  it("charges nothing for an empty cart", () => {
    expect(computeShipping(0, null)).toBe(0);
  });

  it("charges the express price when express is chosen", () => {
    expect(computeShipping(24990, null, "express")).toBe(EXPRESS_SHIPPING_CENTS);
  });

  it("honours a free shipping coupon, including on express", () => {
    expect(computeShipping(10000, freeShipping)).toBe(0);
    expect(computeShipping(10000, freeShipping, "express")).toBe(0);
  });

  it("ignores a free shipping coupon below its minimum order", () => {
    const withMinimum: DiscountInput = { ...freeShipping, minOrderCents: 20000 };
    expect(computeShipping(10000, withMinimum)).toBe(FLAT_SHIPPING_CENTS);
  });
});

describe("computeOrderTotals", () => {
  it("composes subtotal, discount and shipping without a tax line", () => {
    const totals = computeOrderTotals(24990, null);

    expect(totals).toEqual({
      subtotal: 24990,
      discountAmount: 0,
      shipping: FLAT_SHIPPING_CENTS,
      total: 27480,
    });
    expect(formatBRL(totals.total)).toBe("R$ 274,80");
  });

  it("applies a percentage discount before shipping", () => {
    const totals = computeOrderTotals(24990, percentage);

    expect(totals.discountAmount).toBe(3749);
    expect(totals.shipping).toBe(FLAT_SHIPPING_CENTS);
    expect(totals.total).toBe(24990 - 3749 + FLAT_SHIPPING_CENTS);
  });

  it("never lets a discount drive the total below the shipping cost", () => {
    const totals = computeOrderTotals(3000, { code: "X", kind: "fixed", value: 999_00 });

    expect(totals.discountAmount).toBe(3000);
    expect(totals.total).toBe(FLAT_SHIPPING_CENTS);
  });

  it("keeps an empty cart at zero", () => {
    expect(computeOrderTotals(0, null)).toEqual({
      subtotal: 0,
      discountAmount: 0,
      shipping: 0,
      total: 0,
    });
  });

  it("refuses a subtotal that is not an integer number of cents", () => {
    // Guards against a reais value leaking into the totals.
    expect(() => computeOrderTotals(249.9, null)).toThrow();
  });
});

describe("amountUntilFreeShipping", () => {
  it("reports the remaining amount", () => {
    expect(amountUntilFreeShipping(24990)).toBe(FREE_SHIPPING_THRESHOLD_CENTS - 24990);
  });

  it("reports zero once qualified", () => {
    expect(amountUntilFreeShipping(FREE_SHIPPING_THRESHOLD_CENTS)).toBe(0);
    expect(amountUntilFreeShipping(99999)).toBe(0);
  });
});
