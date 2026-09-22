import { prisma } from "@/server/db/client";
import { getStoreSettings } from "@/server/services/settings/store-settings";
import { mapProductDetail, mapProductSummary, type ProductRow } from "./mappers";
import type { Category, ProductDetail, ProductSummary } from "@/lib/types";

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
  brandSlug?: string;
  familySlug?: string;
  productType?: "CONTRATIPO" | "IMPORTADO" | "NICHO" | "OUTRO";
  concentrationSlug?: string;
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
function buildWhere(filters: ListProductsFilters) {
  const AND: Record<string, unknown>[] = [publishedWhere];

  if (filters.categorySlug) AND.push({ category: { slug: filters.categorySlug } });
  if (filters.brandSlug) AND.push({ brand: { slug: filters.brandSlug } });
  if (filters.productType) AND.push({ productType: filters.productType });
  if (filters.concentrationSlug) AND.push({ concentration: { slug: filters.concentrationSlug } });
  if (filters.familySlug) {
    AND.push({ families: { some: { family: { slug: filters.familySlug } } } });
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
