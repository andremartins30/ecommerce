import { addBusinessDays, addCalendarDays } from "./business-days";

/**
 * Delivery promise.
 *
 * The single rule this module exists to enforce: **production time and transit
 * time are never merged into one number.** A made-to-order perfume with a
 * 15-day production window and a 3–5 day carrier estimate is
 *
 *     "Produção em até 15 dias + entrega estimada de 3 a 5 dias após a postagem"
 *
 * and never "entrega em 3 a 5 dias". The two figures stay separate all the way
 * from here to the screen; only the totals are derived, and they are labelled as
 * totals.
 *
 * Pure module: the caller supplies the clock, so every scenario is reproducible.
 */

export type ShipmentPolicy = "SINGLE_SHIPMENT" | "SPLIT_SHIPMENT";

export interface PromiseItemInput {
  /** Stable reference so a split promise can be mapped back to cart lines. */
  ref: string;
  /** From resolveAvailability: true when any unit has to be produced. */
  requiresProduction: boolean;
  /** From resolveProductionLeadTime. Ignored when requiresProduction is false. */
  productionLeadTimeDays: number;
}

export interface TransitEstimate {
  minDays: number;
  maxDays: number;
}

export interface PromiseSettings {
  /** Store preparation time, in business days. */
  handlingDays: number;
  shipmentPolicy: ShipmentPolicy;
  /** Optional non-working dates (YYYY-MM-DD) for date projection. */
  nonWorkingDays?: ReadonlySet<string>;
}

export interface DayRange {
  minDays: number;
  maxDays: number;
}

export interface ShipmentPromise {
  /** Items travelling together. */
  refs: string[];
  /** Calendar days of production governing this shipment. Zero when none. */
  productionDays: number;
  /** Business days of in-store preparation. */
  handlingDays: number;
  /** Carrier estimate, or null when no destination is known yet. */
  transit: TransitEstimate | null;
  /** Days until the parcel is posted: production + handling. */
  dispatch: DayRange;
  /** Days until it arrives. Null while transit is unknown. */
  delivery: DayRange | null;
  requiresProduction: boolean;
}

export interface DeliveryPromise {
  /**
   * Longest production window in the order, in calendar days. Zero when
   * everything is in stock.
   */
  productionDays: number;
  handlingDays: number;
  transit: TransitEstimate | null;
  /** True when at least one item has to be produced. */
  hasMadeToOrder: boolean;
  /** True when the order mixes in-stock and made-to-order items. */
  isMixed: boolean;
  shipmentPolicy: ShipmentPolicy;
  /**
   * Under SINGLE_SHIPMENT there is exactly one entry, governed by the slowest
   * item. Under SPLIT_SHIPMENT there is one entry per production window.
   */
  shipments: ShipmentPromise[];
  /** Whole-order dispatch window. */
  dispatch: DayRange;
  /** Whole-order delivery window. Null while transit is unknown. */
  delivery: DayRange | null;
}

export class DeliveryPromiseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DeliveryPromiseError";
  }
}

function assertNonNegativeInteger(value: number, label: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new DeliveryPromiseError(`${label} must be a non-negative integer, received ${value}`);
  }
}

function assertTransit(transit: TransitEstimate | null | undefined): void {
  if (!transit) return;
  assertNonNegativeInteger(transit.minDays, "transit.minDays");
  assertNonNegativeInteger(transit.maxDays, "transit.maxDays");
  if (transit.minDays > transit.maxDays) {
    throw new DeliveryPromiseError(
      `transit range is inverted: ${transit.minDays} > ${transit.maxDays}`
    );
  }
}

function buildShipment(
  refs: string[],
  productionDays: number,
  handlingDays: number,
  transit: TransitEstimate | null,
  requiresProduction: boolean
): ShipmentPromise {
  // Production and handling both have to happen before the parcel leaves.
  const dispatchDays = productionDays + handlingDays;
  const dispatch: DayRange = { minDays: dispatchDays, maxDays: dispatchDays };

  // Transit is added on top of dispatch — it never replaces production.
  const delivery: DayRange | null = transit
    ? {
        minDays: dispatchDays + transit.minDays,
        maxDays: dispatchDays + transit.maxDays,
      }
    : null;

  return { refs, productionDays, handlingDays, transit, dispatch, delivery, requiresProduction };
}

/**
 * Computes the promise for a set of items.
 *
 * Under SINGLE_SHIPMENT — the default policy — the whole order waits for its
 * slowest item. That is a real commercial consequence of shipping once, and the
 * checkout has to say so before the customer pays.
 */
