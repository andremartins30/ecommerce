"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Gender, ProductType } from "@/lib/types";
import type { ListProductsSort } from "@/server/services/catalog/queries";

/**
 * URL as the source of truth for sort, pagination and every facet.
 *
 * Multi-select facets (family, concentration, brand, volume, gender, product
 * type) are serialised as a single comma-separated query param each — e.g.
 * `?familia=amadeirado,gourmand`. That keeps URLs shareable/bookmarkable and
 * avoids the ambiguity of repeated keys across different routers.
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

/** Query param keys for every facet, kept in one place so page/panel/hook agree. */
export const FACET_PARAMS = {
  family: "familia",
  concentration: "concentracao",
  brand: "marca",
  volume: "volume",
  gender: "genero",
  productType: "tipo",
  availability: "disponibilidade",
  minPrice: "precoMin",
  maxPrice: "precoMax",
} as const;

export type AvailabilityFacet = "READY_STOCK" | "MADE_TO_ORDER";

export interface ShopFilters {
  sort: SortKey;
  page: number;
  familySlugs: string[];
  concentrationSlugs: string[];
  brandSlugs: string[];
  volumesMl: number[];
  genders: Gender[];
  productTypes: ProductType[];
  availability: AvailabilityFacet | null;
  minPriceCents: number | null;
  maxPriceCents: number | null;
}

function parseList(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function parseNumberList(value: string | null): number[] {
  return parseList(value)
    .map((v) => Number(v))
    .filter((n) => Number.isFinite(n));
}

function serializeList(values: string[] | number[]): string | null {
  return values.length > 0 ? values.join(",") : null;
}

export function countActiveFacets(filters: ShopFilters): number {
  return (
    filters.familySlugs.length +
    filters.concentrationSlugs.length +
    filters.brandSlugs.length +
    filters.volumesMl.length +
    filters.genders.length +
    filters.productTypes.length +
    (filters.availability ? 1 : 0) +
    (filters.minPriceCents !== null ? 1 : 0) +
    (filters.maxPriceCents !== null ? 1 : 0)
  );
}

export function useProductFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = useMemo<ShopFilters>(() => {
    const minPrice = searchParams.get(FACET_PARAMS.minPrice);
    const maxPrice = searchParams.get(FACET_PARAMS.maxPrice);
    const availability = searchParams.get(FACET_PARAMS.availability);

    return {
      sort: (searchParams.get("sort") as SortKey) || "featured",
      page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
      familySlugs: parseList(searchParams.get(FACET_PARAMS.family)),
      concentrationSlugs: parseList(searchParams.get(FACET_PARAMS.concentration)),
      brandSlugs: parseList(searchParams.get(FACET_PARAMS.brand)),
      volumesMl: parseNumberList(searchParams.get(FACET_PARAMS.volume)),
      genders: parseList(searchParams.get(FACET_PARAMS.gender)) as Gender[],
      productTypes: parseList(searchParams.get(FACET_PARAMS.productType)) as ProductType[],
      availability: availability === "READY_STOCK" || availability === "MADE_TO_ORDER" ? availability : null,
      minPriceCents: minPrice ? Number(minPrice) : null,
      maxPriceCents: maxPrice ? Number(maxPrice) : null,
    };
  }, [searchParams]);

  function updateParams(updates: Record<string, string | null | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === undefined || value === "") params.delete(key);
      else params.set(key, value);
    }
    if (!("page" in updates)) params.delete("page");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  /** Adds or removes one value from a multi-select facet, resetting the page. */
  function toggleFacet(param: string, value: string, currentValues: string[]) {
    const next = currentValues.includes(value)
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value];
    updateParams({ [param]: serializeList(next) });
  }

  function setPriceRange(minCents: number | null, maxCents: number | null) {
    updateParams({
      [FACET_PARAMS.minPrice]: minCents !== null ? String(minCents) : null,
      [FACET_PARAMS.maxPrice]: maxCents !== null ? String(maxCents) : null,
    });
  }

  function setAvailability(value: AvailabilityFacet | null) {
    updateParams({ [FACET_PARAMS.availability]: value });
  }

  function clearAllFacets() {
    updateParams({
      [FACET_PARAMS.family]: null,
      [FACET_PARAMS.concentration]: null,
      [FACET_PARAMS.brand]: null,
      [FACET_PARAMS.volume]: null,
      [FACET_PARAMS.gender]: null,
      [FACET_PARAMS.productType]: null,
      [FACET_PARAMS.availability]: null,
      [FACET_PARAMS.minPrice]: null,
      [FACET_PARAMS.maxPrice]: null,
    });
  }

  return { filters, updateParams, toggleFacet, setPriceRange, setAvailability, clearAllFacets };
}
