import { z } from "zod";

/**
 * Validation for the real perfumery product form.
 *
 * Money fields are collected in reais (what an operator types) and converted
 * to integer cents at the Server Action boundary via `fromReais` — this schema
 * only enforces shape and range, not the reais→cents conversion itself.
 *
 * Mirrors prisma/schema.prisma's Product/ProductVariant closely on purpose: a
 * field that doesn't exist on the model shouldn't exist on the form either.
 */

const PRODUCT_TYPES = ["CONTRATIPO", "IMPORTADO", "NICHO", "OUTRO"] as const;
const GENDERS = ["MASCULINO", "FEMININO", "UNISSEX"] as const;
const OCCASIONS = [
  "DIA_A_DIA",
  "TRABALHO",
  "NOITE",
  "FESTA",
  "ENCONTRO",
  "ESPORTE",
  "ESPECIAL",
] as const;
const SEASONS = ["VERAO", "OUTONO", "INVERNO", "PRIMAVERA"] as const;
const NOTE_POSITIONS = ["TOP", "HEART", "BASE"] as const;
const AVAILABILITY_TYPES = [
  "READY_STOCK",
  "MADE_TO_ORDER",
  "OUT_OF_STOCK",
  "DISCONTINUED",
] as const;
const PRODUCT_STATUSES = ["DRAFT", "ACTIVE", "ARCHIVED"] as const;

const slugPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export const productImageSchema = z.object({
  url: z.string().min(1, "URL da imagem é obrigatória").url("URL inválida"),
  alt: z.string().min(1, "Texto alternativo é obrigatório"),
  isPrimary: z.boolean().default(false),
});

export const productFamilySchema = z.object({
  familyId: z.string().min(1),
  isPrimary: z.boolean().default(false),
});

export const productNoteSchema = z.object({
  noteId: z.string().min(1),
  position: z.enum(NOTE_POSITIONS),
  sortOrder: z.number().int().min(0).default(0),
});

export const productCollectionSchema = z.object({
  collectionId: z.string().min(1),
});

export const productVariantSchema = z.object({
  /** Present when editing an existing variant; absent for a new one. */
  id: z.string().optional(),
  sku: z.string().min(1, "SKU é obrigatório"),
  volumeMl: z.number().int().positive("Volume deve ser maior que zero"),
  /** Reais. Converted to cents in the Server Action. */
  priceReais: z.number().positive("Preço deve ser maior que zero"),
  compareAtPriceReais: z.number().positive().nullable().optional(),
  weightGrams: z.number().int().positive("Peso deve ser maior que zero"),
  lengthMm: z.number().int().positive("Comprimento deve ser maior que zero"),
  widthMm: z.number().int().positive("Largura deve ser maior que zero"),
  heightMm: z.number().int().positive("Altura deve ser maior que zero"),
  availabilityType: z.enum(AVAILABILITY_TYPES),
  allowBackorder: z.boolean().default(false),
  productionLeadTimeDays: z.number().int().min(0).max(365).nullable().optional(),
  ean: z.string().nullable().optional(),
  batchCode: z.string().nullable().optional(),
  /** Only meaningful when creating: initial stock on hand for this variant. */
  initialOnHand: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
})
  .refine(
    (variant) => variant.compareAtPriceReais == null || variant.compareAtPriceReais > variant.priceReais,
    { message: "Preço \"de\" deve ser maior que o preço de venda", path: ["compareAtPriceReais"] }
  );

export const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Nome é obrigatório"),
  slug: z
    .string()
    .min(2, "Slug é obrigatório")
    .regex(slugPattern, "Use apenas letras minúsculas, números e hífens"),
  status: z.enum(PRODUCT_STATUSES),
  productType: z.enum(PRODUCT_TYPES),
  brandId: z.string().min(1, "Marca é obrigatória"),
  categoryId: z.string().min(1, "Categoria é obrigatória"),
  concentrationId: z.string().nullable().optional(),
  shortDescription: z.string().min(1, "Descrição curta é obrigatória").max(240),
  description: z.string().min(1, "Descrição é obrigatória"),
  gender: z.enum(GENDERS),
  occasions: z.array(z.enum(OCCASIONS)).default([]),
  seasons: z.array(z.enum(SEASONS)).default([]),
  countryOfOrigin: z.string().nullable().optional(),
  longevity: z.string().nullable().optional(),
  projection: z.string().nullable().optional(),
  // Contratipo reference — describes what the fragrance is inspired by, never
  // the product's own identity.
  inspiredBy: z.string().nullable().optional(),
  referenceBrand: z.string().nullable().optional(),
  referenceFragrance: z.string().nullable().optional(),
  disclaimerOverride: z.string().nullable().optional(),
  productionLeadTimeDays: z.number().int().min(0).max(365).nullable().optional(),
  isFeatured: z.boolean().default(false),
  isBestSeller: z.boolean().default(false),
  isNew: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  seoTitle: z.string().nullable().optional(),
  seoDescription: z.string().nullable().optional(),
  images: z.array(productImageSchema).min(1, "Adicione pelo menos uma imagem"),
  families: z.array(productFamilySchema).default([]),
  notes: z.array(productNoteSchema).default([]),
  collections: z.array(productCollectionSchema).default([]),
  variants: z.array(productVariantSchema).min(1, "Adicione pelo menos uma variante"),
})
  .refine(
    (product) => new Set(product.variants.map((v) => v.volumeMl)).size === product.variants.length,
    { message: "Não pode haver dois volumes iguais no mesmo produto", path: ["variants"] }
  )
  .refine(
    (product) => product.images.filter((i) => i.isPrimary).length <= 1,
    { message: "Apenas uma imagem pode ser marcada como principal", path: ["images"] }
  )
  .refine(
    (product) => new Set(product.families.map((f) => f.familyId)).size === product.families.length,
    { message: "Não pode haver famílias olfativas duplicadas", path: ["families"] }
  )
  .refine(
    (product) => product.families.filter((f) => f.isPrimary).length <= 1,
    { message: "Apenas uma família pode ser marcada como principal", path: ["families"] }
  );

export type ProductFormValues = z.infer<typeof productSchema>;
export type ProductVariantFormValues = z.infer<typeof productVariantSchema>;

export const PRODUCT_TYPE_OPTIONS = PRODUCT_TYPES;
export const GENDER_OPTIONS = GENDERS;
export const OCCASION_OPTIONS = OCCASIONS;
export const SEASON_OPTIONS = SEASONS;
export const NOTE_POSITION_OPTIONS = NOTE_POSITIONS;
export const AVAILABILITY_TYPE_OPTIONS = AVAILABILITY_TYPES;
export const PRODUCT_STATUS_OPTIONS = PRODUCT_STATUSES;
