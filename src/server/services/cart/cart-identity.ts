import { cookies } from "next/headers";
import { prisma } from "@/server/db/client";
import { getSessionUser } from "@/server/services/auth/session";
import { generateOpaqueToken } from "@/server/services/auth/tokens";
import { getEnv } from "@/server/env";

/**
 * Resolves *which* `Cart` row the current request should read/write.
 *
 * Two identities, same table (see `Cart` in schema.prisma):
 * - Signed-in: one cart per `Customer`, found or created by `customerId`.
 * - Anonymous: one cart per browser, found or created by an opaque
 *   `sessionKey` carried in a dedicated cookie — separate from the auth
 *   session cookie, because a cart must survive across logged-out browsing
 *   and get merged in in only once the visitor actually logs in
 *   (`mergeGuestCartIntoCustomerCart`, called from the login/register Server
 *   Actions, not from here).
 *
 * The guest cookie holds the raw `sessionKey` directly, unlike the auth
 * session cookie which only ever stores a hash of the credential
 * server-side. That asymmetry is intentional: a session token grants access
 * to an authenticated account, so a database leak must not be able to
 * replay it — this token only ever points at an anonymous cart with no
 * personal data, so the worst case of it appearing in a leaked table is
 * someone can see an anonymous shopping cart.
 */

const GUEST_CART_COOKIE_NAME = "guest_cart";
const GUEST_CART_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days, matches the auth session

function guestCookieOptions(expiresAt: Date) {
  const env = getEnv();
  return {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    expires: expiresAt,
  };
}

/**
 * Returns the id of the cart to use for the current request, creating one
 * if none exists yet.
 *
 * Next.js only allows a cookie to be *set* from a Server Action or Route
 * Handler, never from a plain Server Component render — so this must only
 * be called from one of those. Server Components that just need to *read*
 * the existing cart (a page rendering the cart badge, for example) should
 * call `peekCartId()` instead, which never writes anything.
 */
export async function resolveCartId(): Promise<string> {
  const user = await getSessionUser();

  if (user?.customer) {
    return resolveCustomerCartId(user.customer.id);
  }

  return resolveGuestCartId();
}

/**
 * Read-only counterpart to `resolveCartId()`, safe to call from a Server
 * Component. Returns `null` instead of creating a cart when no guest cookie
 * exists yet — an empty cart and "no cart" render identically (a count of
 * zero), so there is nothing to create just to look at it.
 */
export async function peekCartId(): Promise<string | null> {
  const user = await getSessionUser();

  if (user?.customer) {
    const existing = await prisma.cart.findFirst({
      where: { customerId: user.customer.id },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    return existing?.id ?? null;
  }

  const store = await cookies();
  const existingKey = store.get(GUEST_CART_COOKIE_NAME)?.value;
  if (!existingKey) return null;

  const cart = await prisma.cart.findUnique({ where: { sessionKey: existingKey }, select: { id: true } });
  return cart?.id ?? null;
}

/**
 * `Cart.customerId` is indexed but not declared `@unique` in the schema (a
 * customer could in principle have more than one cart row), so this can't
 * use `upsert()` — that requires a unique `where`. `findFirst` + conditional
 * `create` gets the same "one cart per customer" behavior in practice: this
 * is the only place a customer cart is ever created, and every write always
 * goes through here rather than a raw `cart.create`.
 */
async function resolveCustomerCartId(customerId: string): Promise<string> {
  const existing = await prisma.cart.findFirst({
    where: { customerId },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (existing) return existing.id;

  const created = await prisma.cart.create({ data: { customerId }, select: { id: true } });
  return created.id;
}

async function resolveGuestCartId(): Promise<string> {
  const store = await cookies();
  const existingKey = store.get(GUEST_CART_COOKIE_NAME)?.value;

  if (existingKey) {
    const cart = await prisma.cart.findUnique({ where: { sessionKey: existingKey }, select: { id: true } });
    if (cart) return cart.id;
    // Cookie survived but the row didn't (expired-cart cleanup, or a
    // fabricated value) — fall through and issue a fresh one.
  }

  const sessionKey = generateOpaqueToken();
  const expiresAt = new Date(Date.now() + GUEST_CART_TTL_MS);
  const cart = await prisma.cart.create({
    data: { sessionKey, expiresAt },
    select: { id: true },
  });

  store.set(GUEST_CART_COOKIE_NAME, sessionKey, guestCookieOptions(expiresAt));
  return cart.id;
}

/**
 * Merges an anonymous cart's lines into the signed-in customer's cart, then
 * discards the guest cart and its cookie. Called right after a successful
 * login/registration — never on a read path, since it mutates.
 *
 * Quantities of the same variant are summed rather than overwritten: this
 * runs immediately after authentication, when both carts could plausibly
 * hold the same product added at different times.
 */
export async function mergeGuestCartIntoCustomerCart(customerId: string): Promise<void> {
  const store = await cookies();
  const guestKey = store.get(GUEST_CART_COOKIE_NAME)?.value;
  if (!guestKey) return;

  const guestCart = await prisma.cart.findUnique({
    where: { sessionKey: guestKey },
    select: { id: true, items: { select: { variantId: true, quantity: true } } },
  });
  store.delete(GUEST_CART_COOKIE_NAME);
  if (!guestCart) return;

  if (guestCart.items.length > 0) {
    const customerCartId = await resolveCustomerCartId(customerId);

    for (const item of guestCart.items) {
      await prisma.cartItem.upsert({
        where: { cartId_variantId: { cartId: customerCartId, variantId: item.variantId } },
        update: { quantity: { increment: item.quantity } },
        create: { cartId: customerCartId, variantId: item.variantId, quantity: item.quantity },
      });
    }
  }

  // The guest cart's job ends here — deleting it (rather than leaving an
  // orphaned, cookie-less row) keeps the abandoned-cart cleanup job honest.
  await prisma.cart.delete({ where: { id: guestCart.id } });
}
