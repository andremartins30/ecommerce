/**
 * Availability resolution — the central rule of this catalogue.
 *
 * The rule that is easiest to get wrong, and the one everything else depends
 * on: **stock of zero does not mean unavailable**. A made-to-order variant with
 * no stock is perfectly sellable and creates production demand. A ready-stock
 * variant with no stock and no backorder policy is not.
 *
 * | availabilityType | onHand = 0 | outcome                               |
 * |------------------|------------|---------------------------------------|
 * | READY_STOCK      | yes        | not sellable, unless allowBackorder   |
 * | MADE_TO_ORDER    | yes        | sellable, produces to order           |
 * | OUT_OF_STOCK     | —          | not sellable                          |
 * | DISCONTINUED     | —          | not sellable                          |
 *
 * This module is pure: no Prisma, no React, no clock, no I/O. Everything it
 * needs is passed in, which is what makes the mandatory business cases
 * verifiable in milliseconds.
 */

/** Fallback when neither the variant, the product nor the store says otherwise. */
export const DEFAULT_PRODUCTION_LEAD_TIME_DAYS = 15;

/** Same bound as the database CHECK constraint. */
export const MAX_PRODUCTION_LEAD_TIME_DAYS = 365;

export type AvailabilityType =
  | "READY_STOCK"
  | "MADE_TO_ORDER"
  | "OUT_OF_STOCK"
  | "DISCONTINUED";

export interface VariantAvailabilityInput {
  availabilityType: AvailabilityType;
  /** Allows selling past `availableStock`, turning the excess into production. */
  allowBackorder: boolean;
  /** Level 1 of the lead time chain. Null means inherit. */
  productionLeadTimeDays?: number | null;
}

export interface ProductLeadTimeInput {
  /** Level 2 of the lead time chain. Null means inherit. */
  productionLeadTimeDays?: number | null;
}

export interface StoreLeadTimeSettings {
  /** Level 3 of the lead time chain. Null means fall back to the constant. */
  defaultProductionLeadTimeDays?: number | null;
}

export type UnsellableReason =
  | "OUT_OF_STOCK"
  | "DISCONTINUED"
  | "NO_STOCK_AND_NO_BACKORDER"
  | "INVALID_QUANTITY";

export interface AvailabilityResolution {
  sellable: boolean;
  /** Units that ship from existing stock. */
  qtyFromStock: number;
  /** Units that must be produced. */
  qtyBackordered: number;
  /** Why the request cannot be fulfilled. Null when it can. */
  reason: UnsellableReason | null;
  /**
   * Largest quantity that could be bought right now. `null` means unbounded,
   * which is the case whenever production can absorb any excess.
   */
  maxSellableQty: number | null;
  /** True when part or all of the request has to go through production. */
  requiresProduction: boolean;
}

export class AvailabilityInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AvailabilityInputError";
  }
}

function assertStock(availableStock: number): void {
  if (!Number.isInteger(availableStock) || availableStock < 0) {
    throw new AvailabilityInputError(
      `availableStock must be a non-negative integer, received ${availableStock}`
    );
  }
}

/**
 * Resolves how a requested quantity of one variant would be fulfilled.
 *
 * `availableStock` is `onHand - reserved`, computed by the caller from the
 * inventory row — never a stored column.
 */
export function resolveAvailability(input: {
  variant: VariantAvailabilityInput;
  requestedQty: number;
  availableStock: number;
}): AvailabilityResolution {
  const { variant, requestedQty, availableStock } = input;

  assertStock(availableStock);

  const unsellable = (
    reason: UnsellableReason,
    maxSellableQty: number | null
  ): AvailabilityResolution => ({
    sellable: false,
    qtyFromStock: 0,
    qtyBackordered: 0,
    reason,
    maxSellableQty,
    requiresProduction: false,
  });

  if (!Number.isInteger(requestedQty) || requestedQty < 1) {
    return unsellable("INVALID_QUANTITY", null);
  }

  switch (variant.availabilityType) {
    case "DISCONTINUED":
      // Never sold again, whatever the stock says.
      return unsellable("DISCONTINUED", 0);

    case "OUT_OF_STOCK":
      // An explicit operator decision: not for sale right now, and not
      // producible either.
      return unsellable("OUT_OF_STOCK", 0);

    case "MADE_TO_ORDER": {
      // Stock of zero is the normal case here. Any stock that does exist is
      // used first, because shipping an existing unit is faster for the
      // customer than producing a new one; the remainder is produced.
      const qtyFromStock = Math.min(availableStock, requestedQty);
      const qtyBackordered = requestedQty - qtyFromStock;

      return {
        sellable: true,
        qtyFromStock,
        qtyBackordered,
        reason: null,
        maxSellableQty: null,
        requiresProduction: qtyBackordered > 0,
      };
    }

    case "READY_STOCK": {
      if (requestedQty <= availableStock) {
        return {
          sellable: true,
          qtyFromStock: requestedQty,
          qtyBackordered: 0,
          reason: null,
          maxSellableQty: availableStock,
          requiresProduction: false,
        };
      }

      if (!variant.allowBackorder) {
        // Cannot promise what does not exist and will not be produced.
        return unsellable("NO_STOCK_AND_NO_BACKORDER", availableStock);
      }

      // Hybrid line: the stock on hand ships immediately, the excess is
      // produced to order.
      return {
        sellable: true,
        qtyFromStock: availableStock,
        qtyBackordered: requestedQty - availableStock,
        reason: null,
        maxSellableQty: null,
        requiresProduction: true,
      };
    }
  }
}

