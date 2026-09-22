import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

// Same precedence as Next.js and prisma.config.ts.
dotenv.config({ path: ".env.local", quiet: true });
dotenv.config({ path: ".env", quiet: true });

import { PrismaPg } from "@prisma/adapter-pg";
// Run with tsx, not Node's native type stripping: the generated Prisma client
// uses extensionless relative imports internally, which native ESM resolution
// refuses to resolve.
import { PrismaClient } from "../src/server/db/generated/client";
import {
  BRANDS,
  CATEGORIES,
  COLLECTIONS,
  CONCENTRATIONS,
  COUPONS,
  FRAGRANCE_FAMILIES,
  FRAGRANCE_NOTES,
  PRODUCTS,
  type ProductSeed,
} from "./seed-data";

/**
 * Development seed.
 *
 * Idempotent by construction: everything is keyed by a stable slug or code and
 * written with `upsert`, so running it twice leaves the database in the same
 * state. A seed that duplicates rows on a second run is a seed nobody dares to
 * run.
 *
 * It deliberately does **not** touch orders, customers or payments. Seeding
 * transactional data would make it impossible to tell demonstration history from
 * real history.
 */

/** The slice of the Prisma client the seed needs. */
type Db = PrismaClient;

/**
 * Created only when the seed runs as a script. Tests pass their own client, so
 * importing this module never opens a second connection pool.
 */
function createStandaloneClient(): Db {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local first.");
  }
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

/** Reais to integer cents. Duplicated from the domain module on purpose: the
 *  seed must not import application code that may itself be mid-refactor. */
function toCents(reais: number): number {
  return Math.round(reais * 100);
}

function skuFor(productSlug: string, volumeMl: number): string {
  const prefix = productSlug
    .split("-")
    .map((part) => part.slice(0, 3))
    .join("")
    .toUpperCase()
    .slice(0, 8);
  return `${prefix}-${volumeMl}`;
}

function imageUrl(id: string, width = 1200, height = 1500): string {
  return `https://images.unsplash.com/photo-${id}?q=80&w=${width}&h=${height}&auto=format&fit=crop`;
}

// ---------------------------------------------------------------------------
// Store settings
// ---------------------------------------------------------------------------

interface SettingSeed {
  key: string;
  value: string;
  type: "STRING" | "INTEGER" | "BOOLEAN" | "JSON";
  group: string;
  label: string;
  description?: string;
}

