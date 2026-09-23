import { z } from "zod";

/** Accepts either a 6-digit TOTP code or a recovery code (e.g. "ABCD-2345") in the same field — verifyMfaChallenge tells them apart by shape. */
export const totpCodeSchema = z.object({
  code: z
    .string()
    .min(1, "Informe o código")
    .transform((value) => value.trim()),
});
export type TotpCodeValues = z.infer<typeof totpCodeSchema>;
