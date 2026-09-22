import { prisma } from "@/server/db/client";
import { getStoreSettings } from "@/server/services/settings/store-settings";
import { mapProductDetail, mapProductSummary, mapVariant, type ProductRow } from "./mappers";
import type { Category, ProductDetail, ProductSummary, ProductVariant } from "@/lib/types";

/**
 * Read side of the catalogue.
 *
 * Every function returns DTOs (see mappers.ts), never a raw Prisma row. Pages
 * call these directly — there is no HTTP hop for a Server Component reading its
 * own database.
 */

const productInclude = {
  brand: { select: { id: true, slug: true, name: true, countryCode: true } },
  category: { select: { id: true, slug: true, name: true } },
  concentration: { select: { id: true, slug: true, name: true, abbreviation: true } },
  images: {
    select: { url: true, alt: true, width: true, height: true, isPrimary: true, position: true },
  },
  variants: {
    include: {
      inventory: { select: { onHand: true, reserved: true, lowStockThreshold: true } },
    },
  },
  families: {
    include: {
      family: { select: { id: true, slug: true, name: true, colorHex: true } },
    },
  },
} as const;

const productDetailInclude = {
  ...productInclude,
  notes: {
    include: { note: { select: { id: true, slug: true, name: true } } },
  },
  collections: {
    include: { collection: { select: { id: true, slug: true, name: true } } },
  },
} as const;

/** Published only: draft and archived products are never shown in the store. */
const publishedWhere = { status: "ACTIVE" as const };

async function ratingsFor(productIds: string[]): Promise<Map<string, { average: number; count: number }>> {
  if (productIds.length === 0) return new Map();

  const groups = await prisma.review.groupBy({
    by: ["productId"],
    where: { productId: { in: productIds }, status: "APPROVED" },
    _avg: { rating: true },
    _count: { rating: true },
  });

  return new Map(
    groups
      .filter((g) => g._avg.rating !== null)
      .map((g) => [g.productId, { average: g._avg.rating as number, count: g._count.rating }])
  );
}

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  const [row, settings] = await Promise.all([
    prisma.product.findFirst({
      where: { slug, ...publishedWhere },
      include: productDetailInclude,
    }),
    getStoreSettings(),
  ]);

  if (!row) return null;

  const ratings = await ratingsFor([row.id]);
  return mapProductDetail(row as unknown as ProductRow, settings, ratings.get(row.id) ?? {
    average: null,
    count: 0,
  });
}

export interface ListProductsFilters {
  categorySlug?: string;
  /** Single-brand filter, kept for callers that only ever need one (e.g. a brand page). */
  brandSlug?: string;
  /** Multi-select brand facet. Merged with `brandSlug` if both are given. */
  brandSlugs?: string[];
  /** Single-family filter, kept for callers that only ever need one. */
  familySlug?: string;
  /** Multi-select fragrance family facet. Merged with `familySlug` if both are given. */
  familySlugs?: string[];
  productType?: "CONTRATIPO" | "IMPORTADO" | "NICHO" | "OUTRO";
  productTypes?: ("CONTRATIPO" | "IMPORTADO" | "NICHO" | "OUTRO")[];
  /** Single-concentration filter, kept for callers that only ever need one. */
  concentrationSlug?: string;
  /** Multi-select concentration facet. Merged with `concentrationSlug` if both are given. */
  concentrationSlugs?: string[];
  genders?: ("MASCULINO" | "FEMININO" | "UNISSEX")[];
  /** Sellable volumes (ml). A product qualifies if any active variant matches. */
  volumesMl?: number[];
  /** "READY_STOCK" surfaces purchasable-now variants; "MADE_TO_ORDER" surfaces the rest. */
  availability?: "READY_STOCK" | "MADE_TO_ORDER";
  collectionSlug?: string;
  minPriceCents?: number;
  maxPriceCents?: number;
  /** Full-text-ish search across name, brand, SKU, notes and reference fragrance. */
  search?: string;
}

export type ListProductsSort =
  | "featured"
  | "newest"
  | "price-asc"
  | "price-desc"
  | "best-selling"
  | "top-rated";

export interface ListProductsInput {
  filters?: ListProductsFilters;
  sort?: ListProductsSort;
  page?: number;
  pageSize?: number;
}

