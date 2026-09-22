import { prisma } from "@/server/db/client";

/**
 * Read side for the admin inventory screen.
 *
 * One row per variant, not per product: 30 ml of a fragrance can be in stock
 * while 50 ml of the same fragrance is made to order, so the operator needs
 * to see and adjust stock at the variant level.
 */

export interface AdminInventoryItem {
  inventoryId: string;
  variantId: string;
  productId: string;
  productName: string;
  productSlug: string;
  brandName: string;
  sku: string;
  volumeMl: number;
  availabilityType: "READY_STOCK" | "MADE_TO_ORDER" | "OUT_OF_STOCK" | "DISCONTINUED";
  onHand: number;
  reserved: number;
  /** onHand - reserved. Never stored, always derived — see availability.ts. */
  availableStock: number;
  lowStockThreshold: number;
  updatedAt: string;
}

export async function listInventoryForAdmin(): Promise<AdminInventoryItem[]> {
  const rows = await prisma.productVariant.findMany({
    where: { isActive: true },
    orderBy: [{ product: { name: "asc" } }, { volumeMl: "asc" }],
    include: {
      product: { select: { id: true, name: true, slug: true, brand: { select: { name: true } } } },
      inventory: { select: { id: true, onHand: true, reserved: true, lowStockThreshold: true, updatedAt: true } },
    },
  });

  return rows
    .filter((row) => row.inventory !== null)
    .map((row) => {
      const inventory = row.inventory!;
      return {
        inventoryId: inventory.id,
        variantId: row.id,
        productId: row.product.id,
        productName: row.product.name,
        productSlug: row.product.slug,
        brandName: row.product.brand.name,
        sku: row.sku,
        volumeMl: row.volumeMl,
        availabilityType: row.availabilityType,
        onHand: inventory.onHand,
        reserved: inventory.reserved,
        availableStock: Math.max(0, inventory.onHand - inventory.reserved),
        lowStockThreshold: inventory.lowStockThreshold,
        updatedAt: inventory.updatedAt.toISOString(),
      };
    });
}

export interface InventoryMovementItem {
  id: string;
  type: string;
  quantityDelta: number;
  onHandAfter: number;
  reservedAfter: number;
  referenceType: string | null;
  reason: string | null;
  createdAt: string;
}

export async function getInventoryMovements(inventoryId: string): Promise<InventoryMovementItem[]> {
  const rows = await prisma.inventoryMovement.findMany({
    where: { inventoryId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    quantityDelta: row.quantityDelta,
    onHandAfter: row.onHandAfter,
    reservedAfter: row.reservedAfter,
    referenceType: row.referenceType,
    reason: row.reason,
    createdAt: row.createdAt.toISOString(),
  }));
}
