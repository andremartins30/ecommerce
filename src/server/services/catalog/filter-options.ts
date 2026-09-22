import {
  getPriceBounds,
  listAvailableVolumes,
  listBrands,
  listFragranceFamilies,
  listConcentrations,
  type ListProductsFilters,
} from "@/server/services/catalog/queries";
import type { FilterPanelOptions } from "@/components/shop/filter-panel";

/**
 * Facet option lists + price bounds, fetched once per request for the
 * FilterPanel/ActiveFilters pair. Shared between /shop and /categorias/[slug]
 * so both pages offer identical facets.
 */
export async function getFilterPanelOptions(): Promise<FilterPanelOptions> {
  const [families, concentrations, brands, volumesMl, priceBoundsCents] = await Promise.all([
    listFragranceFamilies(),
    listConcentrations(),
    listBrands(),
    listAvailableVolumes(),
    getPriceBounds(),
  ]);

  return {
    families: families.map((f) => ({ slug: f.slug, name: f.name, colorHex: f.colorHex })),
    concentrations: concentrations.map((c) => ({ slug: c.slug, name: c.name })),
    brands: brands.map((b) => ({ slug: b.slug, name: b.name })),
    volumesMl,
    priceBoundsCents,
  };
}

/** Raw shop/category searchParams shape, before parsing into ListProductsFilters. */
export interface ShopSearchParams {
  sort?: string;
  page?: string;
  familia?: string;
  concentracao?: string;
  marca?: string;
  volume?: string;
  genero?: string;
  tipo?: string;
  disponibilidade?: string;
  precoMin?: string;
  precoMax?: string;
}

function splitList(value?: string): string[] {
  return value ? value.split(",").map((v) => v.trim()).filter(Boolean) : [];
}

/**
 * Turns the URL's raw facet params into the ListProductsFilters shape
 * listProducts() expects. `base` carries filters the page itself pins down
 * (e.g. a category page's categorySlug) so they always win.
 */
export function parseShopSearchParams(
  params: ShopSearchParams,
  base: ListProductsFilters = {}
): ListProductsFilters {
  const availability =
    params.disponibilidade === "READY_STOCK" || params.disponibilidade === "MADE_TO_ORDER"
      ? params.disponibilidade
      : undefined;

  return {
    ...base,
    familySlugs: splitList(params.familia),
    concentrationSlugs: splitList(params.concentracao),
    brandSlugs: splitList(params.marca),
    volumesMl: splitList(params.volume).map(Number).filter(Number.isFinite),
    genders: splitList(params.genero) as ListProductsFilters["genders"],
    productTypes: splitList(params.tipo) as ListProductsFilters["productTypes"],
    availability,
    minPriceCents: params.precoMin ? Number(params.precoMin) : undefined,
    maxPriceCents: params.precoMax ? Number(params.precoMax) : undefined,
  };
}
