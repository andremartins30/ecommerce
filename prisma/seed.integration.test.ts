import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "../tests/setup/db";
import { seed } from "./seed";
import {
  resolveAvailability,
  resolveAvailabilityDisplay,
  resolveProductionLeadTime,
} from "../src/server/domain/availability/availability";

/**
 * The seed is development infrastructure, so it gets tested like anything else:
 * it must be safe to run twice, and the catalogue it produces must exercise
 * every availability state the storefront has to render.
 */

let firstRun: Awaited<ReturnType<typeof seed>>;

beforeAll(async () => {
  firstRun = await seed(prisma);
}, 120_000);

afterAll(async () => {
  await prisma.$disconnect();
});

describe("idempotency", () => {
  it("produces the same counts when run twice", async () => {
    const before = {
      products: await prisma.product.count(),
      variants: await prisma.productVariant.count(),
      families: await prisma.fragranceFamily.count(),
      notes: await prisma.fragranceNote.count(),
      settings: await prisma.systemSetting.count(),
      roles: await prisma.role.count(),
      permissions: await prisma.permission.count(),
      inventories: await prisma.inventory.count(),
      images: await prisma.productImage.count(),
      pyramidRows: await prisma.productFragranceNote.count(),
    };

    const secondRun = await seed(prisma);

    const after = {
      products: await prisma.product.count(),
      variants: await prisma.productVariant.count(),
      families: await prisma.fragranceFamily.count(),
      notes: await prisma.fragranceNote.count(),
      settings: await prisma.systemSetting.count(),
      roles: await prisma.role.count(),
      permissions: await prisma.permission.count(),
      inventories: await prisma.inventory.count(),
      images: await prisma.productImage.count(),
      pyramidRows: await prisma.productFragranceNote.count(),
    };

    expect(after).toEqual(before);
    expect(secondRun).toEqual(firstRun);
  }, 120_000);

  it("does not reset stock that has moved since the first run", async () => {
    const variant = await prisma.productVariant.findFirstOrThrow({
      where: { product: { slug: "imperium" }, volumeMl: 30 },
      include: { inventory: true },
    });

    // Simulate a real sale.
    await prisma.inventory.update({
      where: { variantId: variant.id },
      data: { onHand: 1 },
    });

    await seed(prisma);

    const after = await prisma.inventory.findUniqueOrThrow({ where: { variantId: variant.id } });
    // Re-seeding must never overwrite real counts, or a demo run would corrupt
    // live inventory.
    expect(after.onHand).toBe(1);

    await prisma.inventory.update({ where: { variantId: variant.id }, data: { onHand: 7 } });
  }, 120_000);

  it("does not overwrite a setting the operator has changed", async () => {
    await prisma.systemSetting.update({
      where: { key: "production.defaultLeadTimeDays" },
      data: { value: "21" },
    });

    await seed(prisma);

    const setting = await prisma.systemSetting.findUniqueOrThrow({
      where: { key: "production.defaultLeadTimeDays" },
    });
    expect(setting.value).toBe("21");

    await prisma.systemSetting.update({
      where: { key: "production.defaultLeadTimeDays" },
      data: { value: "15" },
    });
  }, 120_000);
});