function storeSettings(): SettingSeed[] {
  const env = process.env;

  return [
    // --- Identity: no commercial name is ever hardcoded in the codebase ------
    {
      key: "store.name",
      value: env.STORE_NAME ?? "Perfumaria Demo",
      type: "STRING",
      group: "identity",
      label: "Nome da loja",
    },
    { key: "store.logoUrl", value: env.STORE_LOGO ?? "", type: "STRING", group: "identity", label: "Logotipo" },
    { key: "store.faviconUrl", value: env.STORE_FAVICON ?? "", type: "STRING", group: "identity", label: "Favicon" },
    {
      key: "store.primaryColor",
      value: env.STORE_PRIMARY_COLOR ?? "#1B1B1F",
      type: "STRING",
      group: "identity",
      label: "Cor primária",
    },
    {
      key: "store.email",
      value: env.STORE_EMAIL ?? "contato@example.com",
      type: "STRING",
      group: "identity",
      label: "E-mail de contato",
    },
    { key: "store.phone", value: env.STORE_PHONE ?? "", type: "STRING", group: "identity", label: "Telefone" },
    { key: "store.whatsapp", value: env.STORE_WHATSAPP ?? "", type: "STRING", group: "identity", label: "WhatsApp" },
    { key: "store.cnpj", value: env.STORE_CNPJ ?? "", type: "STRING", group: "identity", label: "CNPJ" },
    { key: "store.address", value: env.STORE_ADDRESS ?? "", type: "STRING", group: "identity", label: "Endereço" },

    // --- Production ---------------------------------------------------------
    {
      key: "production.defaultLeadTimeDays",
      value: "15",
      type: "INTEGER",
      group: "production",
      label: "Prazo padrão de produção (dias)",
      description:
        "Usado quando a variante e o produto não definem um prazo próprio. A ordem de resolução é variante, produto, esta configuração, 15.",
    },
    {
      key: "production.handlingDays",
      value: "1",
      type: "INTEGER",
      group: "production",
      label: "Prazo de preparo (dias úteis)",
      description: "Tempo entre o produto estar pronto e a postagem.",
    },

    // --- Shipping ----------------------------------------------------------
    {
      key: "shipping.policy",
      value: "SINGLE_SHIPMENT",
      type: "STRING",
      group: "shipping",
      label: "Política de envio",
      description:
        "SINGLE_SHIPMENT envia o pedido completo quando todos os itens estiverem disponíveis. SPLIT_SHIPMENT envia em remessas separadas.",
    },
    {
      key: "shipping.freeShippingThresholdCents",
      value: String(toCents(299)),
      type: "INTEGER",
      group: "shipping",
      label: "Frete grátis a partir de (centavos)",
    },
    {
      key: "shipping.flatRateCents",
      value: String(toCents(24.9)),
      type: "INTEGER",
      group: "shipping",
      label: "Frete padrão (centavos)",
    },
    {
      key: "shipping.expressRateCents",
      value: String(toCents(49.9)),
      type: "INTEGER",
      group: "shipping",
      label: "Frete expresso (centavos)",
    },

    // --- Catalogue ---------------------------------------------------------
    {
      key: "catalogue.lowStockThreshold",
      value: "3",
      type: "INTEGER",
      group: "catalogue",
      label: "Limite de estoque baixo",
    },

    // --- Legal -------------------------------------------------------------
    {
      key: "legal.contratipoDisclaimer",
      value:
        "Fragrância inspirada no perfil olfativo de {{referencia}}. Este produto não possui vínculo com a marca mencionada.",
      type: "STRING",
      group: "legal",
      label: "Aviso legal de contratipo",
      description:
        "Exibido em todo produto do tipo contratipo. {{referencia}} é substituído por marca e fragrância de referência. Revise este texto com apoio jurídico.",
    },
    {
      key: "legal.madeToOrderPolicyVersion",
      value: "2026-09-01",
      type: "STRING",
      group: "legal",
      label: "Versão da política de produtos sob encomenda",
    },

    // --- Payment -----------------------------------------------------------
    {
      key: "payment.enabledMethods",
      value: JSON.stringify(["PIX", "CREDIT_CARD", "BOLETO"]),
      type: "JSON",
      group: "payment",
      label: "Métodos de pagamento habilitados",
      description: "Somente métodos realmente suportados pelo provedor ativo devem ser listados.",
    },
    {
      key: "payment.maxInstallments",
      value: "12",
      type: "INTEGER",
      group: "payment",
      label: "Número máximo de parcelas",
    },
  ];
}

// ---------------------------------------------------------------------------
// Seeding steps
// ---------------------------------------------------------------------------

async function seedSettings(db: Db): Promise<number> {
  const settings = storeSettings();
  for (const setting of settings) {
    await db.systemSetting.upsert({
      where: { key: setting.key },
      // An existing value is never overwritten: the operator may already have
      // changed it in the admin panel, and a re-seed must not undo that.
      create: setting,
      update: { label: setting.label, description: setting.description, group: setting.group },
    });
  }
  return settings.length;
}

async function seedTaxonomy(db: Db) {
  for (const concentration of CONCENTRATIONS) {
    await db.concentration.upsert({
      where: { slug: concentration.slug },
      create: concentration,
      update: { name: concentration.name, position: concentration.position },
    });
  }

  // Parents first, then children, so parentSlug can always be resolved.
  for (const family of FRAGRANCE_FAMILIES.filter((f) => !f.parentSlug)) {
    await db.fragranceFamily.upsert({
      where: { slug: family.slug },
      create: { slug: family.slug, name: family.name, colorHex: family.colorHex },
      update: { name: family.name, colorHex: family.colorHex },
    });
  }
  for (const family of FRAGRANCE_FAMILIES.filter((f) => f.parentSlug)) {
    const parent = await db.fragranceFamily.findUniqueOrThrow({
      where: { slug: family.parentSlug! },
    });
    await db.fragranceFamily.upsert({
      where: { slug: family.slug },
      create: { slug: family.slug, name: family.name, parentId: parent.id },
      update: { name: family.name, parentId: parent.id },
    });
  }

  for (const note of FRAGRANCE_NOTES) {
    await db.fragranceNote.upsert({
      where: { slug: note.slug },
      create: note,
      update: { name: note.name },
    });
  }

  for (const brand of BRANDS) {
    await db.brand.upsert({
      where: { slug: brand.slug },
      create: brand,
      update: { name: brand.name, description: brand.description, countryCode: brand.countryCode },
    });
  }

  for (const category of CATEGORIES.filter((c) => !c.parentSlug)) {
    await db.category.upsert({
      where: { slug: category.slug },
      create: {
        slug: category.slug,
        name: category.name,
        description: category.description,
        position: category.position,
      },
      update: { name: category.name, description: category.description, position: category.position },
    });
  }

  for (const collection of COLLECTIONS) {
    await db.collection.upsert({
      where: { slug: collection.slug },
      create: collection,
      update: {
        name: collection.name,
        description: collection.description,
        position: collection.position,
      },
    });
  }

  return {
    concentrations: CONCENTRATIONS.length,
    families: FRAGRANCE_FAMILIES.length,
    notes: FRAGRANCE_NOTES.length,
    brands: BRANDS.length,
    categories: CATEGORIES.length,
    collections: COLLECTIONS.length,
  };
}

