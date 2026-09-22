-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('CONTRATIPO', 'IMPORTADO', 'NICHO', 'OUTRO');

-- CreateEnum
CREATE TYPE "AvailabilityType" AS ENUM ('READY_STOCK', 'MADE_TO_ORDER', 'OUT_OF_STOCK', 'DISCONTINUED');

-- CreateEnum
CREATE TYPE "NotePosition" AS ENUM ('TOP', 'HEART', 'BASE');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MASCULINO', 'FEMININO', 'UNISSEX');

-- CreateEnum
CREATE TYPE "Occasion" AS ENUM ('DIA_A_DIA', 'TRABALHO', 'NOITE', 'FESTA', 'ENCONTRO', 'ESPORTE', 'ESPECIAL');

-- CreateEnum
CREATE TYPE "Season" AS ENUM ('VERAO', 'OUTONO', 'INVERNO', 'PRIMAVERA');

-- CreateEnum
CREATE TYPE "SettingType" AS ENUM ('STRING', 'INTEGER', 'BOOLEAN', 'JSON');

-- CreateTable
CREATE TABLE "system_settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "type" "SettingType" NOT NULL DEFAULT 'STRING',
    "group" TEXT NOT NULL DEFAULT 'general',
    "label" TEXT NOT NULL,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "brands" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "logoUrl" TEXT,
    "countryCode" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "seoTitle" TEXT,
    "seoDesc" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "parentId" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "seoTitle" TEXT,
    "seoDesc" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collections" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "concentrations" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "abbreviation" TEXT,
    "description" TEXT,
    "minPercent" INTEGER,
    "maxPercent" INTEGER,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "concentrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fragrance_families" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "colorHex" TEXT,
    "parentId" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "seoTitle" TEXT,
    "seoDesc" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fragrance_families_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fragrance_notes" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fragrance_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT',
    "productType" "ProductType" NOT NULL,
    "brandId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "concentrationId" TEXT,
    "shortDescription" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "gender" "Gender" NOT NULL DEFAULT 'UNISSEX',
    "occasions" "Occasion"[] DEFAULT ARRAY[]::"Occasion"[],
    "seasons" "Season"[] DEFAULT ARRAY[]::"Season"[],
    "countryOfOrigin" TEXT,
    "longevity" TEXT,
    "projection" TEXT,
    "inspiredBy" TEXT,
    "referenceBrand" TEXT,
    "referenceFragrance" TEXT,
    "disclaimerOverride" TEXT,
    "productionLeadTimeDays" INTEGER,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isBestSeller" BOOLEAN NOT NULL DEFAULT false,
    "isNew" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "seoTitle" TEXT,
    "seoDesc" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variants" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "volumeMl" INTEGER NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "compareAtPriceCents" INTEGER,
    "costPriceCents" INTEGER,
    "weightGrams" INTEGER NOT NULL,
    "lengthMm" INTEGER NOT NULL,
    "widthMm" INTEGER NOT NULL,
    "heightMm" INTEGER NOT NULL,
    "availabilityType" "AvailabilityType" NOT NULL DEFAULT 'READY_STOCK',
    "allowBackorder" BOOLEAN NOT NULL DEFAULT false,
    "productionLeadTimeDays" INTEGER,
    "ean" TEXT,
    "batchCode" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_images" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "width" INTEGER,
    "height" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_fragrance_families" (
    "productId" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "product_fragrance_families_pkey" PRIMARY KEY ("productId","familyId")
);

-- CreateTable
CREATE TABLE "product_fragrance_notes" (
    "productId" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,
    "position" "NotePosition" NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "product_fragrance_notes_pkey" PRIMARY KEY ("productId","noteId","position")
);

-- CreateTable
CREATE TABLE "product_collections" (
    "productId" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "product_collections_pkey" PRIMARY KEY ("productId","collectionId")
);

-- CreateIndex
CREATE INDEX "system_settings_group_idx" ON "system_settings"("group");

