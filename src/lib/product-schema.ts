import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(2, "Product name is required"),
  slug: z.string().min(2, "Slug is required"),
  brand: z.string().min(1, "Brand is required"),
  categoryId: z.string().min(1, "Category is required"),
  shortDescription: z.string().min(1, "Short description is required").max(160, "Keep it under 160 characters"),
  description: z.string().min(1, "Description is required"),
  price: z.coerce.number().min(0.01, "Price must be greater than 0"),
  compareAtPrice: z.coerce.number().optional(),
  sku: z.string().min(1, "SKU is required"),
  stock: z.coerce.number().min(0, "Stock can't be negative"),
  status: z.enum(["active", "draft", "archived"]),
  material: z.string().optional(),
  tags: z.array(z.string()),
  sizes: z.array(z.string()),
  colors: z.array(z.object({ name: z.string(), hex: z.string() })),
  images: z.array(z.object({ url: z.string().min(1, "Image URL is required"), alt: z.string().optional() })).min(1, "At least one image is required"),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
});

export type ProductFormValues = z.infer<typeof productSchema>;
