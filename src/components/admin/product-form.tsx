"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { productSchema, type ProductFormValues } from "@/lib/product-schema";
import { useAdminProductsStore } from "@/store/admin-products-store";
import { categories } from "@/lib/data/categories";
import { slugify } from "@/lib/data/seed";
import { fromReais, toReais, type Cents } from "@/server/domain/pricing/money";
import type { LegacyProduct as Product } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function toFormValues(product?: Product): ProductFormValues {
  if (!product) {
    return {
      name: "",
      slug: "",
      brand: "",
      categoryId: categories[0].id,
      shortDescription: "",
      description: "",
      price: 0,
      compareAtPrice: undefined,
      sku: "",
      stock: 0,
      status: "draft",
      material: "",
      tags: [],
      sizes: [],
      colors: [],
      images: [{ url: "", alt: "" }],
      seoTitle: "",
      seoDescription: "",
    };
  }
  return {
    name: product.name,
    slug: product.slug,
    brand: product.brand,
    categoryId: product.categoryId,
    shortDescription: product.shortDescription,
    description: product.description,
    // Stored in cents, edited in reais.
    price: toReais(product.price as Cents),
    compareAtPrice:
      product.compareAtPrice === undefined ? undefined : toReais(product.compareAtPrice as Cents),
    sku: product.sku,
    stock: product.stock,
    status: product.status,
    material: product.material ?? "",
    tags: product.tags,
    sizes: product.sizes,
    colors: product.colors,
    images: product.images.map((i) => ({ url: i.url, alt: i.alt })),
    seoTitle: product.name,
    seoDescription: product.shortDescription,
  };
}

