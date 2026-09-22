"use client";

import type { ProductSummary } from "@/lib/types";
import { useProductFilters, type SortKey } from "@/hooks/use-product-filters";
import { SortSelect } from "@/components/shop/sort-select";
import { ProductGrid } from "@/components/product/product-grid";
import { Pagination } from "@/components/common/pagination";

/**
 * Renders one already-fetched page of results.
 *
 * Filtering, sorting and pagination happen on the server (see
 * src/server/services/catalog/queries.ts); this component only reacts to the
 * URL and renders what it is given. Faceted filters (brand, family,
 * concentration, volume, availability) land in task 11.
 */
export function ShopView({
  title,
  description,
  products,
  page,
  totalPages,
}: {
  title: string;
  description?: string;
  products: ProductSummary[];
  page: number;
  totalPages: number;
}) {
  const { filters, updateParams } = useProductFilters();

  return (
    <div className="container-page py-8 sm:py-10">
      <div className="mb-8 max-w-2xl">
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {title}
        </h1>
        {description && <p className="mt-2 text-muted-foreground">{description}</p>}
      </div>

      <div className="mb-6 flex items-center justify-end gap-3">
        <SortSelect value={filters.sort} onChange={(v: SortKey) => updateParams({ sort: v })} />
      </div>

      <ProductGrid products={products} />

      {totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={(p) => updateParams({ page: String(p) })}
          className="mt-12"
        />
      )}
    </div>
  );
}
