import { describe, expect, it } from "vitest";
import {
  computeDeliveryPromise,
  DeliveryPromiseError,
  describePromise,
  projectPromiseDates,
  type PromiseItemInput,
  type PromiseSettings,
} from "./delivery-promise";

const SINGLE: PromiseSettings = { handlingDays: 1, shipmentPolicy: "SINGLE_SHIPMENT" };
const SPLIT: PromiseSettings = { handlingDays: 1, shipmentPolicy: "SPLIT_SHIPMENT" };

const inStock = (ref: string): PromiseItemInput => ({
  ref,
  requiresProduction: false,
  productionLeadTimeDays: 0,
});

const madeToOrder = (ref: string, days = 15): PromiseItemInput => ({
  ref,
  requiresProduction: true,
  productionLeadTimeDays: days,
});

describe("ready stock only", () => {
  it("has no production time", () => {
    const promise = computeDeliveryPromise({ items: [inStock("a")], settings: SINGLE });

    expect(promise.productionDays).toBe(0);
    expect(promise.hasMadeToOrder).toBe(false);
    expect(promise.isMixed).toBe(false);
    expect(promise.dispatch).toEqual({ minDays: 1, maxDays: 1 });
  });

  it("ignores a lead time carried by an in-stock item", () => {
    // The variant may well have a 15-day lead time configured; if this purchase
    // ships from stock, that number is irrelevant to the promise.
    const promise = computeDeliveryPromise({
      items: [{ ref: "a", requiresProduction: false, productionLeadTimeDays: 15 }],
      settings: SINGLE,
    });

    expect(promise.productionDays).toBe(0);
  });

  it("adds transit on top of handling", () => {
    const promise = computeDeliveryPromise({
      items: [inStock("a")],
      settings: SINGLE,
      transit: { minDays: 3, maxDays: 5 },
    });

    expect(promise.dispatch).toEqual({ minDays: 1, maxDays: 1 });
    expect(promise.delivery).toEqual({ minDays: 4, maxDays: 6 });
  });
});

describe("made to order only", () => {
  it("carries the 15-day production window", () => {
    const promise = computeDeliveryPromise({ items: [madeToOrder("a", 15)], settings: SINGLE });

    expect(promise.productionDays).toBe(15);
    expect(promise.hasMadeToOrder).toBe(true);
    expect(promise.dispatch).toEqual({ minDays: 16, maxDays: 16 });
  });

  it("keeps production and transit as separate figures", () => {
    const promise = computeDeliveryPromise({
      items: [madeToOrder("a", 15)],
      settings: SINGLE,
      transit: { minDays: 3, maxDays: 5 },
    });

    // The two numbers the customer is shown, side by side.
    expect(promise.productionDays).toBe(15);
    expect(promise.transit).toEqual({ minDays: 3, maxDays: 5 });

    // And the derived total, which must include production rather than replace it.
    expect(promise.delivery).toEqual({ minDays: 19, maxDays: 21 });
  });

  it("never lets transit absorb production", () => {
    const withTransit = computeDeliveryPromise({
      items: [madeToOrder("a", 15)],
      settings: SINGLE,
      transit: { minDays: 3, maxDays: 5 },
    });

    // The failure mode this guards against: showing "3 to 5 days" for a perfume
    // that has not been made yet.
    expect(withTransit.delivery!.minDays).toBeGreaterThan(withTransit.transit!.maxDays);
    expect(withTransit.delivery!.minDays).toBeGreaterThanOrEqual(withTransit.productionDays);
  });

  it("still reports production when no destination is known yet", () => {
    const promise = computeDeliveryPromise({ items: [madeToOrder("a", 15)], settings: SINGLE });

    // Before the shopper types a CEP, the production window is already knowable
    // and must be shown.
    expect(promise.productionDays).toBe(15);
    expect(promise.transit).toBeNull();
    expect(promise.delivery).toBeNull();
    expect(promise.dispatch.maxDays).toBe(16);
  });

  it("handles a zero-day lead time as same-day preparation", () => {
    const promise = computeDeliveryPromise({
      items: [{ ref: "a", requiresProduction: true, productionLeadTimeDays: 0 }],
      settings: { handlingDays: 1, shipmentPolicy: "SINGLE_SHIPMENT" },
    });

    expect(promise.productionDays).toBe(0);
    expect(promise.hasMadeToOrder).toBe(true);
    expect(promise.dispatch.maxDays).toBe(1);
  });
});