describe("catalogue coverage", () => {
  it("includes every availability type", async () => {
    const types = await prisma.productVariant.groupBy({
      by: ["availabilityType"],
      _count: true,
    });
    const present = types.map((t) => t.availabilityType).sort();

    expect(present).toEqual(["DISCONTINUED", "MADE_TO_ORDER", "OUT_OF_STOCK", "READY_STOCK"]);
  });

  it("includes every product type", async () => {
    const types = await prisma.product.groupBy({ by: ["productType"], _count: true });
    expect(types.map((t) => t.productType).sort()).toEqual([
      "CONTRATIPO",
      "IMPORTADO",
      "NICHO",
      "OUTRO",
    ]);
  });

  it("has a product whose volumes differ in availability", async () => {
    // The specification's own example: 30 ml in stock, 50 ml made to order,
    // 100 ml nearly gone.
    const product = await prisma.product.findUniqueOrThrow({
      where: { slug: "imperium" },
      include: { variants: { include: { inventory: true }, orderBy: { volumeMl: "asc" } } },
    });

    expect(product.variants).toHaveLength(3);
    const byVolume = new Map(product.variants.map((v) => [v.volumeMl, v]));

    expect(byVolume.get(30)!.availabilityType).toBe("READY_STOCK");
    expect(byVolume.get(30)!.inventory!.onHand).toBe(7);
    expect(byVolume.get(50)!.availabilityType).toBe("MADE_TO_ORDER");
    expect(byVolume.get(50)!.inventory!.onHand).toBe(0);
    expect(byVolume.get(100)!.availabilityType).toBe("READY_STOCK");
    expect(byVolume.get(100)!.inventory!.onHand).toBe(2);

    // Each volume has its own SKU and its own price.
    const skus = product.variants.map((v) => v.sku);
    expect(new Set(skus).size).toBe(3);
    const prices = product.variants.map((v) => v.priceCents);
    expect(new Set(prices).size).toBe(3);
  });

  it("has a hybrid variant that ships from stock and then produces", async () => {
    const variant = await prisma.productVariant.findFirstOrThrow({
      where: { product: { slug: "jardim-suspenso" } },
      include: { inventory: true },
    });

    expect(variant.availabilityType).toBe("READY_STOCK");
    expect(variant.allowBackorder).toBe(true);
    expect(variant.inventory!.onHand).toBe(3);

    // Buying four units splits three from stock and one into production.
    const resolution = resolveAvailability({
      variant: {
        availabilityType: variant.availabilityType,
        allowBackorder: variant.allowBackorder,
        productionLeadTimeDays: variant.productionLeadTimeDays,
      },
      requestedQty: 4,
      availableStock: variant.inventory!.onHand - variant.inventory!.reserved,
    });

    expect(resolution.qtyFromStock).toBe(3);
    expect(resolution.qtyBackordered).toBe(1);
  });

  it("keeps a discontinued variant unsellable even with stock on the shelf", async () => {
    const variant = await prisma.productVariant.findFirstOrThrow({
      where: { product: { slug: "heranca-1998" } },
      include: { inventory: true },
    });

    expect(variant.inventory!.onHand).toBe(1);

    const resolution = resolveAvailability({
      variant: {
        availabilityType: variant.availabilityType,
        allowBackorder: variant.allowBackorder,
        productionLeadTimeDays: variant.productionLeadTimeDays,
      },
      requestedQty: 1,
      availableStock: variant.inventory!.onHand,
    });

    expect(resolution.sellable).toBe(false);
    expect(resolution.reason).toBe("DISCONTINUED");
  });

  it("exercises all three levels of the lead time chain", async () => {
    const settings = await prisma.systemSetting.findUniqueOrThrow({
      where: { key: "production.defaultLeadTimeDays" },
    });
    const storeDefault = Number(settings.value);
    expect(storeDefault).toBe(15);

    // Level 1: the variant sets its own.
    const variantLevel = await prisma.productVariant.findFirstOrThrow({
      where: { product: { slug: "imperium" }, volumeMl: 50 },
      include: { product: true },
    });
    expect(variantLevel.productionLeadTimeDays).toBe(15);

    // Level 2: the product sets it, the variant inherits.
    const productLevel = await prisma.productVariant.findFirstOrThrow({
      where: { product: { slug: "ambar-sacro" } },
      include: { product: true },
    });
    expect(productLevel.productionLeadTimeDays).toBeNull();
    expect(productLevel.product.productionLeadTimeDays).toBe(20);
    expect(
      resolveProductionLeadTime(productLevel, productLevel.product, {
        defaultProductionLeadTimeDays: storeDefault,
      })
    ).toBe(20);

    // Level 3: neither sets it, so the store default applies.
    const storeLevel = await prisma.productVariant.findFirstOrThrow({
      where: { product: { slug: "solaris" } },
      include: { product: true },
    });
    expect(storeLevel.productionLeadTimeDays).toBeNull();
    expect(
      resolveProductionLeadTime(storeLevel, { productionLeadTimeDays: null }, {
        defaultProductionLeadTimeDays: storeDefault,
      })
    ).toBe(15);
  });

  it("produces a renderable availability display for every variant", async () => {
    const variants = await prisma.productVariant.findMany({
      include: { inventory: true, product: true },
    });

    expect(variants.length).toBeGreaterThan(0);

    for (const variant of variants) {
      expect(variant.inventory, `variant ${variant.sku} has no inventory row`).not.toBeNull();

      const display = resolveAvailabilityDisplay({
        variant: {
          availabilityType: variant.availabilityType,
          allowBackorder: variant.allowBackorder,
          productionLeadTimeDays: variant.productionLeadTimeDays,
        },
        availableStock: variant.inventory!.onHand - variant.inventory!.reserved,
        product: { productionLeadTimeDays: variant.product.productionLeadTimeDays },
        settings: { defaultProductionLeadTimeDays: 15 },
      });

      expect(display.kind).toBeTruthy();
    }
  });
});

