import { prisma } from "@/server/db/client";
import { peekCartId } from "@/server/services/cart/cart-identity";
import { getStoreSettings } from "@/server/services/settings/store-settings";
import { mapVariant, type VariantRow } from "@/server/services/catalog/mappers";
import { computeOrderTotals, computeDiscountAmount, computeShipping, type DiscountInput } from "@/lib/pricing";
import type { ProductVariant } from "@/lib/types";

/**
 * Read side of the cart.
 *
 * `CartItem` only ever stores `variantId` + `quantity` (see the model's own
 * doc comment in schema.prisma: "Price is deliberately absent... resolved
 * from the variant on every read"). This module is that resolution step —
 * price, availability and the coupon's current validity are computed fresh
 * every time, never trusted from what was true when a line was added.
 */

export interface CartLine {
  id: string;
  variantId: string;
  productId: string;
  productSlug: string;
  productName: string;
  brandName: string;
  volumeMl: number;
  image: { url: string; alt: string } | null;
  quantity: number;
  variant: ProductVariant;
  /** Line subtotal at the variant's *current* price — never the price at add-to-cart time. */
  lineTotalCents: number;
}

export interface CartCoupon {
  code: string;
  valid: boolean;
  /** Why the coupon on the cart no longer applies, shown next to a "remove" prompt rather than failing silently. */
  invalidReason?: string;
  discount: DiscountInput | null;
}

export interface CartView {
  cartId: string;
  lines: CartLine[];
  /** Lines whose variant no longer exists, is inactive, or unpublished — removed automatically, but surfaced once so the drop isn't silent. */
  removedCount: number;
  coupon: CartCoupon | null;
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
}

/** Minimal row shape for one cart item's variant, joined with just enough of Product for display. */
const cartVariantInclude = {
  inventory: { select: { onHand: true, reserved: true, lowStockThreshold: true } },
  product: {
    select: {
      id: true,
      slug: true,
      name: true,
      status: true,
      productionLeadTimeDays: true,
      brand: { select: { name: true } },
      images: { select: { url: true, alt: true, isPrimary: true, position: true }, orderBy: { position: "asc" } },
    },
  },
} as const;

export async function getCartView(): Promise<CartView> {
  const cartId = await peekCartId();
  if (!cartId) {
    return { cartId: "", lines: [], removedCount: 0, coupon: null, subtotalCents: 0, discountCents: 0, shippingCents: 0, totalCents: 0 };
  }
  return buildCartView(cartId);
}

export async function buildCartView(cartId: string): Promise<CartView> {
  const [cart, settings] = await Promise.all([
    prisma.cart.findUnique({
      where: { id: cartId },
      select: { couponCode: true, items: { orderBy: { createdAt: "asc" } } },
    }),
    getStoreSettings(),
  ]);

  if (!cart) {
    return { cartId, lines: [], removedCount: 0, coupon: null, subtotalCents: 0, discountCents: 0, shippingCents: 0, totalCents: 0 };
  }

  const variantIds = cart.items.map((item) => item.variantId);
  const variantRows =
    variantIds.length === 0
      ? []
      : await prisma.productVariant.findMany({
        where: { id: { in: variantIds } },
        include: cartVariantInclude,
      });
  const rowsById = new Map(variantRows.map((row) => [row.id, row]));

  const lines: CartLine[] = [];
  let removedCount = 0;
  const staleItemIds: string[] = [];

  for (const item of cart.items) {
    const row = rowsById.get(item.variantId);
    // A variant that was deleted, deactivated, or whose product was
    // unpublished/removed since the line was added can no longer be shown —
    // and must not silently linger forever, or the cart total would never
    // match what's actually displayed.
    if (!row || !row.isActive || row.product.status !== "ACTIVE") {
      removedCount += 1;
      staleItemIds.push(item.id);
      continue;
    }

    const variant = mapVariant(
      row as VariantRow,
      { productionLeadTimeDays: row.product.productionLeadTimeDays },
      settings
    );
    const images = [...row.product.images].sort((a, b) => a.position - b.position);
    const primaryImage = images.find((img) => img.isPrimary) ?? images[0] ?? null;

    lines.push({
      id: item.id,
      variantId: item.variantId,
      productId: row.product.id,
      productSlug: row.product.slug,
      productName: row.product.name,
      brandName: row.product.brand.name,
      volumeMl: row.volumeMl,
      image: primaryImage ? { url: primaryImage.url, alt: primaryImage.alt } : null,
      quantity: item.quantity,
      variant,
      lineTotalCents: variant.priceCents * item.quantity,
    });
  }

  if (staleItemIds.length > 0) {
    await prisma.cartItem.deleteMany({ where: { id: { in: staleItemIds } } });
  }

  const subtotalCents = lines.reduce((sum, line) => sum + line.lineTotalCents, 0);
  const coupon = await resolveCoupon(cart.couponCode, subtotalCents);
  const discountInput = coupon?.valid ? coupon.discount : null;

  const discountCents = computeDiscountAmount(subtotalCents, discountInput);
  const shippingCents = computeShipping(subtotalCents, discountInput);
  const totals = computeOrderTotals(subtotalCents, discountInput);

  return {
    cartId,
    lines,
    removedCount,
    coupon,
    subtotalCents,
    discountCents,
    shippingCents,
    totalCents: totals.total,
  };
}

/**
 * Re-validates the cart's stored coupon code against the live `Coupon` row
 * on every read — a code that was valid when applied can expire, get
 * deactivated, or fall below its minimum order value while sitting in the
 * cart, and the total must reflect that immediately, not at checkout.
 */
async function resolveCoupon(code: string | null, subtotalCents: number): Promise<CartCoupon | null> {
  if (!code) return null;

  const coupon = await prisma.coupon.findUnique({ where: { code } });
  if (!coupon) {
    return { code, valid: false, invalidReason: "Cupom não encontrado", discount: null };
  }

  const now = new Date();
  const discount: DiscountInput = {
    code: coupon.code,
    kind: coupon.kind === "PERCENTAGE" ? "percentage" : coupon.kind === "FIXED" ? "fixed" : "free_shipping",
    value: coupon.value,
    minOrderCents: coupon.minOrderCents ?? undefined,
  };

  if (!coupon.isActive) {
    return { code, valid: false, invalidReason: "Cupom inativo", discount };
  }
  if (coupon.startsAt > now) {
    return { code, valid: false, invalidReason: "Cupom ainda não é válido", discount };
  }
  if (coupon.expiresAt && coupon.expiresAt < now) {
    return { code, valid: false, invalidReason: "Cupom expirado", discount };
  }
  if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
    return { code, valid: false, invalidReason: "Cupom esgotado", discount };
  }
  // `usagePerCustomer` is deliberately not checked here: it requires looking
  // at *this customer's* past orders, which don't exist as a concept yet at
  // cart time (order placement is task 22/23). A cart can hold a coupon a
  // repeat customer will later be blocked from redeeming; checkout is where
  // that gets enforced authoritatively.
  if (coupon.minOrderCents && subtotalCents < coupon.minOrderCents) {
    return {
      code,
      valid: false,
      invalidReason: `Pedido mínimo de ${(coupon.minOrderCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`,
      discount,
    };
  }

  return { code, valid: true, discount };
}

export async function getCartCount(): Promise<number> {
  const cartId = await peekCartId();
  if (!cartId) return 0;
  const result = await prisma.cartItem.aggregate({
    where: { cartId },
    _sum: { quantity: true },
  });
  return result._sum.quantity ?? 0;
}
