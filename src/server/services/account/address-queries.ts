import { prisma } from "@/server/db/client";

/**
 * Read side for /account/addresses.
 *
 * Every query is scoped to a `customerId` resolved from the session
 * (never a client-supplied value) — see address-actions.ts for the same
 * rule on the write side.
 */

export interface AccountAddress {
  id: string;
  label: string;
  recipient: string;
  postalCode: string;
  street: string;
  number: string;
  complement: string | null;
  district: string;
  city: string;
  state: string;
  country: string;
  phone: string | null;
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
}

export async function listAccountAddresses(customerId: string): Promise<AccountAddress[]> {
  const rows = await prisma.customerAddress.findMany({
    where: { customerId },
    orderBy: [{ isDefaultShipping: "desc" }, { createdAt: "desc" }],
  });

  return rows.map((row) => ({
    id: row.id,
    label: row.label,
    recipient: row.recipient,
    postalCode: row.postalCode,
    street: row.street,
    number: row.number,
    complement: row.complement,
    district: row.district,
    city: row.city,
    state: row.state,
    country: row.country,
    phone: row.phone,
    isDefaultShipping: row.isDefaultShipping,
    isDefaultBilling: row.isDefaultBilling,
  }));
}
