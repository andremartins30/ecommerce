"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/server/db/client";
import { requireUser } from "@/server/services/auth/session";
import { addressSchema } from "@/server/services/account/address-schema";

/**
 * Write side for /account/addresses.
 *
 * Every mutation re-derives `customerId` from the session and re-checks
 * that the target address row actually belongs to that customer before
 * touching it — an address id alone is not authorization, the same rule
 * profile-actions.ts follows for the profile row.
 */

export interface AccountActionResult {
  success: boolean;
  fieldErrors?: Record<string, string>;
  formError?: string;
}

async function requireCustomerId(): Promise<string> {
  const user = await requireUser();
  if (!user.customer) throw new Error("Conta sem perfil de cliente.");
  return user.customer.id;
}

/** Only one address can be the default for a given kind; enforced here rather than a DB constraint since "default" is scoped per-customer, not globally unique. */
async function clearExistingDefault(
  customerId: string,
  field: "isDefaultShipping" | "isDefaultBilling",
  excludeId?: string
) {
  await prisma.customerAddress.updateMany({
    where: { customerId, [field]: true, ...(excludeId ? { id: { not: excludeId } } : {}) },
    data: { [field]: false },
  });
}

export async function createAddress(input: unknown): Promise<AccountActionResult> {
  const customerId = await requireCustomerId();

  const parsed = addressSchema.safeParse(input);
  if (!parsed.success) return { success: false, fieldErrors: fieldErrorsFrom(parsed.error) };
  const data = parsed.data;

  try {
    const created = await prisma.customerAddress.create({
      data: {
        customerId,
        label: data.label,
        recipient: data.recipient,
        postalCode: data.postalCode,
        street: data.street,
        number: data.number,
        complement: data.complement || null,
        district: data.district,
        city: data.city,
        state: data.state,
        phone: data.phone || null,
        isDefaultShipping: data.isDefaultShipping,
        isDefaultBilling: data.isDefaultBilling,
      },
      select: { id: true },
    });

    if (data.isDefaultShipping) await clearExistingDefault(customerId, "isDefaultShipping", created.id);
    if (data.isDefaultBilling) await clearExistingDefault(customerId, "isDefaultBilling", created.id);

    revalidatePath("/account/addresses");
    return { success: true };
  } catch (error) {
    return { success: false, formError: describeError(error) };
  }
}

export async function updateAddress(addressId: string, input: unknown): Promise<AccountActionResult> {
  const customerId = await requireCustomerId();

  const existing = await prisma.customerAddress.findUnique({ where: { id: addressId }, select: { customerId: true } });
  if (!existing || existing.customerId !== customerId) {
    return { success: false, formError: "Endereço não encontrado." };
  }

  const parsed = addressSchema.safeParse(input);
  if (!parsed.success) return { success: false, fieldErrors: fieldErrorsFrom(parsed.error) };
  const data = parsed.data;

  try {
    await prisma.customerAddress.update({
      where: { id: addressId },
      data: {
        label: data.label,
        recipient: data.recipient,
        postalCode: data.postalCode,
        street: data.street,
        number: data.number,
        complement: data.complement || null,
        district: data.district,
        city: data.city,
        state: data.state,
        phone: data.phone || null,
        isDefaultShipping: data.isDefaultShipping,
        isDefaultBilling: data.isDefaultBilling,
      },
    });

    if (data.isDefaultShipping) await clearExistingDefault(customerId, "isDefaultShipping", addressId);
    if (data.isDefaultBilling) await clearExistingDefault(customerId, "isDefaultBilling", addressId);

    revalidatePath("/account/addresses");
    return { success: true };
  } catch (error) {
    return { success: false, formError: describeError(error) };
  }
}

export async function deleteAddress(addressId: string): Promise<AccountActionResult> {
  const customerId = await requireCustomerId();

  const existing = await prisma.customerAddress.findUnique({ where: { id: addressId }, select: { customerId: true } });
  if (!existing || existing.customerId !== customerId) {
    return { success: false, formError: "Endereço não encontrado." };
  }

  try {
    await prisma.customerAddress.delete({ where: { id: addressId } });
    revalidatePath("/account/addresses");
    return { success: true };
  } catch (error) {
    // An address referenced by a placed order (CustomerAddress.orders in
    // the schema) cannot be deleted — that FK protects order history, and
    // this is the only place that history is visible from self-service.
    return { success: false, formError: describeError(error) };
  }
}

export async function setDefaultAddress(
  addressId: string,
  field: "isDefaultShipping" | "isDefaultBilling"
): Promise<AccountActionResult> {
  const customerId = await requireCustomerId();

  const existing = await prisma.customerAddress.findUnique({ where: { id: addressId }, select: { customerId: true } });
  if (!existing || existing.customerId !== customerId) {
    return { success: false, formError: "Endereço não encontrado." };
  }

  try {
    await clearExistingDefault(customerId, field, addressId);
    await prisma.customerAddress.update({ where: { id: addressId }, data: { [field]: true } });
    revalidatePath("/account/addresses");
    return { success: true };
  } catch (error) {
    return { success: false, formError: describeError(error) };
  }
}

function fieldErrorsFrom(error: { issues: { path: (string | number)[]; message: string }[] }): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const path = issue.path.join(".");
    if (!fieldErrors[path]) fieldErrors[path] = issue.message;
  }
  return fieldErrors;
}

function describeError(error: unknown): string {
  if (error instanceof Error) {
    if ("code" in error && error.code === "P2003") {
      return "Este endereço está vinculado a um pedido e não pode ser removido.";
    }
    return error.message;
  }
  return "Erro inesperado ao salvar o endereço.";
}