async function seedProduct(db: Db, seed: ProductSeed) {
  const [brand, category, concentration] = await Promise.all([
    db.brand.findUniqueOrThrow({ where: { slug: seed.brandSlug } }),
    db.category.findUniqueOrThrow({ where: { slug: seed.categorySlug } }),
    db.concentration.findUniqueOrThrow({ where: { slug: seed.concentrationSlug } }),
  ]);

  const data = {
    name: seed.name,
    status: "ACTIVE" as const,
    productType: seed.productType,
    brandId: brand.id,
    categoryId: category.id,
    concentrationId: concentration.id,
    shortDescription: seed.shortDescription,
    description: seed.description,
    gender: seed.gender,
    occasions: seed.occasions,
    seasons: seed.seasons,
    countryOfOrigin: seed.countryOfOrigin,
    longevity: seed.longevity,
    projection: seed.projection,
    inspiredBy: seed.inspiredBy,
    referenceBrand: seed.referenceBrand,
    referenceFragrance: seed.referenceFragrance,
    productionLeadTimeDays: seed.productionLeadTimeDays ?? null,
    isFeatured: seed.isFeatured ?? false,
    isBestSeller: seed.isBestSeller ?? false,
    isNew: seed.isNew ?? false,
    tags: seed.tags,
    seoTitle: seed.name,
    seoDesc: seed.shortDescription,
    publishedAt: new Date(),
  };

  const product = await db.product.upsert({
    where: { slug: seed.slug },
    create: { slug: seed.slug, ...data },
    update: data,
  });

  // --- Images -------------------------------------------------------------
  // Replaced wholesale: image order and the single primary flag are easier to
  // reason about when rebuilt than when patched.
  await db.productImage.deleteMany({ where: { productId: product.id } });
  await db.productImage.createMany({
    data: seed.imageIds.map((id, index) => ({
      productId: product.id,
      url: imageUrl(id),
      alt: `${seed.name} — foto ${index + 1}`,
      position: index,
      isPrimary: index === 0,
      width: 1200,
      height: 1500,
    })),
  });

  // --- Olfactory families -------------------------------------------------
  await db.productFragranceFamily.deleteMany({ where: { productId: product.id } });
  for (const family of seed.familySlugs) {
    const row = await db.fragranceFamily.findUniqueOrThrow({ where: { slug: family.slug } });
    await db.productFragranceFamily.create({
      data: { productId: product.id, familyId: row.id, isPrimary: family.isPrimary ?? false },
    });
  }

  // --- Olfactory pyramid --------------------------------------------------
  await db.productFragranceNote.deleteMany({ where: { productId: product.id } });
  const seenByPosition = new Map<string, number>();
  for (const note of seed.notes) {
    const row = await db.fragranceNote.findUniqueOrThrow({ where: { slug: note.slug } });
    const orderKey = note.position;
    const sortOrder = seenByPosition.get(orderKey) ?? 0;
    seenByPosition.set(orderKey, sortOrder + 1);
    await db.productFragranceNote.create({
      data: { productId: product.id, noteId: row.id, position: note.position, sortOrder },
    });
  }

  // --- Collections --------------------------------------------------------
  await db.productCollection.deleteMany({ where: { productId: product.id } });
  for (const [index, slug] of seed.collectionSlugs.entries()) {
    const collection = await db.collection.findUniqueOrThrow({ where: { slug } });
    await db.productCollection.create({
      data: { productId: product.id, collectionId: collection.id, position: index },
    });
  }

  // --- Variants and stock -------------------------------------------------
  for (const [index, variantSeed] of seed.variants.entries()) {
    const variantData = {
      sku: skuFor(seed.slug, variantSeed.volumeMl),
      priceCents: toCents(variantSeed.priceReais),
      compareAtPriceCents:
        variantSeed.compareAtPriceReais === undefined
          ? null
          : toCents(variantSeed.compareAtPriceReais),
      costPriceCents:
        variantSeed.costPriceReais === undefined ? null : toCents(variantSeed.costPriceReais),
      weightGrams: variantSeed.weightGrams,
      lengthMm: variantSeed.lengthMm,
      widthMm: variantSeed.widthMm,
      heightMm: variantSeed.heightMm,
      availabilityType: variantSeed.availabilityType,
      allowBackorder: variantSeed.allowBackorder ?? false,
      productionLeadTimeDays: variantSeed.productionLeadTimeDays ?? null,
      ean: variantSeed.ean ?? null,
      position: index,
      isActive: true,
    };

    const variant = await db.productVariant.upsert({
      where: { productId_volumeMl: { productId: product.id, volumeMl: variantSeed.volumeMl } },
      create: { productId: product.id, volumeMl: variantSeed.volumeMl, ...variantData },
      update: variantData,
    });

    // Stock is only set on creation. Overwriting it on a re-seed would wipe out
    // real counts and any live reservations.
    const existing = await db.inventory.findUnique({ where: { variantId: variant.id } });
    if (!existing) {
      await db.inventory.create({
        data: {
          variantId: variant.id,
          onHand: variantSeed.onHand,
          reserved: 0,
          lowStockThreshold: variantSeed.lowStockThreshold ?? 3,
        },
      });

      if (variantSeed.onHand > 0) {
        await db.inventoryMovement.create({
          data: {
            inventoryId: (await db.inventory.findUniqueOrThrow({
              where: { variantId: variant.id },
            })).id,
            type: "PURCHASE",
            quantityDelta: variantSeed.onHand,
            onHandAfter: variantSeed.onHand,
            reservedAfter: 0,
            referenceType: "seed",
            reason: "Estoque inicial de demonstração",
          },
        });
      }
    }
  }

  return product;
}

