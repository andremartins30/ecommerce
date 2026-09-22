// The environment is loaded by tests/setup/integration.ts, which Vitest runs
// before any test module is imported.
import { prisma } from "@/server/db/client";

export { prisma };

/**
 * Deletes catalogue data in dependency order.
 *
 * Deliberately explicit rather than a truncate-everything helper: an integration
 * suite that wipes tables it does not know about is how test setup quietly
 * destroys data someone cared about.
 */
export async function resetTransactional() {
  await prisma.auditLog.deleteMany();
  await prisma.webhookEvent.deleteMany();
  await prisma.queueJob.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.notificationTemplate.deleteMany();
  await prisma.privacyConsent.deleteMany();
  await prisma.privacyRequest.deleteMany();
  await prisma.trackingEvent.deleteMany();
  await prisma.shipmentItem.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.refund.deleteMany();
  await prisma.paymentTransaction.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.productionNote.deleteMany();
  await prisma.productionTask.deleteMany();
  await prisma.review.deleteMany();
  await prisma.inventoryReservation.deleteMany();
  await prisma.inventoryMovement.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.orderStatusHistory.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.customerAddress.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.adminUserRole.deleteMany();
  await prisma.adminUser.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.session.deleteMany();
  await prisma.emailVerificationToken.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.promotion.deleteMany();
}

/**
 * An Argon2id-shaped hash. Only used to satisfy the database constraint in
 * fixtures — real hashing arrives with the authentication task.
 */
export const FAKE_ARGON2ID_HASH =
  "$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHR2YWx1ZQ$0000000000000000000000000000000000000000000";

export async function createTestCustomer(overrides: { email?: string; name?: string } = {}) {
  const suffix = Math.random().toString(36).slice(2, 8);
  const user = await prisma.user.create({
    data: {
      email: overrides.email ?? `cliente.${suffix}@example.com`,
      passwordHash: FAKE_ARGON2ID_HASH,
      emailVerified: true,
      customer: {
        create: {
          name: overrides.name ?? `Cliente ${suffix}`,
          addresses: {
            create: {
              label: "Casa",
              recipient: overrides.name ?? `Cliente ${suffix}`,
              postalCode: "01310100",
              street: "Avenida Paulista",
              number: "1000",
              district: "Bela Vista",
              city: "São Paulo",
              state: "SP",
              isDefaultShipping: true,
            },
          },
        },
      },
    },
    include: { customer: { include: { addresses: true } } },
  });

  return { user, customer: user.customer!, address: user.customer!.addresses[0] };
}

