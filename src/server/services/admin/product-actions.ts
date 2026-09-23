"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/server/db/client";
import { fromReais } from "@/server/domain/pricing/money";
import { slugify } from "@/lib/slug";
import { productSchema, type ProductFormValues } from "@/server/services/admin/product-schema";
import { requirePermission, type AdminSessionUser } from "@/server/services/auth/rbac";
import { requireReauth, ReauthRequiredError } from "@/server/services/auth/session";

/**
 * Write side for the admin product screens.
 *
 * Every action requires the `product.write` permission (see
 * prisma/seed.ts's role→permission map) and writes the real signed-in admin
 * as the AuditLog actor — `actorId` stays optional at the schema level
 * (`onDelete: SetNull`) so a removed admin's history survives, but a live
 * write should never fall back to the placeholder that existed before task 18.
 */

export interface ProductActionResult {
  success: boolean;
  productId?: string;
  /** Field-level errors, keyed the same way react-hook-form expects. */
  fieldErrors?: Record<string, string>;
  formError?: string;
}

function toActionResult(input: unknown): { data: ProductFormValues } | { fieldErrors: Record<string, string> } {
  const parsed = productSchema.safeParse(input);
  if (parsed.success) return { data: parsed.data };

  const fieldErrors: Record<string, string> = {};
  for (const issue of parsed.error.issues) {
    const path = issue.path.join(".");
    if (!fieldErrors[path]) fieldErrors[path] = issue.message;
  }
  return { fieldErrors };
}

/** Cents for storage; `null`/`undefined` pass through untouched. */
function toCentsOrNull(reais: number | null | undefined): number | null {
  if (reais === null || reais === undefined) return null;
  return fromReais(reais);
}

async function assertUniqueSlug(slug: string, excludeId?: string): Promise<boolean> {
  const existing = await prisma.product.findUnique({ where: { slug }, select: { id: true } });
  return !existing || existing.id === excludeId;
}

/**
 * Builds the nested-write payload shared by create and update for everything
 * below the Product row itself. Child collections (variants, images,
 * families, notes, collections) are replaced wholesale rather than diffed —
 * the form always submits the full desired state, and there is no order
 * history yet that would make deleting a variant unsafe.
 */
function childWrites(data: ProductFormValues) {
  return {
    images: {
      create: data.images.map((image, index) => ({
        url: image.url,
        alt: image.alt,
        isPrimary: image.isPrimary,
        position: index,
      })),
    },
    families: {
      create: data.families.map((family) => ({
        familyId: family.familyId,
        isPrimary: family.isPrimary,
      })),
    },
    notes: {
      create: data.notes.map((note) => ({
        noteId: note.noteId,
        position: note.position,
        sortOrder: note.sortOrder,
      })),
    },
    collections: {
      create: data.collections.map((collection, index) => ({
        collectionId: collection.collectionId,
        position: index,
      })),
    },
    variants: {
      create: data.variants.map((variant, index) => ({
        ...variantScalars(variant, index),
        inventory: { create: { onHand: variant.initialOnHand } },
      })),
    },
  };
}

/** Scalar (non-relational) columns of a variant, shared by create and update. */
function variantScalars(variant: ProductFormValues["variants"][number], position: number) {
  return {
    sku: variant.sku,
    volumeMl: variant.volumeMl,
    priceCents: fromReais(variant.priceReais),
    compareAtPriceCents: toCentsOrNull(variant.compareAtPriceReais),
    weightGrams: variant.weightGrams,
    lengthMm: variant.lengthMm,
    widthMm: variant.widthMm,
    heightMm: variant.heightMm,
    availabilityType: variant.availabilityType,
    allowBackorder: variant.allowBackorder,
    productionLeadTimeDays: variant.productionLeadTimeDays,
    ean: variant.ean,
    batchCode: variant.batchCode,
    isActive: variant.isActive,
    position,
  };
}

function productScalars(data: ProductFormValues) {
  return {
    name: data.name,
    slug: data.slug,
    status: data.status,
    productType: data.productType,
    brandId: data.brandId,
    categoryId: data.categoryId,
    concentrationId: data.concentrationId ?? null,
    shortDescription: data.shortDescription,
    description: data.description,
    gender: data.gender,
    occasions: data.occasions,
    seasons: data.seasons,
    countryOfOrigin: data.countryOfOrigin ?? null,
    longevity: data.longevity ?? null,
    projection: data.projection ?? null,
    inspiredBy: data.inspiredBy ?? null,
    referenceBrand: data.referenceBrand ?? null,
    referenceFragrance: data.referenceFragrance ?? null,
    disclaimerOverride: data.disclaimerOverride ?? null,
    productionLeadTimeDays: data.productionLeadTimeDays ?? null,
    isFeatured: data.isFeatured,
    isBestSeller: data.isBestSeller,
    isNew: data.isNew,
    tags: data.tags,
    seoTitle: data.seoTitle ?? null,
    seoDesc: data.seoDescription ?? null,
    publishedAt: data.status === "ACTIVE" ? new Date() : null,
  };
}

