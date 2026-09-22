"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db/client";
import { hashPassword, verifyPassword } from "@/server/services/auth/password";
import { generateOpaqueToken, hashToken } from "@/server/services/auth/tokens";
import { createSession, destroySession, getSessionUser } from "@/server/services/auth/session";
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/lib/auth-schema";

/**
 * Authentication Server Actions.
 *
 * One login path for both customers and staff (see User in schema.prisma) —
 * what a session can *do* once it exists is decided by proxy.ts and, later,
 * RBAC (task 18), not by having two parallel auth systems.
 *
 * No MailProvider exists yet (task 17 adds the fake outbox), so
 * verification/reset links are logged to the server console instead of
 * sent. That is a development convenience, not a security shortcut — the
 * token itself still expires, is single-use, and is never echoed back to the
 * browser in the response.
 */

const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

export interface AuthActionResult {
  success: boolean;
  fieldErrors?: Record<string, string>;
  formError?: string;
}

async function requestMetadata(): Promise<{ ipAddress: string | null; userAgent: string | null }> {
  const h = await headers();
  return {
    ipAddress: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    userAgent: h.get("user-agent"),
  };
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function logDevLink(label: string, path: string, token: string): void {
  // Reads APP_URL directly rather than through getEnv(): this is a
  // dev-only console log, not a security-relevant path, and it must not be
  // able to fail email verification or password reset just because some
  // unrelated env var (store branding, a provider key) is misconfigured.
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  console.log(`[auth] ${label}: ${appUrl}${path}?token=${encodeURIComponent(token)}`);
}

export async function loginAction(input: unknown): Promise<AuthActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, fieldErrors: firstErrorPerField(parsed.error) };
  }

  const email = normalizeEmail(parsed.data.email);
  const user = await prisma.user.findUnique({ where: { email } });

  // Same generic message whether the email doesn't exist or the password is
  // wrong — confirming which one it was lets an attacker enumerate accounts.
  const invalidCredentials: AuthActionResult = {
    success: false,
    formError: "E-mail ou senha incorretos.",
  };

  if (!user || !user.isActive) return invalidCredentials;

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const minutes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
    return {
      success: false,
      formError: `Conta temporariamente bloqueada por excesso de tentativas. Tente novamente em ${minutes} minuto(s).`,
    };
  }

  const passwordMatches = await verifyPassword(user.passwordHash, parsed.data.password);

  if (!passwordMatches) {
    const failedLoginCount = user.failedLoginCount + 1;
    const lockedUntil =
      failedLoginCount >= MAX_FAILED_LOGIN_ATTEMPTS ? new Date(Date.now() + LOCKOUT_DURATION_MS) : null;

    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginCount, lockedUntil },
    });

    return invalidCredentials;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() },
  });

  const meta = await requestMetadata();
  await createSession(user.id, meta);

  return { success: true };
}

export async function registerAction(input: unknown): Promise<AuthActionResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, fieldErrors: firstErrorPerField(parsed.error) };
  }

  const email = normalizeEmail(parsed.data.email);

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    return { success: false, fieldErrors: { email: "Já existe uma conta com este e-mail." } };
  }

  const passwordHash = await hashPassword(parsed.data.password);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      customer: { create: { name: parsed.data.name } },
    },
  });

  await issueEmailVerification(user.id, email);

  const meta = await requestMetadata();
  await createSession(user.id, meta);

  return { success: true };
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}

export async function requestPasswordResetAction(input: unknown): Promise<AuthActionResult> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, fieldErrors: firstErrorPerField(parsed.error) };
  }

  const email = normalizeEmail(parsed.data.email);
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });

  // Always report success, whether or not the account exists — the same
  // enumeration concern as login. The email itself (once task 17 sends one)
  // is the only place that reveals the account's actual existence.
  if (!user) return { success: true };

  const token = generateOpaqueToken();
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
    },
  });

  logDevLink("Link de redefinição de senha", "/reset-password", token);
  return { success: true };
}

export async function resetPasswordAction(
  token: string,
  input: unknown
): Promise<AuthActionResult> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, fieldErrors: firstErrorPerField(parsed.error) };
  }

  if (!token) {
    return { success: false, formError: "Link inválido ou incompleto." };
  }

  const tokenHash = hashToken(token);
  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });

  if (!record || record.consumedAt || record.expiresAt < new Date()) {
    return { success: false, formError: "Este link expirou ou já foi utilizado. Solicite um novo." };
  }

  const passwordHash = await hashPassword(parsed.data.password);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash, passwordUpdatedAt: new Date(), failedLoginCount: 0, lockedUntil: null },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { consumedAt: new Date() },
    }),
    // A password reset invalidates every existing session — if the reset was
    // triggered because the account was compromised, an attacker's session
    // must not survive it.
    prisma.session.updateMany({
      where: { userId: record.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);

  return { success: true };
}

async function issueEmailVerification(userId: string, email: string): Promise<void> {
  const token = generateOpaqueToken();
  await prisma.emailVerificationToken.create({
    data: {
      userId,
      email,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
    },
  });
  logDevLink("Link de verificação de e-mail", "/verify-email", token);
}

export async function verifyEmailAction(token: string): Promise<AuthActionResult> {
  if (!token) return { success: false, formError: "Link inválido ou incompleto." };

  const tokenHash = hashToken(token);
  const record = await prisma.emailVerificationToken.findUnique({ where: { tokenHash } });

  if (!record || record.consumedAt || record.expiresAt < new Date()) {
    return { success: false, formError: "Este link expirou ou já foi utilizado." };
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { emailVerified: true } }),
    prisma.emailVerificationToken.update({ where: { id: record.id }, data: { consumedAt: new Date() } }),
  ]);

  return { success: true };
}

export async function resendVerificationAction(): Promise<AuthActionResult> {
  const user = await getSessionUser();
  if (!user) return { success: false, formError: "Você precisa estar autenticado." };
  if (user.emailVerified) return { success: true };

  await issueEmailVerification(user.id, user.email);
  return { success: true };
}

/** Zod's flatten() keeps every issue per field; forms only show the first. */
function firstErrorPerField(error: { issues: { path: (string | number)[]; message: string }[] }) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const path = issue.path.join(".");
    if (!fieldErrors[path]) fieldErrors[path] = issue.message;
  }
  return fieldErrors;
}