async function seedCoupons(db: Db): Promise<number> {
  for (const coupon of COUPONS) {
    const data = {
      kind: coupon.kind,
      value: coupon.kind === "FIXED" ? toCents(coupon.value) : coupon.value,
      minOrderCents: coupon.minOrderReais === undefined ? null : toCents(coupon.minOrderReais),
      usageLimit: coupon.usageLimit ?? null,
      startsAt: new Date("2026-01-01T00:00:00Z"),
      isActive: true,
    };

    await db.coupon.upsert({
      where: { code: coupon.code },
      create: { code: coupon.code, ...data },
      // usageCount is not touched: it is real usage data.
      update: data,
    });
  }
  return COUPONS.length;
}

async function seedRolesAndPermissions(db: Db) {
  const permissions: { key: string; label: string; group: string }[] = [
    { key: "product.read", label: "Ver produtos", group: "catalogo" },
    { key: "product.write", label: "Editar produtos", group: "catalogo" },
    { key: "inventory.read", label: "Ver estoque", group: "estoque" },
    { key: "inventory.write", label: "Ajustar estoque", group: "estoque" },
    { key: "production.read", label: "Ver produção", group: "producao" },
    { key: "production.update", label: "Atualizar produção", group: "producao" },
    { key: "order.read", label: "Ver pedidos", group: "pedidos" },
    { key: "order.update", label: "Atualizar pedidos", group: "pedidos" },
    { key: "refund.create", label: "Emitir reembolso", group: "financeiro" },
    { key: "payment.read", label: "Ver pagamentos", group: "financeiro" },
    { key: "invoice.read", label: "Ver notas fiscais", group: "fiscal" },
    { key: "invoice.issue", label: "Emitir nota fiscal", group: "fiscal" },
    { key: "shipment.read", label: "Ver remessas", group: "logistica" },
    { key: "shipment.write", label: "Gerenciar remessas", group: "logistica" },
    { key: "customer.read", label: "Ver clientes", group: "clientes" },
    { key: "review.moderate", label: "Moderar avaliações", group: "conteudo" },
    { key: "coupon.write", label: "Gerenciar cupons", group: "marketing" },
    { key: "content.write", label: "Editar conteúdo", group: "conteudo" },
    { key: "settings.write", label: "Alterar configurações", group: "sistema" },
    { key: "user.manage", label: "Gerenciar usuários e permissões", group: "sistema" },
    { key: "audit.read", label: "Ver auditoria", group: "sistema" },
    { key: "privacy.manage", label: "Tratar solicitações LGPD", group: "sistema" },
  ];

  for (const permission of permissions) {
    await db.permission.upsert({
      where: { key: permission.key },
      create: permission,
      update: { label: permission.label, group: permission.group },
    });
  }

  const roles: { name: "SUPER_ADMIN" | "ADMIN" | "SALES" | "INVENTORY" | "PRODUCTION" | "FINANCE" | "SUPPORT" | "MARKETING"; label: string; permissions: string[] | "*" }[] = [
    { name: "SUPER_ADMIN", label: "Super administrador", permissions: "*" },
    {
      name: "ADMIN",
      label: "Administrador",
      permissions: permissions.map((p) => p.key).filter((key) => key !== "user.manage"),
    },
    {
      name: "SALES",
      label: "Vendas",
      permissions: ["product.read", "order.read", "order.update", "customer.read", "inventory.read"],
    },
    {
      name: "INVENTORY",
      label: "Estoque",
      permissions: ["product.read", "inventory.read", "inventory.write", "order.read"],
    },
    {
      name: "PRODUCTION",
      label: "Produção",
      permissions: ["product.read", "production.read", "production.update", "inventory.read", "order.read"],
    },
    {
      name: "FINANCE",
      label: "Financeiro",
      permissions: ["order.read", "payment.read", "refund.create", "invoice.read", "invoice.issue"],
    },
    {
      name: "SUPPORT",
      label: "Atendimento",
      permissions: ["order.read", "customer.read", "product.read", "shipment.read", "review.moderate"],
    },
    {
      name: "MARKETING",
      label: "Marketing",
      permissions: ["product.read", "coupon.write", "content.write", "review.moderate"],
    },
  ];

  for (const role of roles) {
    const created = await db.role.upsert({
      where: { name: role.name },
      create: { name: role.name, label: role.label },
      update: { label: role.label },
    });

    const keys = role.permissions === "*" ? permissions.map((p) => p.key) : role.permissions;

    // Rebuilt rather than patched, so removing a permission from a role in this
    // file actually removes it from the database.
    await db.rolePermission.deleteMany({ where: { roleId: created.id } });
    for (const key of keys) {
      const permission = await db.permission.findUniqueOrThrow({ where: { key } });
      await db.rolePermission.create({
        data: { roleId: created.id, permissionId: permission.id },
      });
    }
  }

  return { permissions: permissions.length, roles: roles.length };
}