function assertLeadTime(value: number, source: string): number {
  if (!Number.isInteger(value) || value < 0 || value > MAX_PRODUCTION_LEAD_TIME_DAYS) {
    throw new AvailabilityInputError(
      `${source} production lead time must be an integer between 0 and ` +
      `${MAX_PRODUCTION_LEAD_TIME_DAYS}, received ${value}`
    );
  }
  return value;
}

/**
 * Resolves the production lead time through the inheritance chain:
 *
 *   variant -> product -> store setting -> 15 days
 *
 * Zero is a legitimate value (same-day preparation) and must not be treated as
 * "unset", which is why the chain tests for null and undefined rather than
 * falsiness.
 */
export function resolveProductionLeadTime(
  variant: Pick<VariantAvailabilityInput, "productionLeadTimeDays">,
  product: ProductLeadTimeInput = {},
  settings: StoreLeadTimeSettings = {}
): number {
  if (variant.productionLeadTimeDays !== null && variant.productionLeadTimeDays !== undefined) {
    return assertLeadTime(variant.productionLeadTimeDays, "Variant");
  }
  if (product.productionLeadTimeDays !== null && product.productionLeadTimeDays !== undefined) {
    return assertLeadTime(product.productionLeadTimeDays, "Product");
  }
  if (
    settings.defaultProductionLeadTimeDays !== null &&
    settings.defaultProductionLeadTimeDays !== undefined
  ) {
    return assertLeadTime(settings.defaultProductionLeadTimeDays, "Store");
  }
  return DEFAULT_PRODUCTION_LEAD_TIME_DAYS;
}

// ---------------------------------------------------------------------------
// Display state
// ---------------------------------------------------------------------------

/**
 * What the storefront should communicate about a variant before the shopper has
 * chosen a quantity.
 *
 * Returned as a discriminated union rather than a sentence: wording and
 * translation belong to the component layer, the decision belongs here. That is
 * what stops three different screens from inventing three different labels.
 */
export type AvailabilityDisplay =
  | { kind: "READY_STOCK"; availableStock: number; lowStock: boolean }
  | { kind: "MADE_TO_ORDER"; productionLeadTimeDays: number }
  /** Some units ship now, anything beyond them is produced. */
  | {
    kind: "PARTIAL";
    availableStock: number;
    lowStock: boolean;
    productionLeadTimeDays: number;
  }
  | { kind: "OUT_OF_STOCK" }
  | { kind: "DISCONTINUED" };

export interface DisplayAvailabilityInput {
  variant: VariantAvailabilityInput;
  availableStock: number;
  product?: ProductLeadTimeInput;
  settings?: StoreLeadTimeSettings & { lowStockThreshold?: number | null };
}

export function resolveAvailabilityDisplay(
  input: DisplayAvailabilityInput
): AvailabilityDisplay {
  const { variant, availableStock, product = {}, settings = {} } = input;

  assertStock(availableStock);

  const leadTime = () => resolveProductionLeadTime(variant, product, settings);
  const lowStockThreshold = settings.lowStockThreshold ?? 3;

  switch (variant.availabilityType) {
    case "DISCONTINUED":
      return { kind: "DISCONTINUED" };

    case "OUT_OF_STOCK":
      return { kind: "OUT_OF_STOCK" };

    case "MADE_TO_ORDER":
      // Classified as made to order by the operator, so that is what the
      // customer is told — even if a few units happen to be on the shelf. Any
      // stock still ships first (see resolveAvailability), but the promise
      // shown is the one the store can always keep.
      return { kind: "MADE_TO_ORDER", productionLeadTimeDays: leadTime() };

    case "READY_STOCK": {
      if (availableStock > 0) {
        const lowStock = availableStock <= lowStockThreshold;
        return variant.allowBackorder
          ? {
            kind: "PARTIAL",
            availableStock,
            lowStock,
            productionLeadTimeDays: leadTime(),
          }
          : { kind: "READY_STOCK", availableStock, lowStock };
      }
      // Out of stock, but production can still take the order.
      if (variant.allowBackorder) {
        return { kind: "MADE_TO_ORDER", productionLeadTimeDays: leadTime() };
      }
      return { kind: "OUT_OF_STOCK" };
    }
  }
}

/** True when the variant can be added to a cart at all. */
export function isPurchasable(input: {
  variant: VariantAvailabilityInput;
  availableStock: number;
}): boolean {
  return resolveAvailability({ ...input, requestedQty: 1 }).sellable;
}
