import { z } from "zod";

/**
 * Validation for the admin store-identity form.
 *
 * Scoped to the `identity` SystemSetting group (see store-settings.ts's
 * `KEYS`) — the other groups (production, shipping, catalogue, legal,
 * payment) are operational/business-rule settings that belong to their own
 * admin screens in later tasks, not to "who is this store" branding.
 */
export const storeIdentitySchema = z.object({
  name: z.string().trim().min(1, "Informe o nome da loja"),
  logoUrl: z.string().trim(),
  faviconUrl: z.string().trim(),
  primaryColor: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Use uma cor hexadecimal, ex: #1B1B1F"),
  email: z.string().trim().refine((v) => v === "" || z.string().email().safeParse(v).success, {
    message: "Informe um e-mail válido",
  }),
  phone: z.string().trim(),
  whatsapp: z.string().trim(),
  cnpj: z.string().trim(),
  address: z.string().trim(),
});

export type StoreIdentityValues = z.infer<typeof storeIdentitySchema>;
