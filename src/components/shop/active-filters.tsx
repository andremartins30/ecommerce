"use client";

import { X } from "lucide-react";
import type { Gender, ProductType } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { useProductFilters, FACET_PARAMS, type AvailabilityFacet } from "@/hooks/use-product-filters";
import type { FilterFacetOption } from "@/components/shop/filter-panel";

const GENDER_LABELS: Record<Gender, string> = {
  MASCULINO: "Masculino",
  FEMININO: "Feminino",
  UNISSEX: "Unissex",
};

const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  CONTRATIPO: "Contratipo",
  IMPORTADO: "Importado",
  NICHO: "Nicho",
  OUTRO: "Outro",
};

const AVAILABILITY_LABELS: Record<AvailabilityFacet, string> = {
  READY_STOCK: "Pronta entrega",
  MADE_TO_ORDER: "Sob encomenda",
};

interface Chip {
  key: string;
  label: string;
  onRemove: () => void;
}

/**
 * One removable chip per active facet value, plus a "clear all". Reads names
 * from the same option lists the panel uses, so a chip never shows a raw slug.
 */
export function ActiveFilters({
  families,
  concentrations,
  brands,
}: {
  families: FilterFacetOption[];
  concentrations: FilterFacetOption[];
  brands: FilterFacetOption[];
}) {
  const { filters, toggleFacet, setAvailability, setPriceRange, clearAllFacets } = useProductFilters();

  const nameOf = (options: FilterFacetOption[], slug: string) =>
    options.find((o) => o.slug === slug)?.name ?? slug;

  const chips: Chip[] = [
    ...filters.familySlugs.map((slug) => ({
      key: `familia-${slug}`,
      label: nameOf(families, slug),
      onRemove: () => toggleFacet(FACET_PARAMS.family, slug, filters.familySlugs),
    })),
    ...filters.concentrationSlugs.map((slug) => ({
      key: `concentracao-${slug}`,
      label: nameOf(concentrations, slug),
      onRemove: () => toggleFacet(FACET_PARAMS.concentration, slug, filters.concentrationSlugs),
    })),
    ...filters.brandSlugs.map((slug) => ({
      key: `marca-${slug}`,
      label: nameOf(brands, slug),
      onRemove: () => toggleFacet(FACET_PARAMS.brand, slug, filters.brandSlugs),
    })),
    ...filters.volumesMl.map((ml) => ({
      key: `volume-${ml}`,
      label: `${ml} ml`,
      onRemove: () =>
        toggleFacet(FACET_PARAMS.volume, String(ml), filters.volumesMl.map(String)),
    })),
    ...filters.genders.map((gender) => ({
      key: `genero-${gender}`,
      label: GENDER_LABELS[gender],
      onRemove: () => toggleFacet(FACET_PARAMS.gender, gender, filters.genders),
    })),
    ...filters.productTypes.map((type) => ({
      key: `tipo-${type}`,
      label: PRODUCT_TYPE_LABELS[type],
      onRemove: () => toggleFacet(FACET_PARAMS.productType, type, filters.productTypes),
    })),
    ...(filters.availability
      ? [
          {
            key: "disponibilidade",
            label: AVAILABILITY_LABELS[filters.availability],
            onRemove: () => setAvailability(null),
          },
        ]
      : []),
    ...(filters.minPriceCents !== null || filters.maxPriceCents !== null
      ? [
          {
            key: "preco",
            label: `${filters.minPriceCents !== null ? formatPrice(filters.minPriceCents) : "R$ 0"} – ${
              filters.maxPriceCents !== null ? formatPrice(filters.maxPriceCents) : "—"
            }`,
            onRemove: () => setPriceRange(null, null),
          },
        ]
      : []),
  ];

  if (chips.length === 0) return null;

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={chip.onRemove}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-foreground hover:border-accent"
        >
          {chip.label}
          <X className="size-3" aria-hidden />
        </button>
      ))}
      {chips.length > 1 && (
        <button
          type="button"
          onClick={clearAllFacets}
          className="text-xs font-medium text-muted-foreground hover:text-accent"
        >
          Limpar tudo
        </button>
      )}
    </div>
  );
}