type AuditChanges = Record<string, { before: string | number | boolean | null; after: string | number | boolean | null }>;

function actorLabel(admin: AdminSessionUser): string {
  return `${admin.adminUser.name} <${admin.email}>`;
}

async function writeAuditLog(
  admin: AdminSessionUser,
  params: { action: string; entityId: string; changes?: AuditChanges }
) {
  await prisma.auditLog.create({
    data: {
      actorType: "USER",
      actorId: admin.id,
      actorLabel: actorLabel(admin),
      action: params.action,
      entityType: "Product",
      entityId: params.entityId,
      changes: params.changes && Object.keys(params.changes).length > 0 ? params.changes : undefined,
    },
  });
}

export async function createProduct(input: unknown): Promise<ProductActionResult> {
  const admin = await requirePermission("product.write");

  const result = toActionResult(input);
  if ("fieldErrors" in result) return { success: false, fieldErrors: result.fieldErrors };

  const data = result.data;
  const slug = data.slug || slugify(data.name);

  if (!(await assertUniqueSlug(slug))) {
    return { success: false, fieldErrors: { slug: "Já existe um produto com este slug" } };
  }

  try {
    const created = await prisma.product.create({
      data: { ...productScalars({ ...data, slug }), ...childWrites(data) },
      select: {
        id: true,
        variants: { select: { id: true, inventory: { select: { id: true, onHand: true } } } },
      },
    });

    // Nested writes create the Inventory row directly with `onHand` set, but
    // never a matching ledger entry — every unit of stock must trace back to
    // a movement (see inventory-actions.ts). This is that entry for whatever
    // stock the operator declared when creating the product.
    const initialMovements = created.variants
      .filter((variant) => variant.inventory && variant.inventory.onHand > 0)
      .map((variant) =>
        prisma.inventoryMovement.create({
          data: {
            inventoryId: variant.inventory!.id,
            type: "PURCHASE",
            quantityDelta: variant.inventory!.onHand,
            onHandAfter: variant.inventory!.onHand,
            reservedAfter: 0,
            referenceType: "product_creation",
            reason: "Estoque inicial informado na criação do produto",
          },
        })
      );

    if (initialMovements.length > 0) {
      await prisma.$transaction(initialMovements);
    }

    await writeAuditLog(admin, {
      action: "product.create",
      entityId: created.id,
      changes: { name: { before: null, after: data.name } },
    });

    revalidatePath("/admin/products");
    revalidatePath("/admin/inventory");
    return { success: true, productId: created.id };
  } catch (error) {
    return { success: false, formError: describeError(error) };
  }
}