export interface ListProductsResult {
  items: ProductSummary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Builds the Prisma `where` for the catalogue list.
 *
 * Price and availability filters run against the variant relation with `some`,
 * which is correct here: a product qualifies if *any* of its volumes match, not
 * only its cheapest one.
 */
/** Merges a single-value filter with its multi-value sibling into one de-duplicated list. */
function mergeValues<T>(single: T | undefined, many: T[] | undefined): T[] {
  const values = new Set<T>(many ?? []);
  if (single !== undefined) values.add(single);
  return [...values];
}

function buildWhere(filters: ListProductsFilters) {
  const AND: Record<string, unknown>[] = [publishedWhere];

  if (filters.categorySlug) AND.push({ category: { slug: filters.categorySlug } });

  const brandSlugs = mergeValues(filters.brandSlug, filters.brandSlugs);
  if (brandSlugs.length > 0) AND.push({ brand: { slug: { in: brandSlugs } } });

  const productTypes = mergeValues(filters.productType, filters.productTypes);
  if (productTypes.length > 0) AND.push({ productType: { in: productTypes } });

  const concentrationSlugs = mergeValues(filters.concentrationSlug, filters.concentrationSlugs);
  if (concentrationSlugs.length > 0) {
    AND.push({ concentration: { slug: { in: concentrationSlugs } } });
  }

  const familySlugs = mergeValues(filters.familySlug, filters.familySlugs);
  if (familySlugs.length > 0) {
    AND.push({ families: { some: { family: { slug: { in: familySlugs } } } } });
  }

  if (filters.genders && filters.genders.length > 0) {
    AND.push({ gender: { in: filters.genders } });
  }

  if (filters.volumesMl && filters.volumesMl.length > 0) {
    AND.push({ variants: { some: { isActive: true, volumeMl: { in: filters.volumesMl } } } });
  }

  if (filters.collectionSlug) {
    AND.push({ collections: { some: { collection: { slug: filters.collectionSlug } } } });
  }

  if (filters.availability === "READY_STOCK") {
    AND.push({ variants: { some: { isActive: true, availabilityType: "READY_STOCK" } } });
  } else if (filters.availability === "MADE_TO_ORDER") {
    AND.push({
      variants: {
        some: {
          isActive: true,
          OR: [{ availabilityType: "MADE_TO_ORDER" }, { allowBackorder: true }],
        },
      },
    });
  }

  if (filters.minPriceCents !== undefined || filters.maxPriceCents !== undefined) {
    AND.push({
      variants: {
        some: {
          isActive: true,
          priceCents: {
            ...(filters.minPriceCents !== undefined ? { gte: filters.minPriceCents } : {}),
            ...(filters.maxPriceCents !== undefined ? { lte: filters.maxPriceCents } : {}),
          },
        },
      },
    });
  }

  if (filters.search) {
    const q = filters.search.trim();
    if (q) {
      AND.push({
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { shortDescription: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { referenceFragrance: { contains: q, mode: "insensitive" } },
          { referenceBrand: { contains: q, mode: "insensitive" } },
          { inspiredBy: { contains: q, mode: "insensitive" } },
          { brand: { name: { contains: q, mode: "insensitive" } } },
          { variants: { some: { sku: { contains: q, mode: "insensitive" } } } },
          { notes: { some: { note: { name: { contains: q, mode: "insensitive" } } } } },
          { families: { some: { family: { name: { contains: q, mode: "insensitive" } } } } },
        ],
      });
    }
  }

  return { AND };
}

function orderByFor(sort: ListProductsSort) {
  switch (sort) {
    case "newest":
      return { publishedAt: "desc" as const };
    case "price-asc":
    case "price-desc":
      // Price lives on the variant; sorted in memory after mapping, since the
      // "from" price is a derived minimum, not a column.
      return { createdAt: "desc" as const };
    case "best-selling":
      return { isBestSeller: "desc" as const };
    case "top-rated":
      return { createdAt: "desc" as const };
    case "featured":
    default:
      return [{ isFeatured: "desc" as const }, { createdAt: "desc" as const }];
  }
}

export async function listProducts(input: ListProductsInput = {}): Promise<ListProductsResult> {
  const filters = input.filters ?? {};
  const sort = input.sort ?? "featured";
  const page = Math.max(1, input.page ?? 1);
  const pageSize = Math.min(60, Math.max(1, input.pageSize ?? 12));

  const where = buildWhere(filters);
  const settings = await getStoreSettings();

  // Sorting by derived price/rating happens after mapping, so we page in
  // memory for those two sorts. The catalogue is small enough (dozens to a few
  // hundred SKUs) for this to be fine; it can move to a materialised "minimum
  // price" column if the catalogue grows into the thousands.
  const needsInMemorySort = sort === "price-asc" || sort === "price-desc" || sort === "top-rated";

  if (!needsInMemorySort) {
    const [rows, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: productInclude,
        orderBy: orderByFor(sort),
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.product.count({ where }),
    ]);

    const ratings = await ratingsFor(rows.map((r) => r.id));
    const items = rows.map((row) =>
      mapProductSummary(row as unknown as ProductRow, settings, ratings.get(row.id) ?? { average: null, count: 0 })
    );

    return { items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
  }

  const rows = await prisma.product.findMany({ where, include: productInclude });
  const ratings = await ratingsFor(rows.map((r) => r.id));
  const mapped = rows.map((row) =>
    mapProductSummary(row as unknown as ProductRow, settings, ratings.get(row.id) ?? { average: null, count: 0 })
  );

  mapped.sort((a, b) => {
    if (sort === "price-asc") return a.priceFromCents - b.priceFromCents;
    if (sort === "price-desc") return b.priceFromCents - a.priceFromCents;
    // top-rated: unrated products sink to the bottom rather than being
    // treated as a rating of zero.
    return (b.rating ?? -1) - (a.rating ?? -1);
  });

  const total = mapped.length;
  const start = (page - 1) * pageSize;
  return {
    items: mapped.slice(start, start + pageSize),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getRelatedProducts(product: ProductDetail, count = 4): Promise<ProductSummary[]> {
  const result = await listProducts({
    filters: { categorySlug: product.category.slug },
    pageSize: count + 1,
  });
  return result.items.filter((item) => item.id !== product.id).slice(0, count);
}

export async function listCategories(): Promise<Category[]> {
  const [categories, counts] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { position: "asc" },
      select: { id: true, slug: true, name: true, description: true, imageUrl: true },
    }),
    prisma.product.groupBy({ by: ["categoryId"], where: publishedWhere, _count: true }),
  ]);

  const countByCategory = new Map(counts.map((c) => [c.categoryId, c._count]));

  return categories.map((category) => ({
    ...category,
    productCount: countByCategory.get(category.id) ?? 0,
  }));
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const category = await prisma.category.findFirst({
    where: { slug, isActive: true },
    select: { id: true, slug: true, name: true, description: true, imageUrl: true },
  });
  if (!category) return null;

  const count = await prisma.product.count({
    where: { ...publishedWhere, categoryId: category.id },
  });

  return { ...category, productCount: count };
}

