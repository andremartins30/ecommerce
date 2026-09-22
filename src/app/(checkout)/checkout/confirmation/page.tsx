import type { Metadata } from "next";
import { OrderConfirmation } from "@/components/checkout/order-confirmation";

export const metadata: Metadata = {
  title: "Order Confirmed",
};

export default function ConfirmationPage() {
  return <OrderConfirmation />;
}
