import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db/client";
import { getStoreSettings } from "@/server/services/settings/store-settings";
import { mapProductSummary, type ProductRow } from "@/server/services/catalog/mappers";

/**
 * Resolves product summaries for a client-held list of IDs.
 *
 * The wishlist is intentionally client-side (localStorage) for anonymous
 * shoppers until task 21 persists it server-side, so the browser only has IDs
 * — it never has price, availability or stock. This endpoint is the one place
 * those IDs are turned into current, authoritative data.
 */

const querySchema = z.object({
  ids: z
    .string()
    .transform((value) => value.split(",").map((id) => id.trim()).filter(Boolean))
    .pipe(z.array(z.string().min(1)).max(100)),
});

const productInclude = {
  brand: { select: { id: true, slug: true, name: true, countryCode: true } },
  category: { select: { id: true, slug: true, name: true } },
  concentration: { select: { id: true, slug: true, name: true, abbreviation: true } },
  images: {
    select: { url: true, alt: true, width: true, height: true, isPrimary: true, position: true },
  },
  variants: {
    include: { inventory: { select: { onHand: true, reserved: true, lowStockThreshold: true } } },
  },
  families: { include: { family: { select: { id: true, slug: true, name: true, colorHex: true } } } },
} as const;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse({ ids: url.searchParams.get("ids") ?? "" });

  if (!parsed.success) {
    return NextResponse.json({ error: "invalid ids parameter" }, { status: 400 });
  }

  const { ids } = parsed.data;
  if (ids.length === 0) return NextResponse.json({ items: [] });

  const [rows, settings] = await Promise.all([
    prisma.product.findMany({
      where: { id: { in: ids }, status: "ACTIVE" },
      include: productInclude,
    }),
    getStoreSettings(),
  ]);

  const byId = new Map(rows.map((row) => [row.id, row]));
  // Preserve the caller's order and silently drop ids that no longer resolve
  // (removed or unpublished product) rather than erroring the whole list.
  const items = ids
    .map((id) => byId.get(id))
    .filter((row): row is NonNullable<typeof row> => row !== undefined)
    .map((row) => mapProductSummary(row as unknown as ProductRow, settings));

  return NextResponse.json({ items });
}
