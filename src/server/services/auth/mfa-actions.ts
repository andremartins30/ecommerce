"use server";

import { prisma } from "@/server/db/client";
import { requireUser, getSessionUser, getSessionMeta, markMfaSatisfied } from "@/server/services/auth/session";
import {
  encryptMfaSecret,
  decryptMfaSecret,
  generateRecoveryCodes,
  hashRecoveryCode,
  matchRecoveryCode,
} from "@/server/services/auth/mfa-crypto";
import { generateTotpSecret, buildTotpUri, verifyTotpCode } from "@/server/services/auth/totp";
import { totpCodeSchema } from "@/lib/mfa-schema";
import QRCode from "qrcode";

/**
 * MFA (TOTP) enrollment and challenge Server Actions.
 *
 * Enrollment is two steps on purpose: `startMfaEnrollment` generates a secret
 * and returns a QR code, but nothing is persisted to `User.mfaSecret` yet —
 * only `confirmMfaEnrollment`, after the user proves they actually scanned it
 * and can produce a valid code, writes it. Otherwise a user could get locked
 * out by a secret their app never actually registered.
 */

export interface MfaActionResult {
  success: boolean;
  formError?: string;
}

export interface MfaEnrollmentStart {
  secret: string;
  qrCodeDataUrl: string;
}

/** Generates a new TOTP secret + QR code for the current user. Not persisted until confirmed. */
export async function startMfaEnrollment(): Promise<MfaEnrollmentStart> {
  const user = await requireUser();
  const secret = generateTotpSecret();
  const uri = buildTotpUri(user.email, secret);
  const qrCodeDataUrl = await QRCode.toDataURL(uri);
  return { secret, qrCodeDataUrl };
}

export interface MfaEnrollmentConfirmResult extends MfaActionResult {
  recoveryCodes?: string[];
}

/**
 * Verifies the code the user just typed against the not-yet-saved secret and,
 * only if it matches, persists the encrypted secret + a fresh batch of
 * recovery codes (shown to the user exactly once, here).
 */
export async function confirmMfaEnrollment(secret: string, input: unknown): Promise<MfaEnrollmentConfirmResult> {
  const parsed = totpCodeSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, formError: "Código inválido." };
  }

  const user = await requireUser();

  if (!verifyTotpCode(user.email, secret, parsed.data.code)) {
    return { success: false, formError: "Código incorreto. Verifique o horário do seu dispositivo e tente novamente." };
  }

  const recoveryCodes = generateRecoveryCodes();

  await prisma.user.update({
    where: { id: user.id },
    data: {
      mfaSecret: encryptMfaSecret(secret),
      mfaEnabledAt: new Date(),
      mfaRecoveryCodes: recoveryCodes.map(hashRecoveryCode),
    },
  });

  await markMfaSatisfied();

  return { success: true, recoveryCodes };
}

/**
 * Verifies a 6-digit TOTP code (or a recovery code, tried as a fallback) at
 * login time and, if valid, marks the current session as MFA-satisfied so
 * proxy.ts admits it to /admin.
 */
export async function verifyMfaChallenge(input: unknown): Promise<MfaActionResult> {
  const parsed = totpCodeSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, formError: "Código inválido." };
  }

  const user = await requireUser();
  const record = await prisma.user.findUnique({
    where: { id: user.id },
    select: { email: true, mfaSecret: true, mfaRecoveryCodes: true },
  });

  if (!record || !record.mfaSecret) {
    return { success: false, formError: "MFA não está configurado para esta conta." };
  }

  const code = parsed.data.code;
  const looksLikeRecoveryCode = code.includes("-") || code.length > 6;

  if (looksLikeRecoveryCode) {
    const matchedHash = matchRecoveryCode(code, record.mfaRecoveryCodes);
    if (!matchedHash) {
      return { success: false, formError: "Código de recuperação inválido." };
    }
    // Single-use: remove exactly the code that matched.
    await prisma.user.update({
      where: { id: user.id },
      data: { mfaRecoveryCodes: record.mfaRecoveryCodes.filter((hash) => hash !== matchedHash) },
    });
    await markMfaSatisfied();
    return { success: true };
  }

  const secret = decryptMfaSecret(record.mfaSecret);
  if (!verifyTotpCode(record.email, secret, code)) {
    return { success: false, formError: "Código incorreto." };
  }

  await markMfaSatisfied();
  return { success: true };
}

/** Whether the caller still needs to clear an MFA challenge before proceeding — used by the challenge page to redirect away once satisfied. */
export async function getMfaChallengeStatus(): Promise<{
  authenticated: boolean;
  mfaEnrolled: boolean;
  mfaSatisfied: boolean;
}> {
  const user = await getSessionUser();
  if (!user) return { authenticated: false, mfaEnrolled: false, mfaSatisfied: false };

  const meta = await getSessionMeta();
  return {
    authenticated: true,
    mfaEnrolled: user.mfaEnabledAt !== null,
    mfaSatisfied: meta?.mfaSatisfied ?? false,
  };
}
