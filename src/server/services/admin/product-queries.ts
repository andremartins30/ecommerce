import { prisma } from "@/server/db/client";
import { productDetailInclude } from "@/server/services/catalog/queries";
import { toReais } from "@/server/domain/pricing/money";
import type { Cents } from "@/server/domain/pricing/money";
import type { ProductFormValues } from "@/server/services/admin/product-schema";

/**
 * Read side for the admin product screens.
 *
 * Deliberately separate from src/server/services/catalog/queries.ts: the
 * storefront only ever needs `status: ACTIVE` products and already-resolved
 * availability/pricing DTOs, while the admin needs every status (drafts and
 * archived products must stay editable) and the raw, editable columns
 * (priceCents as reais, costPriceCents, etc) rather than resolved decisions.
 */

export interface AdminProductListItem {
  id: string;
  slug: string;
  name: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  brandName: string;
  categoryName: string;
  primaryImageUrl: string | null;
  variantCount: number;
  priceFromCents: number;
  totalOnHand: number;
  updatedAt: string;
}

export async function listProductsForAdmin(): Promise<AdminProductListItem[]> {
  const rows = await prisma.product.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      brand: { select: { name: true } },
      category: { select: { name: true } },
      images: { select: { url: true, isPrimary: true, position: true } },
      variants: {
        select: { priceCents: true, inventory: { select: { onHand: true } } },
      },
    },
  });

  return rows.map((row) => {
    const primary = [...row.images].sort((a, b) => a.position - b.position).find((i) => i.isPrimary) ??
      row.images[0];
    const prices = row.variants.map((v) => v.priceCents);
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      status: row.status,
      brandName: row.brand.name,
      categoryName: row.category.name,
      primaryImageUrl: primary?.url ?? null,
      variantCount: row.variants.length,
      priceFromCents: prices.length > 0 ? Math.min(...prices) : 0,
      totalOnHand: row.variants.reduce((sum, v) => sum + (v.inventory?.onHand ?? 0), 0),
      updatedAt: row.updatedAt.toISOString(),
    };
  });
}

/** Fetches every option list the product form's selects need, in parallel. */
export async function getProductFormOptions() {
  const [brands, categories, concentrations, families, notes, collections] = await Promise.all([
    prisma.brand.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, slug: true, name: true } }),
    prisma.category.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, slug: true, name: true } }),
    prisma.concentration.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, slug: true, name: true } }),
    prisma.fragranceFamily.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, slug: true, name: true } }),
    prisma.fragranceNote.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, slug: true, name: true } }),
    prisma.collection.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, slug: true, name: true } }),
  ]);

  return { brands, categories, concentrations, families, notes, collections };
}

/**
 * Loads a product exactly as the form needs it: reais instead of cents (the
 * schema converts back at submit time), nullable fields as `null` rather than
 * `undefined` (Prisma's own shape), and no availability/price resolution —
 * that belongs to the storefront's mappers, not the editor.
 */
export async function getProductByIdForAdmin(id: string): Promise<ProductFormValues | null> {
  const row = await prisma.product.findUnique({
    where: { id },
    include: productDetailInclude,
  });
  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    status: row.status,
    productType: row.productType,
    brandId: row.brandId,
    categoryId: row.categoryId,
    concentrationId: row.concentrationId,
    shortDescription: row.shortDescription,
    description: row.description,
    gender: row.gender,
    occasions: row.occasions,
    seasons: row.seasons,
    countryOfOrigin: row.countryOfOrigin,
    longevity: row.longevity,
    projection: row.projection,
    inspiredBy: row.inspiredBy,
    referenceBrand: row.referenceBrand,
    referenceFragrance: row.referenceFragrance,
    disclaimerOverride: row.disclaimerOverride,
    productionLeadTimeDays: row.productionLeadTimeDays,
    isFeatured: row.isFeatured,
    isBestSeller: row.isBestSeller,
    isNew: row.isNew,
    tags: row.tags,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDesc,
    images: [...row.images]
      .sort((a, b) => a.position - b.position)
      .map((image) => ({ url: image.url, alt: image.alt, isPrimary: image.isPrimary })),
    families: row.families.map((entry) => ({ familyId: entry.familyId, isPrimary: entry.isPrimary })),
    notes: row.notes.map((entry) => ({
      noteId: entry.noteId,
      position: entry.position,
      sortOrder: entry.sortOrder,
    })),
    collections: row.collections.map((entry) => ({ collectionId: entry.collectionId })),
    variants: [...row.variants]
      .sort((a, b) => a.position - b.position)
      .map((variant) => ({
        id: variant.id,
        sku: variant.sku,
        volumeMl: variant.volumeMl,
        priceReais: toReais(variant.priceCents as Cents),
        compareAtPriceReais:
          variant.compareAtPriceCents === null ? null : toReais(variant.compareAtPriceCents as Cents),
        weightGrams: variant.weightGrams,
        lengthMm: variant.lengthMm,
        widthMm: variant.widthMm,
        heightMm: variant.heightMm,
        availabilityType: variant.availabilityType,
        allowBackorder: variant.allowBackorder,
        productionLeadTimeDays: variant.productionLeadTimeDays,
        ean: variant.ean,
        batchCode: variant.batchCode,
        initialOnHand: variant.inventory?.onHand ?? 0,
        isActive: variant.isActive,
      })),
  };
}
