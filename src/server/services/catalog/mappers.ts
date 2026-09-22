import {
  resolveAvailability,
  resolveAvailabilityDisplay,
  resolveProductionLeadTime,
} from "@/server/domain/availability/availability";
import { renderContratipoDisclaimer } from "@/server/services/settings/store-settings";
import { pickDefaultVariant } from "@/lib/product-variant";
import type {
  FragranceNoteRef,
  OlfactoryPyramid,
  ProductDetail,
  ProductSummary,
  ProductVariant,
  StoreSettings,
} from "@/lib/types";

/**
 * Prisma rows to DTOs.
 *
 * This is where availability and production lead time are resolved, once, on the
 * server. Components downstream receive decisions, not raw columns — which is
 * what keeps three different screens from disagreeing about whether a perfume is
 * in stock.
 */

/** The shape these mappers need; satisfied by the `include` in queries.ts. */
export interface VariantRow {
  id: string;
  sku: string;
  volumeMl: number;
  priceCents: number;
  compareAtPriceCents: number | null;
  weightGrams: number;
  ean: string | null;
  availabilityType: "READY_STOCK" | "MADE_TO_ORDER" | "OUT_OF_STOCK" | "DISCONTINUED";
  allowBackorder: boolean;
  productionLeadTimeDays: number | null;
  isActive: boolean;
  position: number;
  inventory: { onHand: number; reserved: number; lowStockThreshold: number } | null;
}

export interface ProductRow {
  id: string;
  slug: string;
  name: string;
  productType: "CONTRATIPO" | "IMPORTADO" | "NICHO" | "OUTRO";
  shortDescription: string;
  description: string;
  gender: "MASCULINO" | "FEMININO" | "UNISSEX";
  occasions: string[];
  seasons: string[];
  countryOfOrigin: string | null;
  longevity: string | null;
  projection: string | null;
  inspiredBy: string | null;
  referenceBrand: string | null;
  referenceFragrance: string | null;
  disclaimerOverride: string | null;
  productionLeadTimeDays: number | null;
  isFeatured: boolean;
  isBestSeller: boolean;
  isNew: boolean;
  tags: string[];
  seoTitle: string | null;
  seoDesc: string | null;
  brand: { id: string; slug: string; name: string; countryCode: string | null };
  category: { id: string; slug: string; name: string };
  concentration: { id: string; slug: string; name: string; abbreviation: string | null } | null;
  images: { url: string; alt: string; width: number | null; height: number | null; isPrimary: boolean; position: number }[];
  variants: VariantRow[];
  families: {
    isPrimary: boolean;
    family: { id: string; slug: string; name: string; colorHex: string | null };
  }[];
  notes?: {
    position: "TOP" | "HEART" | "BASE";
    sortOrder: number;
    note: { id: string; slug: string; name: string };
  }[];
  collections?: { collection: { id: string; slug: string; name: string } }[];
}

export interface RatingAggregate {
  average: number | null;
  count: number;
}

function availableStockOf(variant: VariantRow): number {
  if (!variant.inventory) return 0;
  return Math.max(0, variant.inventory.onHand - variant.inventory.reserved);
}

export function mapVariant(
  variant: VariantRow,
  product: Pick<ProductRow, "productionLeadTimeDays">,
  settings: StoreSettings
): ProductVariant {
  const availableStock = availableStockOf(variant);
  const variantInput = {
    availabilityType: variant.availabilityType,
    allowBackorder: variant.allowBackorder,
    productionLeadTimeDays: variant.productionLeadTimeDays,
  };
  const productInput = { productionLeadTimeDays: product.productionLeadTimeDays };
  const settingsInput = {
    defaultProductionLeadTimeDays: settings.defaultProductionLeadTimeDays,
    lowStockThreshold: variant.inventory?.lowStockThreshold ?? settings.lowStockThreshold,
  };

  const single = resolveAvailability({ variant: variantInput, requestedQty: 1, availableStock });

  return {
    id: variant.id,
    sku: variant.sku,
    volumeMl: variant.volumeMl,
    priceCents: variant.priceCents,
    compareAtPriceCents: variant.compareAtPriceCents,
    availableStock,
    availability: resolveAvailabilityDisplay({
      variant: variantInput,
      availableStock,
      product: productInput,
      settings: settingsInput,
    }),
    purchasable: single.sellable,
    maxQuantity: single.maxSellableQty,
    weightGrams: variant.weightGrams,
    ean: variant.ean,
  };
}

