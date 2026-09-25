import { prisma } from "@/server/db/client";

/**
 * Read side for /account/profile.
 *
 * Email lives on `User`, not `Customer` (see schema.prisma) — a single
 * login identity shared with staff — so this always joins both rather than
 * trusting a caller to pass the right id. `userId` here is the signed-in
 * session's user id (see session.ts), never a client-supplied value.
 */

export interface AccountProfile {
  userId: string;
  customerId: string;
  email: string;
  emailVerified: boolean;
  name: string;
  phone: string | null;
  documentType: "CPF" | "CNPJ" | null;
  document: string | null;
  birthDate: string | null;
  acceptsMarketing: boolean;
}

export async function getAccountProfile(userId: string): Promise<AccountProfile | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      emailVerified: true,
      customer: {
        select: {
          id: true,
          name: true,
          phone: true,
          documentType: true,
          document: true,
          birthDate: true,
          acceptsMarketing: true,
        },
      },
    },
  });

  if (!user || !user.customer) return null;

  return {
    userId: user.id,
    customerId: user.customer.id,
    email: user.email,
    emailVerified: user.emailVerified,
    name: user.customer.name,
    phone: user.customer.phone,
    documentType: user.customer.documentType,
    document: user.customer.document,
    birthDate: user.customer.birthDate ? user.customer.birthDate.toISOString().slice(0, 10) : null,
    acceptsMarketing: user.customer.acceptsMarketing,
  };
}
