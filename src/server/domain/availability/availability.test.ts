import { describe, expect, it } from "vitest";
import {
  AvailabilityInputError,
  DEFAULT_PRODUCTION_LEAD_TIME_DAYS,
  isPurchasable,
  resolveAvailability,
  resolveAvailabilityDisplay,
  resolveProductionLeadTime,
  type AvailabilityType,
  type VariantAvailabilityInput,
} from "./availability";

function variant(
  availabilityType: AvailabilityType,
  overrides: Partial<VariantAvailabilityInput> = {}
): VariantAvailabilityInput {
  return { availabilityType, allowBackorder: false, productionLeadTimeDays: null, ...overrides };
}

/**
 * The mandatory business cases from the specification. These are the tests that
 * must never be allowed to go red.
 */
describe("mandatory business cases", () => {
  it("CASE 1: ready stock of 5, buying 2, leaves 3", () => {
    const result = resolveAvailability({
      variant: variant("READY_STOCK"),
      requestedQty: 2,
      availableStock: 5,
    });

    expect(result.sellable).toBe(true);
    expect(result.qtyFromStock).toBe(2);
    expect(result.qtyBackordered).toBe(0);
    expect(result.requiresProduction).toBe(false);
    // What is left afterwards, from the caller's point of view.
    expect(5 - result.qtyFromStock).toBe(3);
  });

  it("CASE 2: made to order with zero stock is sellable and goes to production", () => {
    const result = resolveAvailability({
      variant: variant("MADE_TO_ORDER", { productionLeadTimeDays: 15 }),
      requestedQty: 1,
      availableStock: 0,
    });

    expect(result.sellable).toBe(true);
    expect(result.qtyFromStock).toBe(0);
    expect(result.qtyBackordered).toBe(1);
    expect(result.requiresProduction).toBe(true);
    // Production can absorb any quantity, so there is no ceiling.
    expect(result.maxSellableQty).toBeNull();
  });

  it("CASE 3: an out-of-stock variant is blocked", () => {
    const result = resolveAvailability({
      variant: variant("OUT_OF_STOCK"),
      requestedQty: 1,
      availableStock: 0,
    });

    expect(result.sellable).toBe(false);
    expect(result.reason).toBe("OUT_OF_STOCK");
    expect(result.maxSellableQty).toBe(0);
  });

  it("CASE 4: stock of 2 with backorder, buying 3, splits 2 from stock and 1 to production", () => {
    const result = resolveAvailability({
      variant: variant("READY_STOCK", { allowBackorder: true }),
      requestedQty: 3,
      availableStock: 2,
    });

    expect(result.sellable).toBe(true);
    expect(result.qtyFromStock).toBe(2);
    expect(result.qtyBackordered).toBe(1);
    expect(result.requiresProduction).toBe(true);
    expect(result.qtyFromStock + result.qtyBackordered).toBe(3);
  });
});

describe("resolveAvailability — ready stock", () => {
  it("sells exactly the available quantity", () => {
    const result = resolveAvailability({
      variant: variant("READY_STOCK"),
      requestedQty: 5,
      availableStock: 5,
    });

    expect(result.sellable).toBe(true);
    expect(result.qtyFromStock).toBe(5);
    expect(result.maxSellableQty).toBe(5);
  });

  it("blocks a quantity above stock when backorder is off", () => {
    const result = resolveAvailability({
      variant: variant("READY_STOCK"),
      requestedQty: 6,
      availableStock: 5,
    });

    expect(result.sellable).toBe(false);
    expect(result.reason).toBe("NO_STOCK_AND_NO_BACKORDER");
    // Tells the caller what *would* work, so the UI can offer it.
    expect(result.maxSellableQty).toBe(5);
  });

  it("blocks ready stock at zero without backorder", () => {
    // The mirror image of case 2: same zero stock, opposite outcome, because
    // the availability type is different.
    const result = resolveAvailability({
      variant: variant("READY_STOCK"),
      requestedQty: 1,
      availableStock: 0,
    });

    expect(result.sellable).toBe(false);
    expect(result.reason).toBe("NO_STOCK_AND_NO_BACKORDER");
    expect(result.maxSellableQty).toBe(0);
  });

  it("sells entirely from production when stock is zero and backorder is on", () => {
    const result = resolveAvailability({
      variant: variant("READY_STOCK", { allowBackorder: true }),
      requestedQty: 2,
      availableStock: 0,
    });

    expect(result.sellable).toBe(true);
    expect(result.qtyFromStock).toBe(0);
    expect(result.qtyBackordered).toBe(2);
  });

  it("does not use production when stock covers the request, even with backorder on", () => {
    const result = resolveAvailability({
      variant: variant("READY_STOCK", { allowBackorder: true }),
      requestedQty: 2,
      availableStock: 10,
    });

    expect(result.qtyFromStock).toBe(2);
    expect(result.qtyBackordered).toBe(0);
    expect(result.requiresProduction).toBe(false);
  });
});

