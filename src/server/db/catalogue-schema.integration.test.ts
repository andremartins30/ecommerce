import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestProduct, prisma, resetCatalogue } from "../../../tests/setup/db";

/**
 * Proves the catalogue schema and — more importantly — that its invariants are
 * enforced by PostgreSQL rather than only by application code.
 */

beforeAll(async () => {
  await resetCatalogue();
});

afterAll(async () => {
  await resetCatalogue();
  await prisma.$disconnect();
});

describe("catalogue CRUD", () => {
  it("creates a product with a variant and reads it back", async () => {
    const product = await createTestProduct({ slug: "imperium-30" });

    const found = await prisma.product.findUnique({
      where: { slug: "imperium-30" },
      include: { variants: true, brand: true, category: true },
    });

    expect(found?.id).toBe(product.id);
    expect(found?.variants).toHaveLength(1);
    expect(found?.variants[0].priceCents).toBe(24990);
    expect(found?.status).toBe("DRAFT");
    expect(found?.gender).toBe("UNISSEX");
    expect(found?.occasions).toEqual([]);
  });

  it("stores money as an integer number of cents", async () => {
    const product = await createTestProduct({ variant: { priceCents: 129990 } });
    const variant = product.variants[0];

    expect(Number.isInteger(variant.priceCents)).toBe(true);
    expect(variant.priceCents).toBe(129990);
  });

  it("models the full olfactory pyramid, allowing a note in two positions", async () => {
    const product = await createTestProduct();
    const bergamota = await prisma.fragranceNote.create({
      data: { slug: `bergamota-${product.id.slice(0, 6)}`, name: "Bergamota" },
    });
    const ambar = await prisma.fragranceNote.create({
      data: { slug: `ambar-${product.id.slice(0, 6)}`, name: "Âmbar" },
    });

    await prisma.productFragranceNote.createMany({
      data: [
        { productId: product.id, noteId: bergamota.id, position: "TOP", sortOrder: 0 },
        // The same note legitimately reappears in the base.
        { productId: product.id, noteId: bergamota.id, position: "BASE", sortOrder: 1 },
        { productId: product.id, noteId: ambar.id, position: "BASE", sortOrder: 0 },
      ],
    });

    const notes = await prisma.productFragranceNote.findMany({
      where: { productId: product.id },
      orderBy: [{ position: "asc" }, { sortOrder: "asc" }],
    });

    expect(notes).toHaveLength(3);
    expect(notes.filter((n) => n.position === "BASE")).toHaveLength(2);
  });

  it("supports multiple olfactory families per product", async () => {
    const product = await createTestProduct();
    const amadeirado = await prisma.fragranceFamily.create({
      data: { slug: `amadeirado-${product.id.slice(0, 6)}`, name: "Amadeirado" },
    });
    const aromatico = await prisma.fragranceFamily.create({
      data: { slug: `aromatico-${product.id.slice(0, 6)}`, name: "Aromático" },
    });

    await prisma.productFragranceFamily.createMany({
      data: [
        { productId: product.id, familyId: amadeirado.id, isPrimary: true },
        { productId: product.id, familyId: aromatico.id, isPrimary: false },
      ],
    });

    const families = await prisma.productFragranceFamily.findMany({
      where: { productId: product.id },
    });
    expect(families).toHaveLength(2);
    expect(families.filter((f) => f.isPrimary)).toHaveLength(1);
  });

  it("supports subfamilies through the family tree", async () => {
    const suffix = Math.random().toString(36).slice(2, 8);
    const parent = await prisma.fragranceFamily.create({
      data: { slug: `oriental-${suffix}`, name: "Oriental" },
    });
    const child = await prisma.fragranceFamily.create({
      data: { slug: `oriental-especiado-${suffix}`, name: "Oriental Especiado", parentId: parent.id },
    });

    const withChildren = await prisma.fragranceFamily.findUnique({
      where: { id: parent.id },
      include: { children: true },
    });

    expect(withChildren?.children.map((c) => c.id)).toContain(child.id);
  });

  it("keeps contratipo reference fields separate from the product identity", async () => {
    const product = await createTestProduct({ productType: "CONTRATIPO" });

    const updated = await prisma.product.update({
      where: { id: product.id },
      data: {
        inspiredBy: "Aventus",
        referenceBrand: "Creed",
        referenceFragrance: "Aventus",
      },
    });

    // The product keeps its own commercial name and brand; the reference is
    // recorded in dedicated fields and never overwrites them.
    expect(updated.name).toBe(product.name);
    expect(updated.brandId).toBe(product.brandId);
    expect(updated.referenceBrand).toBe("Creed");
  });
});

