"use server";

import { listProducts, listCategories, getVariantsByIds } from "@/server/services/catalog/queries";
import type { Category, ProductSummary } from "@/lib/types";

export interface QuickSearchResult {
  query: string;
  products: ProductSummary[];
  categories: Category[];
  total: number;
}

/**
 * Server Action backing the header's search overlay.
 *
 * Reuses the same `listProducts` search filter as /search — so a query that
 * matches a contratipo's reference fragrance (e.g. "Aventus") surfaces here
 * too, not just on the full results page. Kept to a handful of items each,
 * since this only feeds an inline preview; "ver todos" sends the shopper to
 * /search for the complete, paginated result.
 */
export async function quickSearch(query: string): Promise<QuickSearchResult> {
  const trimmed = query.trim();
  if (!trimmed) {
    return { query: trimmed, products: [], categories: [], total: 0 };
  }

  const [productResult, allCategories] = await Promise.all([
    listProducts({ filters: { search: trimmed }, pageSize: 6 }),
    listCategories(),
  ]);

  const matchedCategories = allCategories
    .filter((category) => category.name.toLowerCase().includes(trimmed.toLowerCase()))
    .slice(0, 4);

  return {
    query: trimmed,
    products: productResult.items,
    categories: matchedCategories,
    total: productResult.total,
  };
}

/**
 * Resolves current availability for the cart's variant ids.
 *
 * Server Action wrapper around `getVariantsByIds`, called from the client-side
 * cart (CartView/CartDrawer) so a "mixed cart" delivery notice always reflects
 * live stock and lead times rather than whatever was true when a line was
 * added to localStorage.
 */
export async function getCartAvailability(variantIds: string[]) {
  return getVariantsByIds(variantIds);
}
