"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/server/db/client";
import { resolveCartId } from "@/server/services/cart/cart-identity";
import { getCartView, type CartView } from "@/server/services/cart/cart-queries";
import { resolveAvailability } from "@/server/domain/availability/availability";
import { addItemSchema, updateQuantitySchema, applyCouponSchema } from "@/server/services/cart/cart-schema";

/**
 * Write side of the cart.
 *
 * Every mutation re-validates availability against live inventory before
 * writing — `CartItem` never stores a price, and it must never be allowed to
 * hold a quantity the variant cannot actually fulfil either. This does not
 * create an `InventoryReservation`; that ledger entry belongs to checkout
 * (see the reservation-timing note in inventory-schema.ts) — adding to a
 * cart only checks sellability, it never holds stock.
 */

export interface CartActionResult {
  success: boolean;
  formError?: string;
  cart?: CartView;
}

async function checkAvailability(variantId: string, requestedQty: number): Promise<string | null> {
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    select: {
      isActive: true,
      availabilityType: true,
      allowBackorder: true,
      productionLeadTimeDays: true,
      product: { select: { status: true } },
      inventory: { select: { onHand: true, reserved: true } },
    },
  });

  if (!variant || !variant.isActive || variant.product.status !== "ACTIVE") {
    return "Este produto não está mais disponível.";
  }

  const availableStock = variant.inventory ? Math.max(0, variant.inventory.onHand - variant.inventory.reserved) : 0;
  const resolution = resolveAvailability({
    variant: {
      availabilityType: variant.availabilityType,
      allowBackorder: variant.allowBackorder,
      productionLeadTimeDays: variant.productionLeadTimeDays,
    },
    requestedQty,
    availableStock,
  });

  if (!resolution.sellable) {
    if (resolution.reason === "DISCONTINUED") return "Este produto foi descontinuado.";
    if (resolution.reason === "OUT_OF_STOCK" || resolution.reason === "NO_STOCK_AND_NO_BACKORDER") {
      return "Este produto está sem estoque.";
    }
    return "Quantidade indisponível para este produto.";
  }

  return null;
}

export async function addItem(input: unknown): Promise<CartActionResult> {
  const parsed = addItemSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, formError: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const cartId = await resolveCartId();
  const { variantId, quantity } = parsed.data;

  const existing = await prisma.cartItem.findUnique({
    where: { cartId_variantId: { cartId, variantId } },
    select: { quantity: true },
  });
  const totalQuantity = (existing?.quantity ?? 0) + quantity;

  const error = await checkAvailability(variantId, totalQuantity);
  if (error) return { success: false, formError: error };

  await prisma.cartItem.upsert({
    where: { cartId_variantId: { cartId, variantId } },
    update: { quantity: totalQuantity },
    create: { cartId, variantId, quantity },
  });

  revalidateCart();
  return { success: true, cart: await getCartView() };
}

export async function updateItemQuantity(input: unknown): Promise<CartActionResult> {
  const parsed = updateQuantitySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, formError: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const cartId = await resolveCartId();
  const item = await prisma.cartItem.findUnique({ where: { id: parsed.data.itemId } });
  if (!item || item.cartId !== cartId) {
    return { success: false, formError: "Item não encontrado no carrinho." };
  }

  const error = await checkAvailability(item.variantId, parsed.data.quantity);
  if (error) return { success: false, formError: error };

  await prisma.cartItem.update({ where: { id: item.id }, data: { quantity: parsed.data.quantity } });

  revalidateCart();
  return { success: true, cart: await getCartView() };
}

export async function removeItem(itemId: string): Promise<CartActionResult> {
  const cartId = await resolveCartId();
  const item = await prisma.cartItem.findUnique({ where: { id: itemId } });
  if (!item || item.cartId !== cartId) {
    return { success: false, formError: "Item não encontrado no carrinho." };
  }

  await prisma.cartItem.delete({ where: { id: itemId } });

  revalidateCart();
  return { success: true, cart: await getCartView() };
}

export async function applyCoupon(input: unknown): Promise<CartActionResult> {
  const parsed = applyCouponSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, formError: parsed.error.issues[0]?.message ?? "Código inválido." };
  }

  const cartId = await resolveCartId();
  await prisma.cart.update({ where: { id: cartId }, data: { couponCode: parsed.data.code } });

  const cart = await getCartView();
  // getCartView re-validates the coupon against the live Coupon row — if it
  // came back invalid, don't leave a dead code silently attached to the cart.
  if (!cart.coupon?.valid) {
    await prisma.cart.update({ where: { id: cartId }, data: { couponCode: null } });
    const reason = cart.coupon?.invalidReason ?? "Código inválido ou expirado.";
    return { success: false, formError: reason, cart: { ...cart, coupon: null } };
  }

  revalidateCart();
  return { success: true, cart };
}

/**
 * Empties the cart after an order is placed. Checkout/order persistence
 * itself is still task 22/23 territory (see checkout-flow.tsx) — this only
 * covers the cart side of "the bag should be empty after you buy its
 * contents," which is true regardless of how the order is recorded.
 */
/**
 * Server Action wrapper around the read-only `getCartView()` query, so
 * Client Components (cart-drawer.tsx, which can be opened from anywhere,
 * not just a page that already fetched a cart server-side) can call it
 * without bundling the Prisma/pg client into client JS — cart-queries.ts
 * has no "use server" directive of its own since Server Components import
 * it directly and don't need the RPC wrapper.
 */
export async function fetchCartView(): Promise<CartView> {
  return getCartView();
}

export async function clearCart(): Promise<CartActionResult> {
  const cartId = await resolveCartId();
  await prisma.$transaction([
    prisma.cartItem.deleteMany({ where: { cartId } }),
    prisma.cart.update({ where: { id: cartId }, data: { couponCode: null } }),
  ]);

  revalidateCart();
  return { success: true, cart: await getCartView() };
}

export async function removeCoupon(): Promise<CartActionResult> {
  const cartId = await resolveCartId();
  await prisma.cart.update({ where: { id: cartId }, data: { couponCode: null } });

  revalidateCart();
  return { success: true, cart: await getCartView() };
}

function revalidateCart(): void {
  revalidatePath("/cart");
  revalidatePath("/checkout");
}