export async function listBrands() {
  return prisma.brand.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, slug: true, name: true, countryCode: true },
  });
}

export async function listFragranceFamilies() {
  return prisma.fragranceFamily.findMany({
    where: { isActive: true, parentId: null },
    orderBy: { position: "asc" },
    select: { id: true, slug: true, name: true, colorHex: true },
  });
}

export async function listConcentrations() {
  return prisma.concentration.findMany({
    where: { isActive: true },
    orderBy: { position: "asc" },
    select: { id: true, slug: true, name: true, abbreviation: true },
  });
}

/** Distinct volumes across the published catalogue, for the volume filter. */
export async function listAvailableVolumes(): Promise<number[]> {
  const rows = await prisma.productVariant.findMany({
    where: { isActive: true, product: publishedWhere },
    select: { volumeMl: true },
    distinct: ["volumeMl"],
    orderBy: { volumeMl: "asc" },
  });
  return rows.map((r) => r.volumeMl);
}

export interface VariantWithProductRef {
  variant: ProductVariant;
  productId: string;
  productSlug: string;
  productName: string;
}

/**
 * Resolves current, authoritative availability for a client-held list of
 * variant ids.
 *
 * Mirrors the /api/products/by-ids pattern: the cart is client-side
 * (localStorage) and only ever holds ids, never trusts a snapshotted
 * availability or lead time. This is the one place those ids are turned back
 * into a live `AvailabilityDisplay`, so a "mixed cart" notice always reflects
 * what is true right now, not what was true when the line was added.
 */
export async function getVariantsByIds(variantIds: string[]): Promise<VariantWithProductRef[]> {
  if (variantIds.length === 0) return [];

  const [rows, settings] = await Promise.all([
    prisma.productVariant.findMany({
      where: { id: { in: variantIds }, isActive: true, product: publishedWhere },
      include: {
        inventory: { select: { onHand: true, reserved: true, lowStockThreshold: true } },
        product: { select: { id: true, slug: true, name: true, productionLeadTimeDays: true } },
      },
    }),
    getStoreSettings(),
  ]);

  return rows.map((row) => ({
    variant: mapVariant(row, { productionLeadTimeDays: row.product.productionLeadTimeDays }, settings),
    productId: row.product.id,
    productSlug: row.product.slug,
    productName: row.product.name,
  }));
}

/** Cheapest and priciest active variant across the published catalogue, for the price slider's bounds. */
export async function getPriceBounds(): Promise<{ min: number; max: number }> {
  const result = await prisma.productVariant.aggregate({
    where: { isActive: true, product: publishedWhere },
    _min: { priceCents: true },
    _max: { priceCents: true },
  });
  return { min: result._min.priceCents ?? 0, max: result._max.priceCents ?? 0 };
}