-- CreateIndex
CREATE UNIQUE INDEX "brands_slug_key" ON "brands"("slug");

-- CreateIndex
CREATE INDEX "brands_isActive_idx" ON "brands"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "categories_parentId_idx" ON "categories"("parentId");

-- CreateIndex
CREATE INDEX "categories_isActive_position_idx" ON "categories"("isActive", "position");

-- CreateIndex
CREATE UNIQUE INDEX "collections_slug_key" ON "collections"("slug");

-- CreateIndex
CREATE INDEX "collections_isActive_position_idx" ON "collections"("isActive", "position");

-- CreateIndex
CREATE UNIQUE INDEX "concentrations_slug_key" ON "concentrations"("slug");

-- CreateIndex
CREATE INDEX "concentrations_isActive_position_idx" ON "concentrations"("isActive", "position");

-- CreateIndex
CREATE UNIQUE INDEX "fragrance_families_slug_key" ON "fragrance_families"("slug");

-- CreateIndex
CREATE INDEX "fragrance_families_parentId_idx" ON "fragrance_families"("parentId");

-- CreateIndex
CREATE INDEX "fragrance_families_isActive_position_idx" ON "fragrance_families"("isActive", "position");

-- CreateIndex
CREATE UNIQUE INDEX "fragrance_notes_slug_key" ON "fragrance_notes"("slug");

-- CreateIndex
CREATE INDEX "fragrance_notes_isActive_idx" ON "fragrance_notes"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");

-- CreateIndex
CREATE INDEX "products_status_publishedAt_idx" ON "products"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "products_brandId_idx" ON "products"("brandId");

-- CreateIndex
CREATE INDEX "products_categoryId_idx" ON "products"("categoryId");

-- CreateIndex
CREATE INDEX "products_productType_idx" ON "products"("productType");

-- CreateIndex
CREATE INDEX "products_isFeatured_idx" ON "products"("isFeatured");

-- CreateIndex
CREATE INDEX "products_isBestSeller_idx" ON "products"("isBestSeller");

-- CreateIndex
CREATE INDEX "products_isNew_idx" ON "products"("isNew");

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_sku_key" ON "product_variants"("sku");

-- CreateIndex
CREATE INDEX "product_variants_productId_position_idx" ON "product_variants"("productId", "position");

-- CreateIndex
CREATE INDEX "product_variants_availabilityType_idx" ON "product_variants"("availabilityType");

-- CreateIndex
CREATE INDEX "product_variants_isActive_idx" ON "product_variants"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_productId_volumeMl_key" ON "product_variants"("productId", "volumeMl");

-- CreateIndex
CREATE INDEX "product_images_productId_position_idx" ON "product_images"("productId", "position");

-- CreateIndex
CREATE INDEX "product_fragrance_families_familyId_idx" ON "product_fragrance_families"("familyId");

-- CreateIndex
CREATE INDEX "product_fragrance_notes_noteId_idx" ON "product_fragrance_notes"("noteId");

-- CreateIndex
CREATE INDEX "product_fragrance_notes_productId_position_sortOrder_idx" ON "product_fragrance_notes"("productId", "position", "sortOrder");

-- CreateIndex
CREATE INDEX "product_collections_collectionId_position_idx" ON "product_collections"("collectionId", "position");

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fragrance_families" ADD CONSTRAINT "fragrance_families_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "fragrance_families"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_concentrationId_fkey" FOREIGN KEY ("concentrationId") REFERENCES "concentrations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_fragrance_families" ADD CONSTRAINT "product_fragrance_families_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_fragrance_families" ADD CONSTRAINT "product_fragrance_families_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "fragrance_families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_fragrance_notes" ADD CONSTRAINT "product_fragrance_notes_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_fragrance_notes" ADD CONSTRAINT "product_fragrance_notes_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "fragrance_notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_collections" ADD CONSTRAINT "product_collections_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_collections" ADD CONSTRAINT "product_collections_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- CHECK constraints
--
-- Prisma's schema language cannot express these, so they are added by hand.
-- They belong in the database: an invariant enforced only by application code
-- is one bad migration script or one psql session away from being violated.
-- ---------------------------------------------------------------------------

