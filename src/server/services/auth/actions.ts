"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db/client";
import { hashPassword, verifyPassword } from "@/server/services/auth/password";
import { generateOpaqueToken, hashToken } from "@/server/services/auth/tokens";
import { createSession, destroySession, getSessionUser } from "@/server/services/auth/session";
import { getMailProvider, emailVerificationTemplate, passwordResetTemplate } from "@/server/providers/mail";
import { getStoreSettings } from "@/server/services/settings/store-settings";
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
 * Verification/reset emails go through the MailProvider abstraction
 * (src/server/providers/mail) — MAIL_PROVIDER=fake writes them to
 * `.mail-outbox/` in development, a real driver ships later. Sending never
 * blocks or fails the action it's attached to: if the provider throws, the
 * account is still created / the reset token still exists, and the error is
 * only logged — the token itself remains the source of truth, not whether
 * the email happened to arrive.
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

function appUrl(): string {
  return process.env.APP_URL || "http://localhost:3000";
}

/** Store branding for the email's sender line/footer, with safe fallbacks — see store-settings.ts's own defensive pattern. */
async function storeBranding(): Promise<{ name: string; email: string }> {
  const settings = await getStoreSettings();
  return {
    name: settings.name || "Perfumaria",
    email: settings.email || "contato@example.com",
  };
}

/** Sends and never throws: a mail failure must not roll back the account/token it's attached to. */
async function sendMailSafely(message: { to: string; subject: string; html: string; text: string }): Promise<void> {
  try {
    await getMailProvider().send(message);
  } catch (error) {
    console.error("[auth] failed to send email:", error);
  }
}

async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const store = await storeBranding();
  const verificationUrl = `${appUrl()}/verify-email?token=${encodeURIComponent(token)}`;
  await sendMailSafely(emailVerificationTemplate({ to: email, verificationUrl, store }));
}

async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const store = await storeBranding();
  const resetUrl = `${appUrl()}/reset-password?token=${encodeURIComponent(token)}`;
  await sendMailSafely(passwordResetTemplate({ to: email, resetUrl, store }));
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
  // enumeration concern as login. The email itself is the only place that
  // reveals the account's actual existence; nothing sent to the browser does.
  if (!user) return { success: true };

  const token = generateOpaqueToken();
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
    },
  });

  await sendPasswordResetEmail(email, token);
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
  await sendVerificationEmail(email, token);
}

export async function verifyEmailAction(token: string): Promise<AuthActionResult> {
  if (!token) return { success: false, formError: "Link inválido ou incompleto." };

  const tokenHash = hashToken(token);
  const record = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash },
    include: { user: { select: { emailVerified: true } } },
  });

  if (!record) {
    return { success: false, formError: "Este link expirou ou já foi utilizado." };
  }

  // Idempotent: React's Strict Mode (and a user double-clicking, or opening
  // the link twice) calls this twice with the same token. If it was already
  // consumed by *this exact token* and the account ended up verified, that
  // is the same outcome as a fresh success — not an error to show the user.
  if (record.consumedAt) {
    return record.user.emailVerified
      ? { success: true }
      : { success: false, formError: "Este link expirou ou já foi utilizado." };
  }

  if (record.expiresAt < new Date()) {
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