describe("resolveAvailability — made to order", () => {
  it("ships existing stock first and produces the remainder", () => {
    const result = resolveAvailability({
      variant: variant("MADE_TO_ORDER"),
      requestedQty: 4,
      availableStock: 1,
    });

    expect(result.qtyFromStock).toBe(1);
    expect(result.qtyBackordered).toBe(3);
    expect(result.requiresProduction).toBe(true);
  });

  it("needs no production when stock happens to cover the order", () => {
    const result = resolveAvailability({
      variant: variant("MADE_TO_ORDER"),
      requestedQty: 2,
      availableStock: 5,
    });

    expect(result.qtyFromStock).toBe(2);
    expect(result.qtyBackordered).toBe(0);
    expect(result.requiresProduction).toBe(false);
  });

  it("accepts a large quantity, since production is unbounded", () => {
    const result = resolveAvailability({
      variant: variant("MADE_TO_ORDER"),
      requestedQty: 250,
      availableStock: 0,
    });

    expect(result.sellable).toBe(true);
    expect(result.qtyBackordered).toBe(250);
  });
});

describe("resolveAvailability — blocked states", () => {
  it("blocks a discontinued variant even with stock on the shelf", () => {
    const result = resolveAvailability({
      variant: variant("DISCONTINUED"),
      requestedQty: 1,
      availableStock: 12,
    });

    expect(result.sellable).toBe(false);
    expect(result.reason).toBe("DISCONTINUED");
  });

  it("blocks an out-of-stock variant even with stock on the shelf", () => {
    // OUT_OF_STOCK is an operator decision, not a derived state, so it wins.
    const result = resolveAvailability({
      variant: variant("OUT_OF_STOCK"),
      requestedQty: 1,
      availableStock: 12,
    });

    expect(result.sellable).toBe(false);
    expect(result.reason).toBe("OUT_OF_STOCK");
  });

  it("blocks a discontinued variant that also allows backorder", () => {
    const result = resolveAvailability({
      variant: variant("DISCONTINUED", { allowBackorder: true }),
      requestedQty: 1,
      availableStock: 0,
    });

    expect(result.sellable).toBe(false);
    expect(result.reason).toBe("DISCONTINUED");
  });

  it("rejects a non-positive or fractional quantity", () => {
    for (const requestedQty of [0, -1, 1.5, Number.NaN]) {
      const result = resolveAvailability({
        variant: variant("READY_STOCK"),
        requestedQty,
        availableStock: 10,
      });
      expect(result.sellable).toBe(false);
      expect(result.reason).toBe("INVALID_QUANTITY");
    }
  });

  it("throws on impossible stock, which would be a programming error", () => {
    expect(() =>
      resolveAvailability({
        variant: variant("READY_STOCK"),
        requestedQty: 1,
        availableStock: -1,
      })
    ).toThrow(AvailabilityInputError);

    expect(() =>
      resolveAvailability({
        variant: variant("READY_STOCK"),
        requestedQty: 1,
        availableStock: 1.5,
      })
    ).toThrow(AvailabilityInputError);
  });

  it("never returns a negative split", () => {
    for (const availabilityType of [
      "READY_STOCK",
      "MADE_TO_ORDER",
      "OUT_OF_STOCK",
      "DISCONTINUED",
    ] as const) {
      for (const availableStock of [0, 1, 5]) {
        for (const requestedQty of [1, 3, 10]) {
          for (const allowBackorder of [false, true]) {
            const result = resolveAvailability({
              variant: variant(availabilityType, { allowBackorder }),
              requestedQty,
              availableStock,
            });

            expect(result.qtyFromStock).toBeGreaterThanOrEqual(0);
            expect(result.qtyBackordered).toBeGreaterThanOrEqual(0);
            expect(result.qtyFromStock).toBeLessThanOrEqual(availableStock);
            if (result.sellable) {
              // The invariant the database also enforces on order items.
              expect(result.qtyFromStock + result.qtyBackordered).toBe(requestedQty);
            } else {
              expect(result.qtyFromStock).toBe(0);
              expect(result.qtyBackordered).toBe(0);
            }
          }
        }
      }
    }
  });
});