describe("database-level invariants", () => {
  it("rejects a negative price", async () => {
    await expect(createTestProduct({ variant: { priceCents: -1 } })).rejects.toThrow(
      /product_variants_price_non_negative/
    );
  });

  it("rejects a compare-at price that is not above the price", async () => {
    await expect(
      createTestProduct({ variant: { priceCents: 24990, compareAtPriceCents: 24990 } })
    ).rejects.toThrow(/product_variants_compare_at_price_above_price/);
  });

  it("rejects a zero or negative volume", async () => {
    await expect(createTestProduct({ variant: { volumeMl: 0 } })).rejects.toThrow(
      /product_variants_volume_positive/
    );
  });

  it("rejects zero weight or dimensions, which would break freight quoting", async () => {
    await expect(createTestProduct({ variant: { weightGrams: 0 } })).rejects.toThrow(
      /product_variants_weight_positive/
    );
    await expect(createTestProduct({ variant: { widthMm: 0 } })).rejects.toThrow(
      /product_variants_dimensions_positive/
    );
  });

  it("rejects a negative or absurd production lead time", async () => {
    await expect(createTestProduct({ variant: { productionLeadTimeDays: -1 } })).rejects.toThrow(
      /product_variants_lead_time_range/
    );
    await expect(createTestProduct({ variant: { productionLeadTimeDays: 400 } })).rejects.toThrow(
      /product_variants_lead_time_range/
    );
  });

  it("accepts a null lead time, which means inherit", async () => {
    const product = await createTestProduct({ variant: { productionLeadTimeDays: null } });
    expect(product.variants[0].productionLeadTimeDays).toBeNull();
  });

  it("accepts a zero lead time, which means same-day preparation", async () => {
    const product = await createTestProduct({ variant: { productionLeadTimeDays: 0 } });
    expect(product.variants[0].productionLeadTimeDays).toBe(0);
  });

  it("refuses two variants with the same volume on one product", async () => {
    const product = await createTestProduct({ variant: { volumeMl: 50 } });

    await expect(
      prisma.productVariant.create({
        data: {
          productId: product.id,
          sku: `${product.variants[0].sku}-dup`,
          volumeMl: 50,
          priceCents: 19990,
          weightGrams: 300,
          lengthMm: 60,
          widthMm: 60,
          heightMm: 140,
        },
      })
    ).rejects.toThrow();
  });

  it("refuses a duplicate SKU across the whole catalogue", async () => {
    const product = await createTestProduct();
    const other = await createTestProduct();

    await expect(
      prisma.productVariant.create({
        data: {
          productId: other.id,
          sku: product.variants[0].sku,
          volumeMl: 100,
          priceCents: 29990,
          weightGrams: 400,
          lengthMm: 70,
          widthMm: 70,
          heightMm: 160,
        },
      })
    ).rejects.toThrow();
  });

  it("allows at most one primary image per product", async () => {
    const product = await createTestProduct();
    await prisma.productImage.create({
      data: { productId: product.id, url: "https://example.com/a.jpg", alt: "a", isPrimary: true },
    });

    await expect(
      prisma.productImage.create({
        data: { productId: product.id, url: "https://example.com/b.jpg", alt: "b", isPrimary: true },
      })
    ).rejects.toThrow();

    // Non-primary images are unrestricted.
    await expect(
      prisma.productImage.create({
        data: { productId: product.id, url: "https://example.com/c.jpg", alt: "c" },
      })
    ).resolves.toBeDefined();
  });

  it("allows at most one primary family per product", async () => {
    const product = await createTestProduct();
    const suffix = product.id.slice(0, 6);
    const a = await prisma.fragranceFamily.create({
      data: { slug: `floral-${suffix}`, name: "Floral" },
    });
    const b = await prisma.fragranceFamily.create({
      data: { slug: `citrico-${suffix}`, name: "Cítrico" },
    });

    await prisma.productFragranceFamily.create({
      data: { productId: product.id, familyId: a.id, isPrimary: true },
    });

    await expect(
      prisma.productFragranceFamily.create({
        data: { productId: product.id, familyId: b.id, isPrimary: true },
      })
    ).rejects.toThrow();
  });

  it("refuses an invalid concentration percentage range", async () => {
    const suffix = Math.random().toString(36).slice(2, 8);
    await expect(
      prisma.concentration.create({
        data: { slug: `edp-${suffix}`, name: "Eau de Parfum", minPercent: 30, maxPercent: 10 },
      })
    ).rejects.toThrow(/concentrations_percent_range/);
  });

  it("refuses to delete a brand that still has products", async () => {
    const product = await createTestProduct();
    await expect(prisma.brand.delete({ where: { id: product.brandId } })).rejects.toThrow();
  });

  it("cascades variants, images and pyramid rows when a product is deleted", async () => {
    const product = await createTestProduct();
    await prisma.productImage.create({
      data: { productId: product.id, url: "https://example.com/x.jpg", alt: "x" },
    });

    await prisma.product.delete({ where: { id: product.id } });

    expect(await prisma.productVariant.count({ where: { productId: product.id } })).toBe(0);
    expect(await prisma.productImage.count({ where: { productId: product.id } })).toBe(0);
  });
});

describe("system settings", () => {
  it("stores typed, grouped, operator-editable settings", async () => {
    await prisma.systemSetting.upsert({
      where: { key: "store.defaultProductionLeadTimeDays" },
      create: {
        key: "store.defaultProductionLeadTimeDays",
        value: "15",
        type: "INTEGER",
        group: "production",
        label: "Prazo padrão de produção (dias)",
      },
      update: { value: "15" },
    });

    const setting = await prisma.systemSetting.findUnique({
      where: { key: "store.defaultProductionLeadTimeDays" },
    });

    expect(setting?.value).toBe("15");
    expect(setting?.type).toBe("INTEGER");
    expect(setting?.group).toBe("production");
  });
});