export async function seed(db: Db) {
  const settings = await seedSettings(db);
  const taxonomy = await seedTaxonomy(db);
  const access = await seedRolesAndPermissions(db);

  for (const product of PRODUCTS) {
    await seedProduct(db, product);
  }

  const coupons = await seedCoupons(db);

  return {
    settings,
    ...taxonomy,
    ...access,
    products: PRODUCTS.length,
    variants: PRODUCTS.reduce((sum, p) => sum + p.variants.length, 0),
    coupons,
  };
}

async function main() {
  const db = createStandaloneClient();
  try {
    const summary = await seed(db);
    console.log("Seed concluído:");
    for (const [key, value] of Object.entries(summary)) {
      console.log(`  ${key}: ${value}`);
    }
  } finally {
    await db.$disconnect();
  }
}

/**
 * Only run when invoked as a script.
 *
 * Without this guard, importing `seed` from a test would execute the whole seed
 * at import time and then disconnect the client out from under the test — which
 * is exactly what hung the integration suite the first time round.
 */
const invokedPath = process.argv[1];
const isDirectRun =
  invokedPath !== undefined &&
  path.resolve(invokedPath) === path.resolve(fileURLToPath(import.meta.url));

if (isDirectRun) {
  main().catch((error) => {
    console.error("Seed falhou:", error);
    process.exitCode = 1;
  });
}
