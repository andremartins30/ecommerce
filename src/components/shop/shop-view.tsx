"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import type { ProductSummary } from "@/lib/types";
import { useProductFilters, countActiveFacets, type SortKey } from "@/hooks/use-product-filters";
import { SortSelect } from "@/components/shop/sort-select";
import { FilterPanel, type FilterPanelOptions } from "@/components/shop/filter-panel";
import { ActiveFilters } from "@/components/shop/active-filters";
import { ProductGrid } from "@/components/product/product-grid";
import { Pagination } from "@/components/common/pagination";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

/**
 * Renders one already-fetched page of results.
 *
 * Filtering, sorting and pagination happen on the server (see
 * src/server/services/catalog/queries.ts); this component only reacts to the
 * URL and renders what it is given. The facet panel is a sidebar on desktop
 * and a sheet on mobile, both driven by the same useProductFilters() state.
 */
export function ShopView({
  title,
  description,
  products,
  page,
  totalPages,
  filterOptions,
}: {
  title: string;
  description?: string;
  products: ProductSummary[];
  page: number;
  totalPages: number;
  filterOptions: FilterPanelOptions;
}) {
  const { filters, updateParams } = useProductFilters();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const activeCount = countActiveFacets(filters);

  return (
    <div className="container-page py-8 sm:py-10">
      <div className="mb-8 max-w-2xl">
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {title}
        </h1>
        {description && <p className="mt-2 text-muted-foreground">{description}</p>}
      </div>

      <div className="mb-6 flex items-center justify-between gap-3">
        <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
          <SheetTrigger
            render={<Button variant="outline" size="sm" className="lg:hidden" />}
          >
            <SlidersHorizontal className="size-4" />
            Filtrar
            {activeCount > 0 && (
              <span className="ml-1 inline-flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                {activeCount}
              </span>
            )}
          </SheetTrigger>
          <SheetContent side="left" className="w-full max-w-sm overflow-y-auto p-6">
            <SheetHeader className="px-0">
              <SheetTitle>Filtrar</SheetTitle>
            </SheetHeader>
            <div className="mt-4">
              <FilterPanel options={filterOptions} />
            </div>
          </SheetContent>
        </Sheet>

        <div className="ml-auto">
          <SortSelect value={filters.sort} onChange={(v: SortKey) => updateParams({ sort: v })} />
        </div>
      </div>

      <div className="grid gap-10 lg:grid-cols-[240px_1fr]">
        <aside className="hidden lg:block">
          <FilterPanel options={filterOptions} />
        </aside>

        <div>
          <ActiveFilters
            families={filterOptions.families}
            concentrations={filterOptions.concentrations}
            brands={filterOptions.brands}
          />

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
      </div>
    </div>
  );
}
