"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/server/db/client";
import { requireUser, SESSION_COOKIE_NAME } from "@/server/services/auth/session";
import { hashToken } from "@/server/services/auth/tokens";
import { hashPassword, verifyPassword } from "@/server/services/auth/password";
import { profileSchema, changePasswordSchema } from "@/server/services/account/profile-schema";
import { stripDocumentPunctuation } from "@/lib/document-validation";

/**
 * Write side for /account/profile.
 *
 * Both actions resolve the customer/user from the session
 * (`requireUser()`), never from a client-supplied id — a customer editing
 * their own profile is inherently self-service, so there is no RBAC check
 * here the way admin actions have `requirePermission()`, but the row is
 * always scoped to `session.customer.id` / `session.id`, never an
 * attacker-chosen one.
 */

export interface AccountActionResult {
  success: boolean;
  fieldErrors?: Record<string, string>;
  formError?: string;
}

export async function updateProfile(input: unknown): Promise<AccountActionResult> {
  const user = await requireUser();
  if (!user.customer) {
    return { success: false, formError: "Conta sem perfil de cliente." };
  }

  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path.join(".");
      if (!fieldErrors[path]) fieldErrors[path] = issue.message;
    }
    return { success: false, fieldErrors };
  }

  const data = parsed.data;

  try {
    await prisma.customer.update({
      where: { id: user.customer.id },
      data: {
        name: data.name,
        phone: data.phone || null,
        documentType: data.documentType,
        document: data.documentType ? stripDocumentPunctuation(data.document) : null,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        acceptsMarketing: data.acceptsMarketing,
      },
    });

    revalidatePath("/account/profile");
    revalidatePath("/account");
    return { success: true };
  } catch (error) {
    return { success: false, formError: describeError(error) };
  }
}

export async function changePassword(input: unknown): Promise<AccountActionResult> {
  const user = await requireUser();

  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path.join(".");
      if (!fieldErrors[path]) fieldErrors[path] = issue.message;
    }
    return { success: false, fieldErrors };
  }

  const record = await prisma.user.findUnique({ where: { id: user.id }, select: { passwordHash: true } });
  if (!record) {
    return { success: false, formError: "Você precisa estar autenticado." };
  }

  const matches = await verifyPassword(record.passwordHash, parsed.data.currentPassword);
  if (!matches) {
    return { success: false, fieldErrors: { currentPassword: "Senha atual incorreta." } };
  }

  const newPasswordHash = await hashPassword(parsed.data.newPassword);
  const store = await cookies();
  const currentToken = store.get(SESSION_COOKIE_NAME)?.value;
  const currentTokenHash = currentToken ? hashToken(currentToken) : null;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash, passwordUpdatedAt: new Date() },
    }),
    // Same reasoning as resetPasswordAction in auth/actions.ts: a password
    // change invalidates every other session, in case the change was
    // triggered because the account was compromised. Unlike that flow, this
    // one keeps the session that just proved the current password (self-
    // service, mid-session) — logging the user out of their own change
    // would be a worse experience with no security benefit.
    prisma.session.updateMany({
      where: {
        userId: user.id,
        revokedAt: null,
        ...(currentTokenHash ? { tokenHash: { not: currentTokenHash } } : {}),
      },
      data: { revokedAt: new Date() },
    }),
  ]);

  return { success: true };
}

function describeError(error: unknown): string {
  if (error instanceof Error) {
    if ("code" in error && error.code === "P2002") {
      return "Já existe um cadastro com esse CPF/CNPJ.";
    }
    return error.message;
  }
  return "Erro inesperado ao salvar o perfil.";
}
