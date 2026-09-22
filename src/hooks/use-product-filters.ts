"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ListProductsSort } from "@/server/services/catalog/queries";

/**
 * URL as the source of truth for sort and pagination.
 *
 * Faceted filters (brand, family, concentration, volume, availability) arrive
 * in task 11 alongside server-side filtering; this hook intentionally only
 * covers what the catalogue pages need today, so as not to duplicate that
 * work.
 */

export type SortKey = ListProductsSort;

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "featured", label: "Destaques" },
  { value: "newest", label: "Lançamentos" },
  { value: "price-asc", label: "Preço: menor para maior" },
  { value: "price-desc", label: "Preço: maior para menor" },
  { value: "best-selling", label: "Mais vendidos" },
  { value: "top-rated", label: "Melhor avaliados" },
];

export function useProductFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = useMemo(
    () => ({
      sort: (searchParams.get("sort") as SortKey) || "featured",
      page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
    }),
    [searchParams]
  );

  function updateParams(updates: Record<string, string | null | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === undefined || value === "") params.delete(key);
      else params.set(key, value);
    }
    if (!("page" in updates)) params.delete("page");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return { filters, updateParams };
}