describe("perfumery domain data", () => {
  it("models the olfactory pyramid with all three positions", async () => {
    const notes = await prisma.productFragranceNote.findMany({
      where: { product: { slug: "imperium" } },
    });

    const positions = new Set(notes.map((n) => n.position));
    expect(positions).toEqual(new Set(["TOP", "HEART", "BASE"]));
  });

  it("allows a note to appear in two positions of the same fragrance", async () => {
    const notes = await prisma.productFragranceNote.findMany({
      where: { product: { slug: "jardim-suspenso" }, note: { slug: "iris" } },
    });

    expect(notes).toHaveLength(2);
    expect(notes.map((n) => n.position).sort()).toEqual(["BASE", "HEART"]);
  });

  it("gives every product exactly one primary olfactory family", async () => {
    const products = await prisma.product.findMany({ include: { families: true } });

    for (const product of products) {
      const primaries = product.families.filter((f) => f.isPrimary);
      expect(primaries, `${product.slug} should have one primary family`).toHaveLength(1);
    }
  });

  it("includes the 13 top-level olfactory families plus subfamilies", async () => {
    const roots = await prisma.fragranceFamily.count({ where: { parentId: null } });
    const children = await prisma.fragranceFamily.count({ where: { NOT: { parentId: null } } });

    expect(roots).toBe(13);
    expect(children).toBeGreaterThan(0);
  });

  it("keeps the contratipo reference separate from the product identity", async () => {
    const product = await prisma.product.findUniqueOrThrow({
      where: { slug: "imperium" },
      include: { brand: true },
    });

    expect(product.productType).toBe("CONTRATIPO");
    // Commercial name and brand are the store's own.
    expect(product.name).toBe("Imperium");
    expect(product.brand.name).toBe("Atelier Demonstração");
    // The reference lives in dedicated fields and never replaces them.
    expect(product.referenceBrand).toBe("Creed");
    expect(product.referenceFragrance).toBe("Aventus");
    expect(product.name).not.toContain("Creed");
    expect(product.name).not.toContain("Aventus");
  });

  it("stores a configurable contratipo disclaimer", async () => {
    const setting = await prisma.systemSetting.findUniqueOrThrow({
      where: { key: "legal.contratipoDisclaimer" },
    });

    expect(setting.value).toContain("não possui vínculo");
    expect(setting.value).toContain("{{referencia}}");
    expect(setting.group).toBe("legal");
  });

  it("labels every demonstration product as such", async () => {
    const products = await prisma.product.findMany();

    for (const product of products) {
      expect(
        product.description.toLowerCase(),
        `${product.slug} must state that it is demonstration content`
      ).toContain("demonstração");
      expect(product.tags).toContain("demo");
    }
  });

  it("prices every variant in whole cents", async () => {
    const variants = await prisma.productVariant.findMany();

    for (const variant of variants) {
      expect(Number.isInteger(variant.priceCents)).toBe(true);
      expect(variant.priceCents).toBeGreaterThan(0);
      expect(variant.weightGrams).toBeGreaterThan(0);
      expect(variant.lengthMm * variant.widthMm * variant.heightMm).toBeGreaterThan(0);
    }
  });
});

describe("access control data", () => {
  it("creates the eight roles", async () => {
    const roles = await prisma.role.findMany();
    expect(roles.map((r) => r.name).sort()).toEqual([
      "ADMIN",
      "FINANCE",
      "INVENTORY",
      "MARKETING",
      "PRODUCTION",
      "SALES",
      "SUPER_ADMIN",
      "SUPPORT",
    ]);
  });

  it("gives SUPER_ADMIN every permission and INVENTORY only stock ones", async () => {
    const permissionCount = await prisma.permission.count();

    const superAdmin = await prisma.role.findUniqueOrThrow({
      where: { name: "SUPER_ADMIN" },
      include: { permissions: true },
    });
    expect(superAdmin.permissions).toHaveLength(permissionCount);

    const inventory = await prisma.role.findUniqueOrThrow({
      where: { name: "INVENTORY" },
      include: { permissions: { include: { permission: true } } },
    });
    const keys = inventory.permissions.map((p) => p.permission.key);

    expect(keys).toContain("inventory.write");
    // The separation that matters: stock staff cannot move money.
    expect(keys).not.toContain("refund.create");
    expect(keys).not.toContain("settings.write");
  });

  it("withholds user management from ADMIN, reserving it for SUPER_ADMIN", async () => {
    const admin = await prisma.role.findUniqueOrThrow({
      where: { name: "ADMIN" },
      include: { permissions: { include: { permission: true } } },
    });

    expect(admin.permissions.map((p) => p.permission.key)).not.toContain("user.manage");
  });
});
