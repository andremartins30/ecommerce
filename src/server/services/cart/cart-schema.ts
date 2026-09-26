import { z } from "zod";

export const addItemSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.number().int().positive("Quantidade deve ser maior que zero").max(999),
});
export type AddItemValues = z.infer<typeof addItemSchema>;

export const updateQuantitySchema = z.object({
  itemId: z.string().min(1),
  quantity: z.number().int().positive("Quantidade deve ser maior que zero").max(999),
});
export type UpdateQuantityValues = z.infer<typeof updateQuantitySchema>;

export const applyCouponSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Informe um código de cupom")
    .transform((v) => v.toUpperCase()),
});
export type ApplyCouponValues = z.infer<typeof applyCouponSchema>;
