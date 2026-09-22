import type { AvailabilityDisplay } from "@/server/domain/availability/availability";

/**
 * Shared shapes between the server and the client.
 *
 * These are **DTOs**, not database entities. The server resolves everything that
 * requires a decision — price, availability, production lead time — and hands
 * the result over. No component recomputes any of it.
 *
 * All money is an integer number of cents (BRL). Use `formatPrice` to display it;
 * it throws if handed reais.
 */

export type Money = number;

export type ProductType = "CONTRATIPO" | "IMPORTADO" | "NICHO" | "OUTRO";
export type ProductStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";
export type Gender = "MASCULINO" | "FEMININO" | "UNISSEX";
export type Occasion =
  | "DIA_A_DIA"
  | "TRABALHO"
  | "NOITE"
  | "FESTA"
  | "ENCONTRO"
  | "ESPORTE"
  | "ESPECIAL";
export type Season = "VERAO" | "OUTONO" | "INVERNO" | "PRIMAVERA";
export type NotePosition = "TOP" | "HEART" | "BASE";
export type AvailabilityType =
  | "READY_STOCK"
  | "MADE_TO_ORDER"
  | "OUT_OF_STOCK"
  | "DISCONTINUED";

export type { AvailabilityDisplay };

export interface ImageRef {
  url: string;
  alt: string;
  width?: number | null;
  height?: number | null;
}

export interface BrandRef {
  id: string;
  slug: string;
  name: string;
  countryCode?: string | null;
}

export interface CategoryRef {
  id: string;
  slug: string;
  name: string;
}

export interface Category extends CategoryRef {
  description: string | null;
  imageUrl: string | null;
  productCount: number;
}

export interface FragranceFamilyRef {
  id: string;
  slug: string;
  name: string;
  colorHex?: string | null;
}

export interface FragranceFamily extends FragranceFamilyRef {
  description: string | null;
  parentId: string | null;
  productCount: number;
}

export interface FragranceNoteRef {
  id: string;
  slug: string;
  name: string;
}

export interface ConcentrationRef {
  id: string;
  slug: string;
  name: string;
  abbreviation: string | null;
}

export interface CollectionRef {
  id: string;
  slug: string;
  name: string;
}

/**
 * A sellable volume, with its availability already resolved by the server.
 */
export interface ProductVariant {
  id: string;
  sku: string;
  volumeMl: number;
  priceCents: Money;
  compareAtPriceCents: Money | null;
  /** onHand - reserved. Present so the UI can cap quantity selectors. */
  availableStock: number;
  availability: AvailabilityDisplay;
  /** Whether a single unit can be added to the cart right now. */
  purchasable: boolean;
  /**
   * Largest quantity that can be bought. Null means unbounded, which is the
   * case whenever production can absorb the excess.
   */
  maxQuantity: number | null;
  weightGrams: number;
  ean: string | null;
}

/** Card and grid shape. Deliberately small: lists must not carry descriptions. */
export interface ProductSummary {
  id: string;
  slug: string;
  name: string;
  brand: BrandRef;
  category: CategoryRef;
  productType: ProductType;
  shortDescription: string;
  image: ImageRef | null;
  /** Cheapest sellable variant price, which is what "a partir de" refers to. */
  priceFromCents: Money;
  compareAtFromCents: Money | null;
  /** Volumes offered, ascending, for the "30 / 50 / 100 ml" line on a card. */
  volumesMl: number[];
  primaryFamily: FragranceFamilyRef | null;
  concentration: ConcentrationRef | null;
  gender: Gender;
  /** Availability of the variant a shopper lands on first. */
  availability: AvailabilityDisplay;
  purchasable: boolean;
  isNew: boolean;
  isBestSeller: boolean;
  isFeatured: boolean;
  /** Null when nobody has reviewed it yet — never a fabricated score. */
  rating: number | null;
  reviewCount: number;
}

/** The olfactory reference of a contratipo. Never the product's own identity. */
export interface OlfactoryReference {
  inspiredBy: string | null;
  referenceBrand: string | null;
  referenceFragrance: string | null;
  /** Resolved legal text, product override first, then the store-wide setting. */
  disclaimer: string;
}

export interface OlfactoryPyramid {
  top: FragranceNoteRef[];
  heart: FragranceNoteRef[];
  base: FragranceNoteRef[];
}