describe("mixed cart under SINGLE_SHIPMENT", () => {
  it("is governed by the slowest item", () => {
    // Mandatory case 5: one ready-stock item and one made-to-order item.
    const promise = computeDeliveryPromise({
      items: [inStock("pronta"), madeToOrder("encomenda", 15)],
      settings: SINGLE,
      transit: { minDays: 3, maxDays: 5 },
    });

    expect(promise.isMixed).toBe(true);
    expect(promise.hasMadeToOrder).toBe(true);
    expect(promise.productionDays).toBe(15);
    expect(promise.shipments).toHaveLength(1);
    expect(promise.shipments[0].refs).toEqual(["pronta", "encomenda"]);
    // The in-stock perfume waits for the one being made.
    expect(promise.delivery).toEqual({ minDays: 19, maxDays: 21 });
  });

  it("takes the longest of several production windows", () => {
    const promise = computeDeliveryPromise({
      items: [madeToOrder("a", 7), madeToOrder("b", 20), madeToOrder("c", 15)],
      settings: SINGLE,
    });

    expect(promise.productionDays).toBe(20);
    expect(promise.shipments).toHaveLength(1);
  });

  it("is not flagged as mixed when every item is made to order", () => {
    const promise = computeDeliveryPromise({
      items: [madeToOrder("a", 15), madeToOrder("b", 15)],
      settings: SINGLE,
    });

    // Nothing is being held back, so there is no single-shipment trade-off to
    // disclose.
    expect(promise.hasMadeToOrder).toBe(true);
    expect(promise.isMixed).toBe(false);
  });
});

describe("SPLIT_SHIPMENT", () => {
  it("splits a mixed cart so stock leaves first", () => {
    const promise = computeDeliveryPromise({
      items: [inStock("pronta"), madeToOrder("encomenda", 15)],
      settings: SPLIT,
      transit: { minDays: 3, maxDays: 5 },
    });

    expect(promise.shipments).toHaveLength(2);

    const [first, second] = promise.shipments;
    expect(first.refs).toEqual(["pronta"]);
    expect(first.productionDays).toBe(0);
    expect(first.delivery).toEqual({ minDays: 4, maxDays: 6 });

    expect(second.refs).toEqual(["encomenda"]);
    expect(second.productionDays).toBe(15);
    expect(second.delivery).toEqual({ minDays: 19, maxDays: 21 });

    // Whole-order window spans the first departure to the last arrival.
    expect(promise.dispatch).toEqual({ minDays: 1, maxDays: 16 });
    expect(promise.delivery).toEqual({ minDays: 4, maxDays: 21 });
  });

  it("groups items that share a production window", () => {
    const promise = computeDeliveryPromise({
      items: [madeToOrder("a", 15), madeToOrder("b", 15), madeToOrder("c", 7)],
      settings: SPLIT,
    });

    expect(promise.shipments).toHaveLength(2);
    expect(promise.shipments[0]).toMatchObject({ productionDays: 7, refs: ["c"] });
    expect(promise.shipments[1]).toMatchObject({ productionDays: 15, refs: ["a", "b"] });
  });

  it("produces one shipment when every item is in stock", () => {
    const promise = computeDeliveryPromise({
      items: [inStock("a"), inStock("b")],
      settings: SPLIT,
    });

    expect(promise.shipments).toHaveLength(1);
    expect(promise.productionDays).toBe(0);
  });

  it("reports the same order-level production window as SINGLE_SHIPMENT", () => {
    const items = [inStock("a"), madeToOrder("b", 15)];
    const single = computeDeliveryPromise({ items, settings: SINGLE });
    const split = computeDeliveryPromise({ items, settings: SPLIT });

    // Changing the policy changes how parcels are grouped, not how long the
    // slowest perfume takes to make.
    expect(split.productionDays).toBe(single.productionDays);
  });
});

describe("input validation", () => {
  it("refuses an empty item list", () => {
    expect(() => computeDeliveryPromise({ items: [], settings: SINGLE })).toThrow(
      DeliveryPromiseError
    );
  });

  it("refuses a negative or fractional handling time", () => {
    for (const handlingDays of [-1, 1.5]) {
      expect(() =>
        computeDeliveryPromise({ items: [inStock("a")], settings: { ...SINGLE, handlingDays } })
      ).toThrow(DeliveryPromiseError);
    }
  });

  it("refuses an inverted transit range", () => {
    expect(() =>
      computeDeliveryPromise({
        items: [inStock("a")],
        settings: SINGLE,
        transit: { minDays: 9, maxDays: 2 },
      })
    ).toThrow(/transit range is inverted/);
  });

  it("names the offending item on a bad lead time", () => {
    expect(() =>
      computeDeliveryPromise({
        items: [{ ref: "perfume-x", requiresProduction: true, productionLeadTimeDays: -5 }],
        settings: SINGLE,
      })
    ).toThrow(/item perfume-x productionLeadTimeDays/);
  });
});