describe("resolveProductionLeadTime", () => {
  it("prefers the variant", () => {
    expect(
      resolveProductionLeadTime(
        { productionLeadTimeDays: 7 },
        { productionLeadTimeDays: 20 },
        { defaultProductionLeadTimeDays: 30 }
      )
    ).toBe(7);
  });

  it("falls back to the product", () => {
    expect(
      resolveProductionLeadTime(
        { productionLeadTimeDays: null },
        { productionLeadTimeDays: 20 },
        { defaultProductionLeadTimeDays: 30 }
      )
    ).toBe(20);
  });

  it("falls back to the store setting", () => {
    expect(
      resolveProductionLeadTime(
        { productionLeadTimeDays: null },
        { productionLeadTimeDays: null },
        { defaultProductionLeadTimeDays: 30 }
      )
    ).toBe(30);
  });

  it("falls back to 15 days", () => {
    expect(resolveProductionLeadTime({ productionLeadTimeDays: null }, {}, {})).toBe(15);
    expect(DEFAULT_PRODUCTION_LEAD_TIME_DAYS).toBe(15);
  });

  it("treats undefined the same as null", () => {
    expect(
      resolveProductionLeadTime(
        { productionLeadTimeDays: undefined },
        { productionLeadTimeDays: undefined },
        {}
      )
    ).toBe(15);
  });

  it("honours zero rather than treating it as unset", () => {
    // Zero means same-day preparation. A falsiness check here would silently
    // promise 15 days for a product that ships today.
    expect(
      resolveProductionLeadTime(
        { productionLeadTimeDays: 0 },
        { productionLeadTimeDays: 20 },
        { defaultProductionLeadTimeDays: 30 }
      )
    ).toBe(0);

    expect(
      resolveProductionLeadTime(
        { productionLeadTimeDays: null },
        { productionLeadTimeDays: 0 },
        { defaultProductionLeadTimeDays: 30 }
      )
    ).toBe(0);

    expect(
      resolveProductionLeadTime(
        { productionLeadTimeDays: null },
        { productionLeadTimeDays: null },
        { defaultProductionLeadTimeDays: 0 }
      )
    ).toBe(0);
  });

  it("rejects a negative, fractional or absurd lead time", () => {
    expect(() => resolveProductionLeadTime({ productionLeadTimeDays: -1 })).toThrow(
      AvailabilityInputError
    );
    expect(() => resolveProductionLeadTime({ productionLeadTimeDays: 1.5 })).toThrow(
      AvailabilityInputError
    );
    expect(() => resolveProductionLeadTime({ productionLeadTimeDays: 400 })).toThrow(
      /between 0 and 365/
    );
  });

  it("names the level that is misconfigured", () => {
    expect(() =>
      resolveProductionLeadTime({ productionLeadTimeDays: null }, { productionLeadTimeDays: 999 })
    ).toThrow(/^Product production lead time/);
  });
});