export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const upsertProduct = useAdminProductsStore((s) => s.upsertProduct);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [tagsInput, setTagsInput] = useState(product?.tags.join(", ") ?? "");
  const [sizesInput, setSizesInput] = useState(product?.sizes.join(", ") ?? "");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors, isDirty },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: toFormValues(product),
  });

  const { fields: imageFields, append: appendImage, remove: removeImage } = useFieldArray({
    control,
    name: "images",
  });
  const { fields: colorFields, append: appendColor, remove: removeColor } = useFieldArray({
    control,
    name: "colors",
  });

  const name = watch("name");
  useEffect(() => {
    if (!product && name) setValue("slug", slugify(name));
  }, [name, product, setValue]);

  useEffect(() => {
    if (isDirty) setSaveState("idle");
  }, [isDirty]);

  function onSubmit(values: ProductFormValues) {
    setSaveState("saving");
    setTimeout(() => {
      const now = new Date().toISOString();
      const id = product?.id ?? `prod-${Date.now()}`;
      const tags = tagsInput.split(",").map((t) => t.trim()).filter(Boolean);
      const sizes = sizesInput.split(",").map((t) => t.trim()).filter(Boolean);

      const fullProduct: Product = {
        id,
        slug: values.slug,
        name: values.name,
        brand: values.brand,
        categoryId: values.categoryId,
        description: values.description,
        shortDescription: values.shortDescription,
        // The form collects reais; storage is always cents.
        price: fromReais(values.price),
        compareAtPrice: values.compareAtPrice ? fromReais(values.compareAtPrice) : undefined,
        currency: "BRL",
        images: values.images.filter((i) => i.url).map((i) => ({ url: i.url, alt: i.alt || values.name })),
        colors: values.colors,
        sizes,
        variants: product?.variants ?? [
          { id: `${id}-v1`, sku: values.sku, stock: values.stock, color: values.colors[0]?.name, size: sizes[0] },
        ],
        rating: product?.rating ?? 0,
        reviewCount: product?.reviewCount ?? 0,
        stock: values.stock,
        sku: values.sku,
        tags,
        isNew: product?.isNew ?? true,
        isBestSeller: product?.isBestSeller ?? false,
        isFeatured: product?.isFeatured ?? false,
        status: values.status,
        material: values.material,
        care: product?.care,
        shippingNote: product?.shippingNote ?? "Frete grátis em pedidos acima de R$ 299,00.",
        createdAt: product?.createdAt ?? now,
        updatedAt: now,
      };

      upsertProduct(fullProduct);
      setSaveState("saved");
      toast.success(product ? "Product updated" : "Product created");
      if (!product) router.push(`/admin/products/${id}/edit`);
    }, 700);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-foreground sm:text-3xl">
            {product ? "Edit Product" : "Add Product"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {saveState === "saving" && "Saving…"}
            {saveState === "saved" && "All changes saved"}
            {saveState === "idle" && isDirty && "Unsaved changes"}
            {saveState === "idle" && !isDirty && " "}
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => router.push("/admin/products")}>
            Cancel
          </Button>
          <Button type="submit" disabled={saveState === "saving"} className="gap-2">
            {saveState === "saving" && <Loader2 className="size-4 animate-spin" />}
            {saveState === "saving" ? "Saving…" : "Save Product"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="pricing">Pricing & Inventory</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
          <TabsTrigger value="variants">Variants</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4 rounded-2xl border border-border bg-card p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Product Name</Label>
              <Input id="name" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" {...register("slug")} />
              {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="brand">Brand</Label>
              <Input id="brand" {...register("brand")} />
              {errors.brand && <p className="text-xs text-destructive">{errors.brand.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="categoryId">Category</Label>
              <Select value={watch("categoryId")} onValueChange={(v) => v && setValue("categoryId", v, { shouldDirty: true })}>
                <SelectTrigger id="categoryId" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="shortDescription">Short Description</Label>
            <Input id="shortDescription" {...register("shortDescription")} />
            {errors.shortDescription && <p className="text-xs text-destructive">{errors.shortDescription.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={5} {...register("description")} />
            {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="material">Material</Label>
            <Input id="material" {...register("material")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tags">Tags (comma separated)</Label>
            <Input id="tags" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} />
          </div>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-4 rounded-2xl border border-border bg-card p-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="price">Price ($)</Label>
              <Input id="price" type="number" step="0.01" {...register("price")} />
              {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="compareAtPrice">Compare-at Price ($)</Label>
              <Input id="compareAtPrice" type="number" step="0.01" {...register("compareAtPrice")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="status">Status</Label>
              <Select value={watch("status")} onValueChange={(v) => setValue("status", v as ProductFormValues["status"], { shouldDirty: true })}>
                <SelectTrigger id="status" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" {...register("sku")} />
              {errors.sku && <p className="text-xs text-destructive">{errors.sku.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="stock">Stock Quantity</Label>
              <Input id="stock" type="number" {...register("stock")} />
              {errors.stock && <p className="text-xs text-destructive">{errors.stock.message}</p>}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sizes">Available Sizes (comma separated)</Label>
            <Input id="sizes" value={sizesInput} onChange={(e) => setSizesInput(e.target.value)} placeholder="S, M, L, XL" />
          </div>
          <div className="space-y-2">
            <Label>Colors</Label>
            {colorFields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-2">
                <Input placeholder="Color name" {...register(`colors.${index}.name`)} />
                <Input type="color" className="h-9 w-14 p-1" {...register(`colors.${index}.hex`)} />
                <Button type="button" variant="ghost" size="icon-sm" onClick={() => removeColor(index)}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => appendColor({ name: "", hex: "#000000" })}>
              <Plus className="size-3.5" /> Add Color
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="images" className="space-y-4 rounded-2xl border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground">
            Paste image URLs (file upload isn&apos;t wired up in this demo).
          </p>
          {imageFields.map((field, index) => (
            <div key={field.id} className="flex items-start gap-3">
              <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                {watch(`images.${index}.url`) && (
                  <Image
                    src={watch(`images.${index}.url`)}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="64px"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <Input placeholder="Image URL" {...register(`images.${index}.url`)} />
                <Input placeholder="Alt text" {...register(`images.${index}.alt`)} />
              </div>
              <Button type="button" variant="ghost" size="icon-sm" onClick={() => removeImage(index)}>
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
          {errors.images && <p className="text-xs text-destructive">{errors.images.message}</p>}
          <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => appendImage({ url: "", alt: "" })}>
            <Plus className="size-3.5" /> Add Image
          </Button>
        </TabsContent>

        <TabsContent value="variants" className="space-y-3 rounded-2xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">
            Variants are generated automatically from the sizes and colors defined in the Pricing &amp; Inventory tab.
          </p>
          <div className="flex flex-wrap gap-2">
            {watch("sizes")?.length === 0 && sizesInput === "" && !watch("colors").length ? (
              <span className="text-xs text-muted-foreground">No variant options set yet.</span>
            ) : (
              <>
                {sizesInput.split(",").map((s) => s.trim()).filter(Boolean).map((s) => (
                  <span key={s} className="rounded-full border border-border px-2.5 py-1 text-xs text-foreground">{s}</span>
                ))}
                {watch("colors").map((c) => (
                  <span key={c.name} className="flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs text-foreground">
                    <span className="size-2.5 rounded-full" style={{ backgroundColor: c.hex }} />
                    {c.name}
                  </span>
                ))}
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="seo" className="space-y-4 rounded-2xl border border-border bg-card p-5">
          <div className="space-y-1.5">
            <Label htmlFor="seoTitle">SEO Title</Label>
            <Input id="seoTitle" {...register("seoTitle")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="seoDescription">SEO Description</Label>
            <Textarea id="seoDescription" rows={3} {...register("seoDescription")} />
          </div>
        </TabsContent>
      </Tabs>
    </form>
  );
}