export function computeDeliveryPromise(input: {
  items: PromiseItemInput[];
  settings: PromiseSettings;
  transit?: TransitEstimate | null;
}): DeliveryPromise {
  const { items, settings } = input;
  const transit = input.transit ?? null;

  if (items.length === 0) {
    throw new DeliveryPromiseError("cannot compute a delivery promise for zero items");
  }

  assertNonNegativeInteger(settings.handlingDays, "settings.handlingDays");
  assertTransit(transit);
  for (const item of items) {
    assertNonNegativeInteger(
      item.productionLeadTimeDays,
      `item ${item.ref} productionLeadTimeDays`
    );
  }

  const producedItems = items.filter((item) => item.requiresProduction);
  const stockItems = items.filter((item) => !item.requiresProduction);

  const hasMadeToOrder = producedItems.length > 0;
  const isMixed = producedItems.length > 0 && stockItems.length > 0;

  // An item that ships from stock contributes zero production days, whatever
  // lead time its variant happens to carry.
  const productionDays = producedItems.reduce(
    (max, item) => Math.max(max, item.productionLeadTimeDays),
    0
  );

  const shipments: ShipmentPromise[] =
    settings.shipmentPolicy === "SPLIT_SHIPMENT"
      ? buildSplitShipments(items, settings.handlingDays, transit)
      : [
          buildShipment(
            items.map((item) => item.ref),
            productionDays,
            settings.handlingDays,
            transit,
            hasMadeToOrder
          ),
        ];

  // Whole-order windows: the first parcel that can leave and the last one that
  // arrives.
  const dispatch: DayRange = {
    minDays: Math.min(...shipments.map((s) => s.dispatch.minDays)),
    maxDays: Math.max(...shipments.map((s) => s.dispatch.maxDays)),
  };

  const delivery: DayRange | null = transit
    ? {
        minDays: Math.min(...shipments.map((s) => s.delivery!.minDays)),
        maxDays: Math.max(...shipments.map((s) => s.delivery!.maxDays)),
      }
    : null;

  return {
    productionDays,
    handlingDays: settings.handlingDays,
    transit,
    hasMadeToOrder,
    isMixed,
    shipmentPolicy: settings.shipmentPolicy,
    shipments,
    dispatch,
    delivery,
  };
}

/**
 * Groups items by the production window they wait on, so each parcel leaves as
 * soon as its own contents are ready. Present from the start so enabling
 * SPLIT_SHIPMENT later is a configuration change, not a rewrite.
 */
function buildSplitShipments(
  items: PromiseItemInput[],
  handlingDays: number,
  transit: TransitEstimate | null
): ShipmentPromise[] {
  const groups = new Map<number, PromiseItemInput[]>();

  for (const item of items) {
    const key = item.requiresProduction ? item.productionLeadTimeDays : 0;
    const group = groups.get(key);
    if (group) group.push(item);
    else groups.set(key, [item]);
  }

  return [...groups.entries()]
    .sort(([a], [b]) => a - b)
    .map(([productionDays, group]) =>
      buildShipment(
        group.map((item) => item.ref),
        productionDays,
        handlingDays,
        transit,
        productionDays > 0
      )
    );
}

export interface ProjectedDates {
  /** Latest date the parcel should be posted. */
  dispatchBy: Date;
  /** Earliest and latest delivery dates. Null while transit is unknown. */
  deliveryFrom: Date | null;
  deliveryTo: Date | null;
  /** When production should be finished. Null when nothing is produced. */
  productionReadyBy: Date | null;
}

/**
 * Turns day counts into absolute dates.
 *
 * Production advances in calendar days, handling and transit in business days.
 * Mixing the two units is the whole reason this is a separate function instead
 * of arithmetic scattered through the services.
 */
export function projectPromiseDates(
  promise: Pick<DeliveryPromise, "productionDays" | "handlingDays" | "transit">,
  now: Date,
  nonWorkingDays: ReadonlySet<string> = new Set()
): ProjectedDates {
  const productionReadyBy =
    promise.productionDays > 0 ? addCalendarDays(now, promise.productionDays) : null;

  const dispatchBy = addBusinessDays(productionReadyBy ?? now, promise.handlingDays, nonWorkingDays);

  const deliveryFrom = promise.transit
    ? addBusinessDays(dispatchBy, promise.transit.minDays, nonWorkingDays)
    : null;
  const deliveryTo = promise.transit
    ? addBusinessDays(dispatchBy, promise.transit.maxDays, nonWorkingDays)
    : null;

  return { dispatchBy, deliveryFrom, deliveryTo, productionReadyBy };
}

/**
 * The facts a screen needs in order to describe the promise, with no wording
 * attached. Components own the copy; this owns the decision of *what* to say.
 */
export interface PromiseDisclosure {
  showProduction: boolean;
  productionDays: number;
  showTransit: boolean;
  transit: TransitEstimate | null;
  /** True when the customer must be told that the order ships only once. */
  showSingleShipmentWarning: boolean;
}

export function describePromise(promise: DeliveryPromise): PromiseDisclosure {
  return {
    showProduction: promise.hasMadeToOrder && promise.productionDays > 0,
    productionDays: promise.productionDays,
    showTransit: promise.transit !== null,
    transit: promise.transit,
    // Only worth saying when holding the order back actually delays something.
    showSingleShipmentWarning:
      promise.shipmentPolicy === "SINGLE_SHIPMENT" && promise.isMixed,
  };
}
