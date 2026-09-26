import type { Metadata } from "next";
import { CartView } from "@/components/cart/cart-view";
import { getStoreSettings } from "@/server/services/settings/store-settings";
import { getCartView } from "@/server/services/cart/cart-queries";

export const metadata: Metadata = {
  title: "Sua sacola",
};

// No cookies()-reading call happens directly in this file, but getCartView()
// reads the session/guest-cart cookie under the hood — force-dynamic keeps
// this from ever being statically prerendered with someone else's cart.
export const dynamic = "force-dynamic";

export default async function CartPage() {
  const [settings, cart] = await Promise.all([getStoreSettings(), getCartView()]);
  return (
    <CartView
      cart={cart}
      shippingPolicy={{ handlingDays: settings.handlingDays, shipmentPolicy: settings.shipmentPolicy }}
    />
  );
}
