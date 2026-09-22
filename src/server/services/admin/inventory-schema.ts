import { z } from "zod";

/**
 * Validation for manual stock adjustments made from the admin.
 *
 * Only movement types an operator can trigger by hand are exposed here.
 * SALE, RESERVATION and RELEASE are written by the transactional order flow
 * (tasks 21-23) — a human never creates one of those directly, so offering
 * them in this form would let the admin silently desync the ledger from what
 * actually happened at checkout.
 */

export const MANUAL_MOVEMENT_TYPES = ["PURCHASE", "PRODUCTION", "RETURN", "ADJUSTMENT", "LOSS"] as const;
export type ManualMovementType = (typeof MANUAL_MOVEMENT_TYPES)[number];

/** Movements that increase onHand vs. the ones that decrease it. */
export const INCREASING_MOVEMENT_TYPES: ManualMovementType[] = ["PURCHASE", "PRODUCTION", "RETURN"];
export const DECREASING_MOVEMENT_TYPES: ManualMovementType[] = ["ADJUSTMENT", "LOSS"];

/**
 * ADJUSTMENT covers both directions (a correction can go either way), so it
 * appears in both lists; the sign is decided by `direction`, not by the type
 * alone.
 */
export const ADJUSTABLE_BOTH_WAYS: ManualMovementType[] = ["ADJUSTMENT"];

export const inventoryAdjustmentSchema = z
  .object({
    variantId: z.string().min(1),
    type: z.enum(MANUAL_MOVEMENT_TYPES),
    /** Always positive; `direction` decides the sign of the ledger delta. */
    quantity: z.number().int().positive("Quantidade deve ser maior que zero"),
    direction: z.enum(["IN", "OUT"]),
    reason: z.string().nullable().optional(),
  })
  .refine(
    (data) => data.type !== "ADJUSTMENT" && data.type !== "LOSS" ? true : !!data.reason?.trim(),
    { message: "Motivo é obrigatório para ajustes e perdas", path: ["reason"] }
  )
  .refine(
    (data) => (data.type === "LOSS" ? data.direction === "OUT" : true),
    { message: "Perda só pode reduzir o estoque", path: ["direction"] }
  )
  .refine(
    (data) => (data.type === "PURCHASE" || data.type === "PRODUCTION" || data.type === "RETURN"
      ? data.direction === "IN"
      : true),
    { message: "Este tipo de movimento só pode aumentar o estoque", path: ["direction"] }
  );

export type InventoryAdjustmentValues = z.infer<typeof inventoryAdjustmentSchema>;