/** A valid order with one line. `item` overrides bend a single field. */
export async function createTestOrder(
  overrides: {
    subtotalCents?: number;
    discountCents?: number;
    shippingCents?: number;
    totalCents?: number;
    item?: Partial<{
      quantity: number;
      unitPriceCents: number;
      qtyFromStock: number;
      qtyBackordered: number;
      estimatedProductionReadyAt: Date | null;
      availabilityTypeSnapshot: "READY_STOCK" | "MADE_TO_ORDER" | "OUT_OF_STOCK" | "DISCONTINUED";
      productionLeadTimeDaysSnapshot: number;
      volumeMlSnapshot: number;
    }>;
  } = {}
) {
  const { customer, address } = await createTestCustomer();
  const product = await createTestProduct();
  const variant = product.variants[0];

  const subtotalCents = overrides.subtotalCents ?? 24990;
  const discountCents = overrides.discountCents ?? 0;
  const shippingCents = overrides.shippingCents ?? 2490;
  const totalCents = overrides.totalCents ?? subtotalCents - discountCents + shippingCents;

  const quantity = overrides.item?.quantity ?? 1;

  return prisma.order.create({
    data: {
      number: `PF-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      customerId: customer.id,
      addressId: address.id,
      email: `pedido.${Math.random().toString(36).slice(2, 8)}@example.com`,
      customerNameSnapshot: customer.name,
      shippingRecipient: address.recipient,
      shippingPostalCode: address.postalCode,
      shippingStreet: address.street,
      shippingNumber: address.number,
      shippingDistrict: address.district,
      shippingCity: address.city,
      shippingState: address.state,
      subtotalCents,
      discountCents,
      shippingCents,
      totalCents,
      items: {
        create: {
          productId: product.id,
          variantId: variant.id,
          nameSnapshot: product.name,
          brandSnapshot: "Marca",
          skuSnapshot: variant.sku,
          volumeMlSnapshot: overrides.item?.volumeMlSnapshot ?? variant.volumeMl,
          productTypeSnapshot: "CONTRATIPO",
          unitPriceCents: overrides.item?.unitPriceCents ?? 24990,
          quantity,
          availabilityTypeSnapshot: overrides.item?.availabilityTypeSnapshot ?? "READY_STOCK",
          productionLeadTimeDaysSnapshot: overrides.item?.productionLeadTimeDaysSnapshot ?? 0,
          qtyFromStock: overrides.item?.qtyFromStock ?? quantity,
          qtyBackordered: overrides.item?.qtyBackordered ?? 0,
          estimatedProductionReadyAt: overrides.item?.estimatedProductionReadyAt ?? null,
        },
      },
    },
    include: { items: true },
  });
}

export async function createTestInventory(onHand = 10, reserved = 0) {
  const product = await createTestProduct();
  return prisma.inventory.create({
    data: { variantId: product.variants[0].id, onHand, reserved },
  });
}

export async function resetCatalogue() {
  await prisma.productCollection.deleteMany();
  await prisma.productFragranceNote.deleteMany();
  await prisma.productFragranceFamily.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.collection.deleteMany();
  await prisma.fragranceNote.deleteMany();
  await prisma.fragranceFamily.deleteMany();
  await prisma.concentration.deleteMany();
  await prisma.category.deleteMany();
  await prisma.brand.deleteMany();
}

/** A minimal, valid product graph. Overrides let a test bend one field. */
export async function createTestProduct(
  overrides: {
    slug?: string;
    productType?: "CONTRATIPO" | "IMPORTADO" | "NICHO" | "OUTRO";
    variant?: Partial<{
      sku: string;
      volumeMl: number;
      priceCents: number;
      compareAtPriceCents: number | null;
      weightGrams: number;
      lengthMm: number;
      widthMm: number;
      heightMm: number;
      availabilityType: "READY_STOCK" | "MADE_TO_ORDER" | "OUT_OF_STOCK" | "DISCONTINUED";
      allowBackorder: boolean;
      productionLeadTimeDays: number | null;
    }>;
  } = {}
) {
  const suffix = Math.random().toString(36).slice(2, 8);
  const slug = overrides.slug ?? `produto-teste-${suffix}`;

  const brand = await prisma.brand.create({
    data: { slug: `marca-${suffix}`, name: `Marca ${suffix}` },
  });
  const category = await prisma.category.create({
    data: { slug: `categoria-${suffix}`, name: `Categoria ${suffix}` },
  });

  return prisma.product.create({
    data: {
      slug,
      name: `Produto ${suffix}`,
      productType: overrides.productType ?? "CONTRATIPO",
      brandId: brand.id,
      categoryId: category.id,
      shortDescription: "Descrição curta",
      description: "Descrição completa",
      variants: {
        create: {
          sku: overrides.variant?.sku ?? `SKU-${suffix}-50`,
          volumeMl: overrides.variant?.volumeMl ?? 50,
          priceCents: overrides.variant?.priceCents ?? 24990,
          compareAtPriceCents: overrides.variant?.compareAtPriceCents ?? null,
          weightGrams: overrides.variant?.weightGrams ?? 320,
          lengthMm: overrides.variant?.lengthMm ?? 60,
          widthMm: overrides.variant?.widthMm ?? 60,
          heightMm: overrides.variant?.heightMm ?? 140,
          availabilityType: overrides.variant?.availabilityType ?? "READY_STOCK",
          allowBackorder: overrides.variant?.allowBackorder ?? false,
          productionLeadTimeDays: overrides.variant?.productionLeadTimeDays ?? null,
        },
      },
    },
    include: { variants: true },
  });
}
