import type { Metadata } from "next";
import { CartView } from "@/components/cart/cart-view";
import { getStoreSettings } from "@/server/services/settings/store-settings";

export const metadata: Metadata = {
  title: "Sua sacola",
};

export default async function CartPage() {
  const settings = await getStoreSettings();
  return (
    <CartView
      shippingPolicy={{ handlingDays: settings.handlingDays, shipmentPolicy: settings.shipmentPolicy }}
    />
  );
}
