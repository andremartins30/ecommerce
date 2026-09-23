"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/server/db/client";
import {
  inventoryAdjustmentSchema,
  type InventoryAdjustmentValues,
} from "@/server/services/admin/inventory-schema";
import { requirePermission } from "@/server/services/auth/rbac";

/**
 * Write side for manual stock adjustments.
 *
 * Requires the `inventory.write` permission (see prisma/seed.ts's role→
 * permission map) and writes the real signed-in admin as the AuditLog actor —
 * same convention as product-actions.ts.
 */

export interface InventoryActionResult {
  success: boolean;
  fieldErrors?: Record<string, string>;
  formError?: string;
}

export async function adjustInventory(input: unknown): Promise<InventoryActionResult> {
  const admin = await requirePermission("inventory.write");

  const parsed = inventoryAdjustmentSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path.join(".");
      if (!fieldErrors[path]) fieldErrors[path] = issue.message;
    }
    return { success: false, fieldErrors };
  }

  const data: InventoryAdjustmentValues = parsed.data;

  const variant = await prisma.productVariant.findUnique({
    where: { id: data.variantId },
    include: { inventory: true },
  });
  if (!variant || !variant.inventory) {
    return { success: false, formError: "Variante ou estoque não encontrado" };
  }

  const signedDelta = data.direction === "IN" ? data.quantity : -data.quantity;
  const newOnHand = variant.inventory.onHand + signedDelta;

  if (newOnHand < 0) {
    return {
      success: false,
      formError: `Estoque insuficiente: há ${variant.inventory.onHand} unidade(s) em mãos.`,
    };
  }
  if (newOnHand < variant.inventory.reserved) {
    return {
      success: false,
      formError: `Não é possível reduzir abaixo do reservado (${variant.inventory.reserved} unidade(s) já reservadas para pedidos).`,
    };
  }

  try {
    await prisma.$transaction([
      prisma.inventory.update({
        where: { id: variant.inventory.id },
        data: { onHand: newOnHand },
      }),
      prisma.inventoryMovement.create({
        data: {
          inventoryId: variant.inventory.id,
          type: data.type,
          quantityDelta: signedDelta,
          onHandAfter: newOnHand,
          reservedAfter: variant.inventory.reserved,
          referenceType: "manual",
          reason: data.reason?.trim() || null,
        },
      }),
      prisma.auditLog.create({
        data: {
          actorType: "USER",
          actorId: admin.id,
          actorLabel: `${admin.adminUser.name} <${admin.email}>`,
          action: "inventory.adjust",
          entityType: "Inventory",
          entityId: variant.inventory.id,
          changes: {
            type: { before: null, after: data.type },
            quantityDelta: { before: variant.inventory.onHand, after: newOnHand },
          },
        },
      }),
    ]);

    revalidatePath("/admin/inventory");
    revalidatePath("/admin/products");
    return { success: true };
  } catch (error) {
    return { success: false, formError: describeError(error) };
  }
}

function describeError(error: unknown): string {
  if (error instanceof Error) {
    if ("code" in error && error.code === "P2010") {
      // Raw CHECK constraint violation surfaced by Postgres — reservedNotAboveOnHand
      // is the one this Server Action's own guard above should already prevent,
      // but the database is the last line of defense under concurrency.
      return "Este ajuste violaria uma regra de estoque (reservado não pode exceder o total em mãos).";
    }
    return error.message;
  }
  return "Erro inesperado ao ajustar o estoque.";
}