export interface ProductDetail extends ProductSummary {
  description: string;
  images: ImageRef[];
  variants: ProductVariant[];
  families: FragranceFamilyRef[];
  pyramid: OlfactoryPyramid;
  occasions: Occasion[];
  seasons: Season[];
  countryOfOrigin: string | null;
  /** Only present when the operator filled it in. Never invented. */
  longevity: string | null;
  projection: string | null;
  /** Only present for products that declare an olfactory reference. */
  reference: OlfactoryReference | null;
  collections: CollectionRef[];
  tags: string[];
  seoTitle: string | null;
  seoDescription: string | null;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ---------------------------------------------------------------------------
// Store configuration
// ---------------------------------------------------------------------------

export type ShipmentPolicy = "SINGLE_SHIPMENT" | "SPLIT_SHIPMENT";

export interface StoreSettings {
  name: string;
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  email: string;
  phone: string;
  whatsapp: string;
  cnpj: string;
  address: string;
  defaultProductionLeadTimeDays: number;
  handlingDays: number;
  shipmentPolicy: ShipmentPolicy;
  freeShippingThresholdCents: Money;
  flatShippingCents: Money;
  expressShippingCents: Money;
  lowStockThreshold: number;
  contratipoDisclaimer: string;
  enabledPaymentMethods: string[];
  maxInstallments: number;
}

// ---------------------------------------------------------------------------
// Customer-facing transactional shapes
//
// Kept minimal for now. Orders, addresses and reviews grow into full DTOs when
// their own migration phases land.
// ---------------------------------------------------------------------------

export type OrderStatus =
  | "PENDING"
  | "AWAITING_PAYMENT"
  | "PAID"
  | "WAITING_PRODUCTION"
  | "IN_PRODUCTION"
  | "PRODUCTION_COMPLETED"
  | "READY_TO_SHIP"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED";

export type BrazilianState =
  | "AC" | "AL" | "AP" | "AM" | "BA" | "CE" | "DF" | "ES" | "GO" | "MA"
  | "MT" | "MS" | "MG" | "PA" | "PB" | "PR" | "PE" | "PI" | "RJ" | "RN"
  | "RS" | "RO" | "RR" | "SC" | "SP" | "SE" | "TO";

export const BRAZILIAN_STATES: { code: BrazilianState; name: string }[] = [
  { code: "AC", name: "Acre" },
  { code: "AL", name: "Alagoas" },
  { code: "AP", name: "Amapá" },
  { code: "AM", name: "Amazonas" },
  { code: "BA", name: "Bahia" },
  { code: "CE", name: "Ceará" },
  { code: "DF", name: "Distrito Federal" },
  { code: "ES", name: "Espírito Santo" },
  { code: "GO", name: "Goiás" },
  { code: "MA", name: "Maranhão" },
  { code: "MT", name: "Mato Grosso" },
  { code: "MS", name: "Mato Grosso do Sul" },
  { code: "MG", name: "Minas Gerais" },
  { code: "PA", name: "Pará" },
  { code: "PB", name: "Paraíba" },
  { code: "PR", name: "Paraná" },
  { code: "PE", name: "Pernambuco" },
  { code: "PI", name: "Piauí" },
  { code: "RJ", name: "Rio de Janeiro" },
  { code: "RN", name: "Rio Grande do Norte" },
  { code: "RS", name: "Rio Grande do Sul" },
  { code: "RO", name: "Rondônia" },
  { code: "RR", name: "Roraima" },
  { code: "SC", name: "Santa Catarina" },
  { code: "SP", name: "São Paulo" },
  { code: "SE", name: "Sergipe" },
  { code: "TO", name: "Tocantins" },
];

export interface Address {
  id: string;
  label: string;
  recipient: string;
  postalCode: string;
  street: string;
  number: string;
  complement: string | null;
  district: string;
  city: string;
  state: BrazilianState;
  country: string;
  phone: string | null;
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
}

export interface OrderItemSummary {
  id: string;
  productId: string;
  variantId: string;
  name: string;
  brand: string;
  sku: string;
  volumeMl: number;
  image: string | null;
  unitPriceCents: Money;
  quantity: number;
  qtyFromStock: number;
  qtyBackordered: number;
  productionLeadTimeDays: number;
  estimatedProductionReadyAt: string | null;
}

export interface OrderSummaryDto {
  id: string;
  number: string;
  status: OrderStatus;
  subtotalCents: Money;
  discountCents: Money;
  shippingCents: Money;
  totalCents: Money;
  placedAt: string;
  itemCount: number;
}

export interface OrderTimelineEvent {
  status: OrderStatus;
  label: string;
  at: string | null;
  done: boolean;
  automated: boolean;
}

export interface ReviewDto {
  id: string;
  rating: number;
  title: string;
  body: string;
  authorName: string;
  createdAt: string;
  /** True only when a matching paid order exists. */
  verifiedPurchase: boolean;
  helpfulCount: number;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

// ---------------------------------------------------------------------------
// Legacy mock-backed shapes
//
// The account area, checkout form and part of the admin (categories, discounts,
// orders, reviews, customers) still read from src/lib/data/* and Zustand
// stores — they are migrated to the database in their own tasks (14, 15, 16,
// 20, 21, 22, 24). Keeping their old shapes here, under a clearly-labelled
// section, avoids a half-migration that would corrupt both models. Do not add
// new fields here; extend the DTOs above instead.
// ---------------------------------------------------------------------------

export type LegacyMoney = number;

export interface LegacyAddress {
  id: string;
  label: string;
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
}

export interface LegacyPaymentMethodOnFile {
  id: string;
  type: "visa" | "mastercard" | "amex" | "paypal";
  last4: string;
  expiry: string;
  isDefault: boolean;
}

export interface LegacyCustomer {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  phone: string;
  joinedAt: string;
  status: "active" | "vip" | "inactive";
  ordersCount: number;
  totalSpent: LegacyMoney;
  lastOrderAt?: string;
  addresses: LegacyAddress[];
  paymentMethods: LegacyPaymentMethodOnFile[];
}

export type LegacyOrderStatus = "processing" | "shipped" | "delivered" | "cancelled" | "refunded";

export interface LegacyOrderItem {
  productId: string;
  name: string;
  image: string;
  variant?: string;
  price: LegacyMoney;
  quantity: number;
}

export interface LegacyOrderTimelineEvent {
  label: string;
  date: string;
  done: boolean;
}

export interface LegacyOrder {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  status: LegacyOrderStatus;
  items: LegacyOrderItem[];
  subtotal: LegacyMoney;
  discount: LegacyMoney;
  shipping: LegacyMoney;
  total: LegacyMoney;
  paymentMethod: string;
  shippingAddress: LegacyAddress;
  createdAt: string;
  updatedAt: string;
  timeline: LegacyOrderTimelineEvent[];
  trackingNumber?: string;
}

export interface LegacyReview {
  id: string;
  productId: string;
  customerName: string;
  customerAvatar?: string;
  rating: number;
  title: string;
  content: string;
  createdAt: string;
  status: "approved" | "pending" | "rejected";
  verified: boolean;
  helpfulCount: number;
}

export type LegacyDiscountType = "percentage" | "fixed" | "free_shipping";

export interface LegacyDiscount {
  id: string;
  code: string;
  type: LegacyDiscountType;
  /** Percent (0-100) when `type` is "percentage", cents when "fixed". */
  value: number;
  /** Minimum order subtotal in cents. */
  minOrder?: number;
  usageLimit: number;
  usageCount: number;
  startsAt: string;
  expiresAt: string;
  status: "active" | "scheduled" | "expired";
}

/** Flat mock category used by the legacy admin category manager. */
export interface LegacyCategory {
  id: string;
  slug: string;
  name: string;
  description: string;
  image: string;
  productCount: number;
  parentId?: string;
}

/**
 * Legacy apparel-shaped product, still used by the mock catalogue
 * (src/lib/data/products.ts) and by admin screens not yet migrated. The real
 * storefront uses `ProductSummary` / `ProductDetail` above.
 */
export interface LegacyProductImage {
  url: string;
  alt: string;
}

export interface LegacyProductVariant {
  id: string;
  size?: string;
  color?: string;
  colorHex?: string;
  sku: string;
  stock: number;
  priceDelta?: number;
}

export type LegacyProductStatus = "active" | "draft" | "archived";

export interface LegacyProduct {
  id: string;
  slug: string;
  name: string;
  brand: string;
  categoryId: string;
  description: string;
  shortDescription: string;
  price: LegacyMoney;
  compareAtPrice?: LegacyMoney;
  currency: "BRL";
  images: LegacyProductImage[];
  colors: { name: string; hex: string }[];
  sizes: string[];
  variants: LegacyProductVariant[];
  rating: number;
  reviewCount: number;
  stock: number;
  sku: string;
  tags: string[];
  isNew: boolean;
  isBestSeller: boolean;
  isFeatured: boolean;
  status: LegacyProductStatus;
  material?: string;
  care?: string[];
  shippingNote?: string;
  createdAt: string;
  updatedAt: string;
}
