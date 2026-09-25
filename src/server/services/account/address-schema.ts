import { z } from "zod";

/** Mirrors the `BrazilianState` enum in schema.prisma — kept as a plain array here so the UI/select can iterate it without importing generated Prisma types into a client-visible module. */
export const BRAZILIAN_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const;
export type BrazilianState = (typeof BRAZILIAN_STATES)[number];

/**
 * Validation for the address form (/account/addresses).
 *
 * Shaped after `CustomerAddress` (schema.prisma) — CEP/logradouro/número/
 * bairro/UF, not the old US-shaped line1/line2/state-as-free-text. `postalCode`
 * is stored digits-only, same convention as CPF/CNPJ in profile-schema.ts.
 */
export const addressSchema = z.object({
  label: z.string().trim().min(1, "Informe um nome para este endereço (Casa, Trabalho…)"),
  recipient: z.string().trim().min(1, "Informe o nome do destinatário"),
  postalCode: z
    .string()
    .trim()
    .transform((v) => v.replace(/\D/g, ""))
    .refine((v) => v.length === 8, "CEP deve ter 8 dígitos"),
  street: z.string().trim().min(1, "Informe o logradouro"),
  number: z.string().trim().min(1, "Informe o número"),
  complement: z.string().trim(),
  district: z.string().trim().min(1, "Informe o bairro"),
  city: z.string().trim().min(1, "Informe a cidade"),
  state: z.enum(BRAZILIAN_STATES, { message: "Selecione o estado" }),
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/\D/g, ""))
    .refine((v) => v === "" || v.length >= 10, "Informe um telefone válido com DDD"),
  isDefaultShipping: z.boolean(),
  isDefaultBilling: z.boolean(),
});

export type AddressValues = z.infer<typeof addressSchema>;