function activeVariants(row: ProductRow): VariantRow[] {
  return row.variants.filter((v) => v.isActive).sort((a, b) => a.position - b.position);
}

function primaryImage(row: ProductRow) {
  const images = [...row.images].sort((a, b) => a.position - b.position);
  const primary = images.find((image) => image.isPrimary) ?? images[0];
  return primary
    ? { url: primary.url, alt: primary.alt, width: primary.width, height: primary.height }
    : null;
}

export function mapProductSummary(
  row: ProductRow,
  settings: StoreSettings,
  rating: RatingAggregate = { average: null, count: 0 }
): ProductSummary {
  const variants = activeVariants(row).map((variant) => mapVariant(variant, row, settings));
  const defaultVariant = pickDefaultVariant(variants);

  const primaryFamily =
    row.families.find((entry) => entry.isPrimary)?.family ?? row.families[0]?.family ?? null;

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    brand: row.brand,
    category: row.category,
    productType: row.productType,
    shortDescription: row.shortDescription,
    image: primaryImage(row),
    priceFromCents: defaultVariant?.priceCents ?? 0,
    compareAtFromCents: defaultVariant?.compareAtPriceCents ?? null,
    volumesMl: variants.map((v) => v.volumeMl).sort((a, b) => a - b),
    primaryFamily: primaryFamily
      ? {
        id: primaryFamily.id,
        slug: primaryFamily.slug,
        name: primaryFamily.name,
        colorHex: primaryFamily.colorHex,
      }
      : null,
    concentration: row.concentration,
    gender: row.gender,
    // Falls back to an unavailable state rather than pretending: a product with
    // no active variant cannot be bought.
    availability: defaultVariant?.availability ?? { kind: "OUT_OF_STOCK" },
    purchasable: variants.some((v) => v.purchasable),
    isNew: row.isNew,
    isBestSeller: row.isBestSeller,
    isFeatured: row.isFeatured,
    rating: rating.average,
    reviewCount: rating.count,
  };
}

function buildPyramid(row: ProductRow): OlfactoryPyramid {
  const byPosition = (position: "TOP" | "HEART" | "BASE"): FragranceNoteRef[] =>
    (row.notes ?? [])
      .filter((entry) => entry.position === position)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((entry) => entry.note);

  return { top: byPosition("TOP"), heart: byPosition("HEART"), base: byPosition("BASE") };
}

export function mapProductDetail(
  row: ProductRow,
  settings: StoreSettings,
  rating: RatingAggregate = { average: null, count: 0 }
): ProductDetail {
  const summary = mapProductSummary(row, settings, rating);
  const variants = activeVariants(row).map((variant) => mapVariant(variant, row, settings));

  // Only products that actually declare a reference get the block, and the
  // disclaimer always travels with it.
  const hasReference =
    row.inspiredBy !== null || row.referenceBrand !== null || row.referenceFragrance !== null;

  return {
    ...summary,
    description: row.description,
    images: [...row.images]
      .sort((a, b) => a.position - b.position)
      .map((image) => ({
        url: image.url,
        alt: image.alt,
        width: image.width,
        height: image.height,
      })),
    variants,
    families: row.families
      .slice()
      .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary))
      .map((entry) => entry.family),
    pyramid: buildPyramid(row),
    occasions: row.occasions as ProductDetail["occasions"],
    seasons: row.seasons as ProductDetail["seasons"],
    countryOfOrigin: row.countryOfOrigin,
    longevity: row.longevity,
    projection: row.projection,
    reference: hasReference
      ? {
        inspiredBy: row.inspiredBy,
        referenceBrand: row.referenceBrand,
        referenceFragrance: row.referenceFragrance,
        disclaimer: renderContratipoDisclaimer(
          row.disclaimerOverride ?? settings.contratipoDisclaimer,
          row.referenceBrand,
          row.referenceFragrance
        ),
      }
      : null,
    collections: (row.collections ?? []).map((entry) => entry.collection),
    tags: row.tags,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDesc,
  };
}

/** Resolved production lead time for one variant, for the delivery promise. */
export function variantLeadTime(
  variant: Pick<VariantRow, "productionLeadTimeDays">,
  product: Pick<ProductRow, "productionLeadTimeDays">,
  settings: StoreSettings
): number {
  return resolveProductionLeadTime(variant, product, {
    defaultProductionLeadTimeDays: settings.defaultProductionLeadTimeDays,
  });
}