describe("resolveAvailabilityDisplay", () => {
  it("shows ready stock with the remaining units", () => {
    const display = resolveAvailabilityDisplay({
      variant: variant("READY_STOCK"),
      availableStock: 7,
    });

    expect(display).toEqual({ kind: "READY_STOCK", availableStock: 7, lowStock: false });
  });

  it("flags low stock at or below the threshold", () => {
    expect(
      resolveAvailabilityDisplay({ variant: variant("READY_STOCK"), availableStock: 3 })
    ).toMatchObject({ lowStock: true });

    expect(
      resolveAvailabilityDisplay({
        variant: variant("READY_STOCK"),
        availableStock: 5,
        settings: { lowStockThreshold: 5 },
      })
    ).toMatchObject({ lowStock: true });

    expect(
      resolveAvailabilityDisplay({
        variant: variant("READY_STOCK"),
        availableStock: 6,
        settings: { lowStockThreshold: 5 },
      })
    ).toMatchObject({ lowStock: false });
  });

  it("shows made to order with the resolved lead time", () => {
    const display = resolveAvailabilityDisplay({
      variant: variant("MADE_TO_ORDER"),
      availableStock: 0,
    });

    expect(display).toEqual({ kind: "MADE_TO_ORDER", productionLeadTimeDays: 15 });
  });

  it("keeps the made-to-order promise even when a few units are on the shelf", () => {
    // Honesty over optimism: the operator classified this as made to order, so
    // that is the promise the store can always keep.
    const display = resolveAvailabilityDisplay({
      variant: variant("MADE_TO_ORDER", { productionLeadTimeDays: 10 }),
      availableStock: 2,
    });

    expect(display).toEqual({ kind: "MADE_TO_ORDER", productionLeadTimeDays: 10 });
  });

  it("shows a hybrid variant as partial, carrying both figures", () => {
    const display = resolveAvailabilityDisplay({
      variant: variant("READY_STOCK", { allowBackorder: true, productionLeadTimeDays: 15 }),
      availableStock: 3,
    });

    expect(display).toEqual({
      kind: "PARTIAL",
      availableStock: 3,
      lowStock: true,
      productionLeadTimeDays: 15,
    });
  });

  it("degrades a sold-out hybrid variant to made to order", () => {
    const display = resolveAvailabilityDisplay({
      variant: variant("READY_STOCK", { allowBackorder: true }),
      availableStock: 0,
      product: { productionLeadTimeDays: 20 },
    });

    expect(display).toEqual({ kind: "MADE_TO_ORDER", productionLeadTimeDays: 20 });
  });

  it("shows a sold-out ready-stock variant as unavailable", () => {
    expect(
      resolveAvailabilityDisplay({ variant: variant("READY_STOCK"), availableStock: 0 })
    ).toEqual({ kind: "OUT_OF_STOCK" });
  });

  it("shows discontinued and out of stock as their own states", () => {
    expect(
      resolveAvailabilityDisplay({ variant: variant("DISCONTINUED"), availableStock: 5 })
    ).toEqual({ kind: "DISCONTINUED" });

    expect(
      resolveAvailabilityDisplay({ variant: variant("OUT_OF_STOCK"), availableStock: 5 })
    ).toEqual({ kind: "OUT_OF_STOCK" });
  });

  it("returns data, not sentences, so wording stays in the component layer", () => {
    const display = resolveAvailabilityDisplay({
      variant: variant("MADE_TO_ORDER"),
      availableStock: 0,
    });

    expect(JSON.stringify(display)).not.toMatch(/entrega|encomenda|dias/i);
  });
});

describe("isPurchasable", () => {
  it("agrees with resolveAvailability for a single unit", () => {
    expect(
      isPurchasable({ variant: variant("READY_STOCK"), availableStock: 1 })
    ).toBe(true);
    expect(
      isPurchasable({ variant: variant("READY_STOCK"), availableStock: 0 })
    ).toBe(false);
    expect(
      isPurchasable({ variant: variant("MADE_TO_ORDER"), availableStock: 0 })
    ).toBe(true);
    expect(
      isPurchasable({ variant: variant("OUT_OF_STOCK"), availableStock: 9 })
    ).toBe(false);
    expect(
      isPurchasable({ variant: variant("DISCONTINUED"), availableStock: 9 })
    ).toBe(false);
  });
});
