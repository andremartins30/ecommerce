import type { Metadata } from "next";
import { CheckoutFlow } from "@/components/checkout/checkout-flow";
import { getCartView } from "@/server/services/cart/cart-queries";

export const metadata: Metadata = {
  title: "Checkout",
};

// getCartView() reads the session/guest-cart cookie — never statically prerender this with someone else's cart.
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const cart = await getCartView();
  return <CheckoutFlow cart={cart} />;
}