-- Money is in cents and can never be negative.
ALTER TABLE "product_variants"
  ADD CONSTRAINT "product_variants_price_non_negative"
  CHECK ("priceCents" >= 0);

ALTER TABLE "product_variants"
  ADD CONSTRAINT "product_variants_compare_at_price_non_negative"
  CHECK ("compareAtPriceCents" IS NULL OR "compareAtPriceCents" >= 0);

ALTER TABLE "product_variants"
  ADD CONSTRAINT "product_variants_cost_price_non_negative"
  CHECK ("costPriceCents" IS NULL OR "costPriceCents" >= 0);

-- A "sale" price that is not below the regular price is a display bug waiting
-- to happen, so the database refuses it.
ALTER TABLE "product_variants"
  ADD CONSTRAINT "product_variants_compare_at_price_above_price"
  CHECK ("compareAtPriceCents" IS NULL OR "compareAtPriceCents" > "priceCents");

-- A sellable perfume has a real volume and real shipping dimensions; zero would
-- silently break freight quoting.
ALTER TABLE "product_variants"
  ADD CONSTRAINT "product_variants_volume_positive"
  CHECK ("volumeMl" > 0);

ALTER TABLE "product_variants"
  ADD CONSTRAINT "product_variants_weight_positive"
  CHECK ("weightGrams" > 0);

ALTER TABLE "product_variants"
  ADD CONSTRAINT "product_variants_dimensions_positive"
  CHECK ("lengthMm" > 0 AND "widthMm" > 0 AND "heightMm" > 0);

-- Lead time: null means "inherit". An explicit value must be a sane number of
-- days — zero is allowed (same-day preparation), negative never is, and an
-- upper bound catches a typo such as 1500 instead of 15.
ALTER TABLE "product_variants"
  ADD CONSTRAINT "product_variants_lead_time_range"
  CHECK ("productionLeadTimeDays" IS NULL OR ("productionLeadTimeDays" >= 0 AND "productionLeadTimeDays" <= 365));

ALTER TABLE "products"
  ADD CONSTRAINT "products_lead_time_range"
  CHECK ("productionLeadTimeDays" IS NULL OR ("productionLeadTimeDays" >= 0 AND "productionLeadTimeDays" <= 365));

-- Concentration percentages, when given, must form a valid range.
ALTER TABLE "concentrations"
  ADD CONSTRAINT "concentrations_percent_range"
  CHECK (
    ("minPercent" IS NULL OR ("minPercent" >= 0 AND "minPercent" <= 100))
    AND ("maxPercent" IS NULL OR ("maxPercent" >= 0 AND "maxPercent" <= 100))
    AND ("minPercent" IS NULL OR "maxPercent" IS NULL OR "minPercent" <= "maxPercent")
  );

-- A category or family cannot be its own parent.
ALTER TABLE "categories"
  ADD CONSTRAINT "categories_no_self_parent"
  CHECK ("parentId" IS NULL OR "parentId" <> "id");

ALTER TABLE "fragrance_families"
  ADD CONSTRAINT "fragrance_families_no_self_parent"
  CHECK ("parentId" IS NULL OR "parentId" <> "id");

-- ---------------------------------------------------------------------------
-- Partial unique indexes
-- ---------------------------------------------------------------------------

-- At most one primary image per product.
CREATE UNIQUE INDEX "product_images_one_primary_per_product"
  ON "product_images" ("productId")
  WHERE "isPrimary";

-- At most one primary olfactory family per product: it is the one used on cards
-- and as the canonical family for SEO.
CREATE UNIQUE INDEX "product_fragrance_families_one_primary_per_product"
  ON "product_fragrance_families" ("productId")
  WHERE "isPrimary";
