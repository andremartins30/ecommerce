import { redirect } from "next/navigation";
import { requireUser } from "@/server/services/auth/session";
import { listAccountAddresses } from "@/server/services/account/address-queries";
import { AddressList } from "@/components/account/address-list";

/**
 * Real CustomerAddress data now (Task 20) — no more profile-store/
 * LegacyAddress. See address-queries.ts/address-actions.ts.
 */
export default async function AddressesPage() {
  const user = await requireUser();
  if (!user.customer) redirect("/account");

  const addresses = await listAccountAddresses(user.customer.id);

  return <AddressList addresses={addresses} />;
}