export async function updateProduct(input: unknown): Promise<ProductActionResult> {
  const admin = await requirePermission("product.write");

  const result = toActionResult(input);
  if ("fieldErrors" in result) return { success: false, fieldErrors: result.fieldErrors };

  const data = result.data;
  if (!data.id) return { success: false, formError: "ID do produto ausente" };

  if (!(await assertUniqueSlug(data.slug, data.id))) {
    return { success: false, fieldErrors: { slug: "Já existe outro produto com este slug" } };
  }

  const before = await prisma.product.findUnique({
    where: { id: data.id },
    select: { name: true, status: true, slug: true },
  });
  if (!before) return { success: false, formError: "Produto não encontrado" };

  // Images/families/notes/collections carry no history worth preserving, so
  // they are still replaced wholesale. Variants are different: each one owns
  // an Inventory row and an append-only movement ledger (see
  // inventory-actions.ts). Deleting and recreating a variant on every save
  // would cascade-delete that ledger and silently erase stock history, so
  // existing variants (submitted with an `id`) are updated in place; only
  // genuinely new ones are created, and only removed ones are deleted.
  const existingVariantIds = new Set(
    (await prisma.productVariant.findMany({ where: { productId: data.id }, select: { id: true } })).map(
      (v) => v.id
    )
  );
  const submittedVariantIds = new Set(data.variants.map((v) => v.id).filter(Boolean) as string[]);
  const variantIdsToDelete = [...existingVariantIds].filter((id) => !submittedVariantIds.has(id));

  try {
    await prisma.$transaction([
      prisma.productImage.deleteMany({ where: { productId: data.id } }),
      prisma.productFragranceFamily.deleteMany({ where: { productId: data.id } }),
      prisma.productFragranceNote.deleteMany({ where: { productId: data.id } }),
      prisma.productCollection.deleteMany({ where: { productId: data.id } }),
      ...(variantIdsToDelete.length > 0
        ? [prisma.productVariant.deleteMany({ where: { id: { in: variantIdsToDelete } } })]
        : []),
      prisma.product.update({
        where: { id: data.id },
        data: {
          ...productScalars(data),
          images: childWrites(data).images,
          families: childWrites(data).families,
          notes: childWrites(data).notes,
          collections: childWrites(data).collections,
        },
      }),
      ...data.variants.map((variant, index) =>
        variant.id && existingVariantIds.has(variant.id)
          ? prisma.productVariant.update({
            where: { id: variant.id },
            data: variantScalars(variant, index),
          })
          : prisma.productVariant.create({
            data: {
              ...variantScalars(variant, index),
              productId: data.id!,
              inventory: { create: { onHand: variant.initialOnHand } },
            },
          })
      ),
    ]);

    // New variants created above need their initial stock's matching ledger
    // entry, same as createProduct — a nested/plain create sets onHand
    // directly with no movement to explain it otherwise.
    const newVariantsWithStock = data.variants.filter(
      (v) => (!v.id || !existingVariantIds.has(v.id)) && v.initialOnHand > 0
    );
    if (newVariantsWithStock.length > 0) {
      const createdInventories = await prisma.inventory.findMany({
        where: { variant: { productId: data.id, sku: { in: newVariantsWithStock.map((v) => v.sku) } } },
        select: { id: true, onHand: true, variant: { select: { sku: true } } },
      });
      await prisma.$transaction(
        createdInventories.map((inv) =>
          prisma.inventoryMovement.create({
            data: {
              inventoryId: inv.id,
              type: "PURCHASE",
              quantityDelta: inv.onHand,
              onHandAfter: inv.onHand,
              reservedAfter: 0,
              referenceType: "product_creation",
              reason: "Estoque inicial informado ao adicionar a variante",
            },
          })
        )
      );
    }

    const changes: AuditChanges = {};
    if (before.name !== data.name) changes.name = { before: before.name, after: data.name };
    if (before.status !== data.status) changes.status = { before: before.status, after: data.status };
    if (before.slug !== data.slug) changes.slug = { before: before.slug, after: data.slug };

    await writeAuditLog(admin, { action: "product.update", entityId: data.id, changes });

    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${data.id}/edit`);
    revalidatePath(`/produto/${data.slug}`);
    return { success: true, productId: data.id };
  } catch (error) {
    return { success: false, formError: describeError(error) };
  }
}

export async function deleteProduct(productId: string): Promise<ProductActionResult> {
  const admin = await requirePermission("product.write");
  // Deletion is irreversible (cascades to variants/inventory/history), so it
  // additionally requires a recently-reauthenticated session — narrower than
  // the MFA route gate in proxy.ts, checked only for this specific action.
  // Reported back as a normal formError (not a thrown/uncaught error) so the
  // existing toast-based UI in products-table.tsx can surface it as-is.
  try {
    await requireReauth();
  } catch (error) {
    if (error instanceof ReauthRequiredError) {
      return {
        success: false,
        formError: "Por segurança, confirme sua senha novamente antes de excluir um produto.",
      };
    }
    throw error;
  }

  const existing = await prisma.product.findUnique({
    where: { id: productId },
    select: { name: true, slug: true },
  });
  if (!existing) return { success: false, formError: "Produto não encontrado" };

  try {
    await prisma.product.delete({ where: { id: productId } });

    await writeAuditLog(admin, {
      action: "product.delete",
      entityId: productId,
      changes: { name: { before: existing.name, after: null } },
    });

    revalidatePath("/admin/products");
    return { success: true };
  } catch (error) {
    return { success: false, formError: describeError(error) };
  }
}

/**
 * Duplicates a product with a fresh id/slug, always as DRAFT — a duplicate is
 * a starting point for editing, never something that should go live
 * unreviewed. Variant SKUs get a "-copy" suffix since `sku` is globally
 * unique.
 */
export async function duplicateProduct(productId: string): Promise<ProductActionResult> {
  const admin = await requirePermission("product.write");

  const source = await getProductByIdForAdminInternal(productId);
  if (!source) return { success: false, formError: "Produto não encontrado" };

  const baseSlug = `${source.slug}-copia-${Date.now().toString(36)}`;

  try {
    const created = await prisma.product.create({
      data: {
        ...productScalars({ ...source, name: `${source.name} (Cópia)`, slug: baseSlug, status: "DRAFT" }),
        ...childWrites({
          ...source,
          variants: source.variants.map((variant) => ({
            ...variant,
            id: undefined,
            sku: `${variant.sku}-copy-${Date.now().toString(36)}`,
            initialOnHand: 0,
          })),
        }),
      },
      select: { id: true },
    });

    await writeAuditLog(admin, {
      action: "product.duplicate",
      entityId: created.id,
      changes: { name: { before: null, after: `${source.name} (Cópia)` } },
    });

    revalidatePath("/admin/products");
    return { success: true, productId: created.id };
  } catch (error) {
    return { success: false, formError: describeError(error) };
  }
}

// Avoids a circular import between product-queries and product-actions by
// keeping a minimal local copy of the read used only for duplication.
async function getProductByIdForAdminInternal(id: string) {
  const { getProductByIdForAdmin } = await import("@/server/services/admin/product-queries");
  return getProductByIdForAdmin(id);
}

function describeError(error: unknown): string {
  if (error instanceof Error) {
    // Prisma unique constraint violation (P2002) — the schema-level checks
    // already cover slug/volume, this is a defensive fallback (e.g. a
    // variant SKU collision).
    if ("code" in error && error.code === "P2002") {
      return "Já existe um registro com esses dados (SKU ou slug duplicado).";
    }
    return error.message;
  }
  return "Erro inesperado ao salvar o produto.";
}
