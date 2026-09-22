"use client";

import { Fragment } from "react";
import type { Gender, ProductType } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import {
  useProductFilters,
  type AvailabilityFacet,
  FACET_PARAMS,
} from "@/hooks/use-product-filters";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";

export interface FilterFacetOption {
  slug: string;
  name: string;
  colorHex?: string | null;
  count?: number;
}

/** Options fetched once per request, on the server, from the live catalogue. */
export interface FilterPanelOptions {
  families: FilterFacetOption[];
  concentrations: FilterFacetOption[];
  brands: FilterFacetOption[];
  volumesMl: number[];
  /** Bounds of the catalogue's price range, for the slider. */
  priceBoundsCents: { min: number; max: number };
}

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

/**
 * Faceted filter sidebar for the catalogue.
 *
 * Every facet writes straight to the URL through useProductFilters(); the
 * page re-fetches from listProducts() on navigation. There is no client-side
 * filtering here — the panel only reflects and edits query params.
 */
export function FilterPanel({ options }: { options: FilterPanelOptions }) {
  const { filters, toggleFacet, setPriceRange, setAvailability, clearAllFacets } = useProductFilters();

  const priceMin = filters.minPriceCents ?? options.priceBoundsCents.min;
  const priceMax = filters.maxPriceCents ?? options.priceBoundsCents.max;

  const hasAnyOption =
    options.families.length > 0 ||
    options.concentrations.length > 0 ||
    options.brands.length > 0 ||
    options.volumesMl.length > 0;

  if (!hasAnyOption) return null;

  return (
    <div className="space-y-1">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-heading text-sm font-semibold text-foreground">Filtrar</h2>
        <button
          type="button"
          onClick={clearAllFacets}
          className="text-xs font-medium text-muted-foreground hover:text-accent"
        >
          Limpar tudo
        </button>
      </div>

      <Accordion defaultValue={["familia", "preco", "disponibilidade"]} multiple>
        {options.families.length > 0 && (
          <AccordionItem value="familia">
            <AccordionTrigger>Família olfativa</AccordionTrigger>
            <AccordionContent>
              <FacetCheckboxList
                options={options.families}
                selected={filters.familySlugs}
                onToggle={(slug) => toggleFacet(FACET_PARAMS.family, slug, filters.familySlugs)}
                swatch
              />
            </AccordionContent>
          </AccordionItem>
        )}

        <AccordionItem value="preco">
          <AccordionTrigger>Preço</AccordionTrigger>
          <AccordionContent>
            <div className="px-1 pt-2">
              <Slider
                min={options.priceBoundsCents.min}
                max={options.priceBoundsCents.max}
                step={1000}
                value={[priceMin, priceMax]}
                onValueChange={(value) => {
                  const [min, max] = value as number[];
                  setPriceRange(min, max);
                }}
              />
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>{formatPrice(priceMin)}</span>
                <span>{formatPrice(priceMax)}</span>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="disponibilidade">
          <AccordionTrigger>Disponibilidade</AccordionTrigger>
          <AccordionContent>
            <ul className="space-y-2">
              {(Object.keys(AVAILABILITY_LABELS) as AvailabilityFacet[]).map((value) => (
                <li key={value}>
                  <label className="flex items-center gap-2.5 text-sm text-foreground">
                    <Checkbox
                      checked={filters.availability === value}
                      onCheckedChange={() =>
                        setAvailability(filters.availability === value ? null : value)
                      }
                    />
                    {AVAILABILITY_LABELS[value]}
                  </label>
                </li>
              ))}
            </ul>
          </AccordionContent>
        </AccordionItem>

        {options.concentrations.length > 0 && (
          <AccordionItem value="concentracao">
            <AccordionTrigger>Concentração</AccordionTrigger>
            <AccordionContent>
              <FacetCheckboxList
                options={options.concentrations}
                selected={filters.concentrationSlugs}
                onToggle={(slug) =>
                  toggleFacet(FACET_PARAMS.concentration, slug, filters.concentrationSlugs)
                }
              />
            </AccordionContent>
          </AccordionItem>
        )}

        {options.volumesMl.length > 0 && (
          <AccordionItem value="volume">
            <AccordionTrigger>Volume</AccordionTrigger>
            <AccordionContent>
              <ul className="flex flex-wrap gap-2">
                {options.volumesMl.map((ml) => {
                  const isSelected = filters.volumesMl.includes(ml);
                  return (
                    <li key={ml}>
                      <button
                        type="button"
                        onClick={() =>
                          toggleFacet(FACET_PARAMS.volume, String(ml), filters.volumesMl.map(String))
                        }
                        aria-pressed={isSelected}
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${isSelected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border text-foreground hover:border-accent"
                          }`}
                      >
                        {ml} ml
                      </button>
                    </li>
                  );
                })}
              </ul>
            </AccordionContent>
          </AccordionItem>
        )}

        {options.brands.length > 0 && (
          <AccordionItem value="marca">
            <AccordionTrigger>Marca</AccordionTrigger>
            <AccordionContent>
              <FacetCheckboxList
                options={options.brands}
                selected={filters.brandSlugs}
                onToggle={(slug) => toggleFacet(FACET_PARAMS.brand, slug, filters.brandSlugs)}
              />
            </AccordionContent>
          </AccordionItem>
        )}

        <AccordionItem value="genero">
          <AccordionTrigger>Gênero</AccordionTrigger>
          <AccordionContent>
            <ul className="space-y-2">
              {(Object.keys(GENDER_LABELS) as Gender[]).map((value) => (
                <li key={value}>
                  <label className="flex items-center gap-2.5 text-sm text-foreground">
                    <Checkbox
                      checked={filters.genders.includes(value)}
                      onCheckedChange={() => toggleFacet(FACET_PARAMS.gender, value, filters.genders)}
                    />
                    {GENDER_LABELS[value]}
                  </label>
                </li>
              ))}
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="tipo">
          <AccordionTrigger>Tipo de produto</AccordionTrigger>
          <AccordionContent>
            <ul className="space-y-2">
              {(Object.keys(PRODUCT_TYPE_LABELS) as ProductType[]).map((value) => (
                <li key={value}>
                  <label className="flex items-center gap-2.5 text-sm text-foreground">
                    <Checkbox
                      checked={filters.productTypes.includes(value)}
                      onCheckedChange={() =>
                        toggleFacet(FACET_PARAMS.productType, value, filters.productTypes)
                      }
                    />
                    {PRODUCT_TYPE_LABELS[value]}
                  </label>
                </li>
              ))}
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

function FacetCheckboxList({
  options,
  selected,
  onToggle,
  swatch = false,
}: {
  options: FilterFacetOption[];
  selected: string[];
  onToggle: (slug: string) => void;
  swatch?: boolean;
}) {
  return (
    <ul className="space-y-2">
      {options.map((option) => (
        <li key={option.slug}>
          <label className="flex items-center gap-2.5 text-sm text-foreground">
            <Checkbox checked={selected.includes(option.slug)} onCheckedChange={() => onToggle(option.slug)} />
            {swatch && option.colorHex ? (
              <span
                className="size-2.5 shrink-0 rounded-full border border-border/50"
                style={{ backgroundColor: option.colorHex }}
                aria-hidden
              />
            ) : (
              <Fragment />
            )}
            <span className="flex-1">{option.name}</span>
            {option.count !== undefined && (
              <span className="text-xs text-muted-foreground">{option.count}</span>
            )}
          </label>
        </li>
      ))}
    </ul>
  );
}