describe("describePromise", () => {
  it("discloses production only when something is produced", () => {
    const inStockOnly = describePromise(
      computeDeliveryPromise({ items: [inStock("a")], settings: SINGLE })
    );
    expect(inStockOnly.showProduction).toBe(false);

    const produced = describePromise(
      computeDeliveryPromise({ items: [madeToOrder("a", 15)], settings: SINGLE })
    );
    expect(produced.showProduction).toBe(true);
    expect(produced.productionDays).toBe(15);
  });

  it("warns about single shipment only for a mixed order", () => {
    const mixed = describePromise(
      computeDeliveryPromise({ items: [inStock("a"), madeToOrder("b", 15)], settings: SINGLE })
    );
    expect(mixed.showSingleShipmentWarning).toBe(true);

    const allProduced = describePromise(
      computeDeliveryPromise({ items: [madeToOrder("a", 15)], settings: SINGLE })
    );
    expect(allProduced.showSingleShipmentWarning).toBe(false);

    const split = describePromise(
      computeDeliveryPromise({ items: [inStock("a"), madeToOrder("b", 15)], settings: SPLIT })
    );
    expect(split.showSingleShipmentWarning).toBe(false);
  });

  it("returns facts, not wording", () => {
    const disclosure = describePromise(
      computeDeliveryPromise({ items: [madeToOrder("a", 15)], settings: SINGLE })
    );
    expect(JSON.stringify(disclosure)).not.toMatch(/produção|entrega|dias/i);
  });
});

describe("projectPromiseDates", () => {
  // Monday 2026-09-21, 12:00 UTC.
  const monday = new Date("2026-09-21T12:00:00Z");

  it("projects a ready-stock dispatch one business day out", () => {
    const dates = projectPromiseDates({ productionDays: 0, handlingDays: 1, transit: null }, monday);

    expect(dates.productionReadyBy).toBeNull();
    expect(dates.dispatchBy.toISOString().slice(0, 10)).toBe("2026-09-22");
  });

  it("counts production in calendar days and transit in business days", () => {
    const dates = projectPromiseDates(
      { productionDays: 15, handlingDays: 1, transit: { minDays: 3, maxDays: 5 } },
      monday
    );

    // 15 calendar days from Monday 21 Sep is Tuesday 6 Oct.
    expect(dates.productionReadyBy!.toISOString().slice(0, 10)).toBe("2026-10-06");
    // Plus one business day of handling.
    expect(dates.dispatchBy.toISOString().slice(0, 10)).toBe("2026-10-07");
    // Plus three and five business days of transit (no weekend crossed for min).
    expect(dates.deliveryFrom!.toISOString().slice(0, 10)).toBe("2026-10-12");
    expect(dates.deliveryTo!.toISOString().slice(0, 10)).toBe("2026-10-14");
  });

  it("never lands a dispatch on a weekend", () => {
    // Friday 2026-09-25 + 15 calendar days = Saturday 10 Oct.
    const friday = new Date("2026-09-25T12:00:00Z");
    const dates = projectPromiseDates(
      { productionDays: 15, handlingDays: 0, transit: null },
      friday
    );

    expect(dates.productionReadyBy!.getUTCDay()).toBe(6); // Saturday
    // Zero handling days still moves off the weekend.
    const dispatchDay = dates.dispatchBy.getUTCDay();
    expect(dispatchDay).not.toBe(0);
    expect(dispatchDay).not.toBe(6);
  });

  it("skips supplied non-working dates", () => {
    // 2026-09-22 is a Tuesday; treat it as a holiday.
    const holidays = new Set(["2026-09-22"]);
    const dates = projectPromiseDates(
      { productionDays: 0, handlingDays: 1, transit: null },
      monday,
      holidays
    );

    expect(dates.dispatchBy.toISOString().slice(0, 10)).toBe("2026-09-23");
  });

  it("leaves delivery dates null while transit is unknown", () => {
    const dates = projectPromiseDates(
      { productionDays: 15, handlingDays: 1, transit: null },
      monday
    );

    expect(dates.productionReadyBy).not.toBeNull();
    expect(dates.deliveryFrom).toBeNull();
    expect(dates.deliveryTo).toBeNull();
  });

  it("orders the projected dates consistently", () => {
    const dates = projectPromiseDates(
      { productionDays: 15, handlingDays: 2, transit: { minDays: 3, maxDays: 8 } },
      monday
    );

    expect(dates.productionReadyBy!.getTime()).toBeLessThanOrEqual(dates.dispatchBy.getTime());
    expect(dates.dispatchBy.getTime()).toBeLessThan(dates.deliveryFrom!.getTime());
    expect(dates.deliveryFrom!.getTime()).toBeLessThanOrEqual(dates.deliveryTo!.getTime());
  });
});
