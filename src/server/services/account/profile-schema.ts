import { z } from "zod";
import { isValidDocument, stripDocumentPunctuation } from "@/lib/document-validation";

/**
 * Validation for the self-service profile form (/account/profile).
 *
 * Email is intentionally not editable here — it lives on `User`, is the
 * login identity, and changing it would need re-verification (the schema
 * already models `EmailVerificationToken` for exactly that flow). Adding
 * "change e-mail" is a bigger feature than this form; out of scope here.
 */
export const profileSchema = z
  .object({
    name: z.string().trim().min(2, "Informe seu nome completo"),
    phone: z
      .string()
      .trim()
      .transform((v) => v.replace(/\D/g, ""))
      .refine((v) => v === "" || v.length >= 10, "Informe um telefone válido com DDD"),
    documentType: z.enum(["CPF", "CNPJ"]).nullable(),
    document: z.string().trim(),
    birthDate: z.string().trim().nullable(),
    acceptsMarketing: z.boolean(),
  })
  .refine(
    (data) => {
      if (!data.documentType) return true;
      const digits = stripDocumentPunctuation(data.document);
      return isValidDocument(data.documentType, digits);
    },
    { message: "CPF/CNPJ inválido", path: ["document"] }
  );

export type ProfileValues = z.infer<typeof profileSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Informe sua senha atual"),
    newPassword: z.string().min(8, "A nova senha deve ter pelo menos 8 caracteres"),
    confirmPassword: z.string().min(1, "Confirme a nova senha"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;
