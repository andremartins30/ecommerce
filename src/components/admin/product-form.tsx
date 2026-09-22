"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  productSchema,
  type ProductFormValues,
  PRODUCT_TYPE_OPTIONS,
  GENDER_OPTIONS,
  OCCASION_OPTIONS,
  SEASON_OPTIONS,
  NOTE_POSITION_OPTIONS,
  AVAILABILITY_TYPE_OPTIONS,
  PRODUCT_STATUS_OPTIONS,
} from "@/server/services/admin/product-schema";
import { createProduct, updateProduct } from "@/server/services/admin/product-actions";
import { slugify } from "@/lib/slug";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PRODUCT_TYPE_LABELS: Record<string, string> = {
  CONTRATIPO: "Contratipo",
  IMPORTADO: "Importado",
  NICHO: "Nicho",
  OUTRO: "Outro",
};
const GENDER_LABELS: Record<string, string> = {
  MASCULINO: "Masculino",
  FEMININO: "Feminino",
  UNISSEX: "Unissex",
};
const OCCASION_LABELS: Record<string, string> = {
  DIA_A_DIA: "Dia a dia",
  TRABALHO: "Trabalho",
  NOITE: "Noite",
  FESTA: "Festa",
  ENCONTRO: "Encontro",
  ESPORTE: "Esporte",
  ESPECIAL: "Ocasiões especiais",
};
const SEASON_LABELS: Record<string, string> = {
  VERAO: "Verão",
  OUTONO: "Outono",
  INVERNO: "Inverno",
  PRIMAVERA: "Primavera",
};
const NOTE_POSITION_LABELS: Record<string, string> = { TOP: "Saída", HEART: "Coração", BASE: "Fundo" };
const AVAILABILITY_LABELS: Record<string, string> = {
  READY_STOCK: "Pronta entrega",
  MADE_TO_ORDER: "Sob encomenda",
  OUT_OF_STOCK: "Fora de estoque",
  DISCONTINUED: "Descontinuado",
};
const STATUS_LABELS: Record<string, string> = { DRAFT: "Rascunho", ACTIVE: "Ativo", ARCHIVED: "Arquivado" };

export interface ProductFormOption {
  id: string;
  slug: string;
  name: string;
}

export interface ProductFormOptions {
  brands: ProductFormOption[];
  categories: ProductFormOption[];
  concentrations: ProductFormOption[];
  families: ProductFormOption[];
  notes: ProductFormOption[];
  collections: ProductFormOption[];
}

function emptyVariant() {
  return {
    sku: "",
    volumeMl: 50,
    priceReais: 0,
    compareAtPriceReais: null,
    weightGrams: 100,
    lengthMm: 40,
    widthMm: 40,
    heightMm: 120,
    availabilityType: "READY_STOCK" as const,
    allowBackorder: false,
    productionLeadTimeDays: null,
    ean: null,
    batchCode: null,
    initialOnHand: 0,
    isActive: true,
  };
}

function defaultValues(): ProductFormValues {
  return {
    name: "",
    slug: "",
    status: "DRAFT",
    productType: "CONTRATIPO",
    brandId: "",
    categoryId: "",
    concentrationId: null,
    shortDescription: "",
    description: "",
    gender: "UNISSEX",
    occasions: [],
    seasons: [],
    countryOfOrigin: null,
    longevity: null,
    projection: null,
    inspiredBy: null,
    referenceBrand: null,
    referenceFragrance: null,
    disclaimerOverride: null,
    productionLeadTimeDays: null,
    isFeatured: false,
    isBestSeller: false,
    isNew: true,
    tags: [],
    seoTitle: null,
    seoDescription: null,
    images: [{ url: "", alt: "", isPrimary: true }],
    families: [],
    notes: [],
    collections: [],
    variants: [emptyVariant()],
  };
}

export function ProductForm({
  product,
  options,
}: {
  product?: ProductFormValues;
  options: ProductFormOptions;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [tagsInput, setTagsInput] = useState(product?.tags.join(", ") ?? "");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    setError,
    formState: { errors, isDirty },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema) as Resolver<ProductFormValues>,
    defaultValues: product ?? defaultValues(),
  });

  const variantArray = useFieldArray({ control, name: "variants" });
  const imageArray = useFieldArray({ control, name: "images" });
  const familyArray = useFieldArray({ control, name: "families" });
  const noteArray = useFieldArray({ control, name: "notes" });

  const name = watch("name");

  function onSubmit(values: ProductFormValues) {
    setFormError(null);
    const tags = tagsInput.split(",").map((t) => t.trim()).filter(Boolean);
    const payload: ProductFormValues = { ...values, tags, id: product?.id };

    startTransition(async () => {
      const result = product ? await updateProduct(payload) : await createProduct(payload);

      if (!result.success) {
        if (result.fieldErrors) {
          for (const [path, message] of Object.entries(result.fieldErrors)) {
            setError(path as keyof ProductFormValues, { message });
          }
        }
        setFormError(result.formError ?? "Corrija os campos destacados e tente novamente.");
        toast.error("Não foi possível salvar o produto");
        return;
      }

      toast.success(product ? "Produto atualizado" : "Produto criado");
      if (!product && result.productId) {
        router.push(`/admin/products/${result.productId}/edit`);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-foreground sm:text-3xl">
            {product ? "Editar produto" : "Novo produto"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isPending && "Salvando…"}
            {!isPending && formError && <span className="text-destructive">{formError}</span>}
            {!isPending && !formError && isDirty && "Alterações não salvas"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => router.push("/admin/products")}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isPending} className="gap-2">
            {isPending && <Loader2 className="size-4 animate-spin" />}
            {isPending ? "Salvando…" : "Salvar produto"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="olfactory">Perfil olfativo</TabsTrigger>
          <TabsTrigger value="variants">Variantes</TabsTrigger>
          <TabsTrigger value="images">Imagens</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>

        {/* ---------------------------------------------------------------- */}
        <TabsContent value="general" className="space-y-4 rounded-2xl border border-border bg-card p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nome do produto</Label>
              <Input
                id="name"
                {...register("name")}
                onBlur={(e) => {
                  if (!product && !watch("slug")) setValue("slug", slugify(e.target.value));
                }}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" {...register("slug")} placeholder={name ? slugify(name) : undefined} />
              {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <SelectField
              label="Marca"
              value={watch("brandId")}
              onChange={(v) => setValue("brandId", v, { shouldDirty: true })}
              options={options.brands}
              error={errors.brandId?.message}
            />
            <SelectField
              label="Categoria"
              value={watch("categoryId")}
              onChange={(v) => setValue("categoryId", v, { shouldDirty: true })}
              options={options.categories}
              error={errors.categoryId?.message}
            />
            <div className="space-y-1.5">
              <Label htmlFor="status">Status</Label>
              <Select value={watch("status")} onValueChange={(v) => v && setValue("status", v as ProductFormValues["status"], { shouldDirty: true })}>
                <SelectTrigger id="status" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRODUCT_STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="productType">Tipo de produto</Label>
              <Select value={watch("productType")} onValueChange={(v) => v && setValue("productType", v as ProductFormValues["productType"], { shouldDirty: true })}>
                <SelectTrigger id="productType" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRODUCT_TYPE_OPTIONS.map((t) => (
                    <SelectItem key={t} value={t}>{PRODUCT_TYPE_LABELS[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gender">Gênero</Label>
              <Select value={watch("gender")} onValueChange={(v) => v && setValue("gender", v as ProductFormValues["gender"], { shouldDirty: true })}>
                <SelectTrigger id="gender" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {GENDER_OPTIONS.map((g) => (
                    <SelectItem key={g} value={g}>{GENDER_LABELS[g]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <SelectField
              label="Concentração"
              value={watch("concentrationId") ?? ""}
              onChange={(v) => setValue("concentrationId", v || null, { shouldDirty: true })}
              options={options.concentrations}
              placeholder="Nenhuma"
              allowEmpty
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="shortDescription">Descrição curta</Label>
            <Input id="shortDescription" {...register("shortDescription")} />
            {errors.shortDescription && <p className="text-xs text-destructive">{errors.shortDescription.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Descrição</Label>
            <Textarea id="description" rows={5} {...register("description")} />
            {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
            <Input id="tags" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} />
          </div>

          <div className="flex flex-wrap gap-5 pt-2">
            <CheckboxField label="Destaque" checked={watch("isFeatured")} onChange={(v) => setValue("isFeatured", v, { shouldDirty: true })} />
            <CheckboxField label="Mais vendido" checked={watch("isBestSeller")} onChange={(v) => setValue("isBestSeller", v, { shouldDirty: true })} />
            <CheckboxField label="Novidade" checked={watch("isNew")} onChange={(v) => setValue("isNew", v, { shouldDirty: true })} />
          </div>

          <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
            <p className="text-sm font-medium text-foreground">Referência de contratipo</p>
            <p className="text-xs text-muted-foreground">
              Preencha apenas se este produto for inspirado em outra fragrância. Nunca descreve a
              identidade do próprio produto.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="referenceBrand">Marca de referência</Label>
                <Input id="referenceBrand" {...register("referenceBrand")} value={watch("referenceBrand") ?? ""} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="referenceFragrance">Fragrância de referência</Label>
                <Input id="referenceFragrance" {...register("referenceFragrance")} value={watch("referenceFragrance") ?? ""} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="disclaimerOverride">Disclaimer específico (opcional)</Label>
              <Textarea
                id="disclaimerOverride"
                rows={2}
                placeholder="Deixe em branco para usar o texto padrão da loja"
                {...register("disclaimerOverride")}
                value={watch("disclaimerOverride") ?? ""}
              />
            </div>
          </div>
        </TabsContent>

        {/* ---------------------------------------------------------------- */}
        <TabsContent value="olfactory" className="space-y-5 rounded-2xl border border-border bg-card p-5">
          <div>
            <Label>Famílias olfativas</Label>
            <div className="mt-2 space-y-2">
              {familyArray.fields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-2">
                  <SelectField
                    value={watch(`families.${index}.familyId`)}
                    onChange={(v) => setValue(`families.${index}.familyId`, v, { shouldDirty: true })}
                    options={options.families}
                    className="flex-1"
                  />
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Checkbox
                      checked={watch(`families.${index}.isPrimary`)}
                      onCheckedChange={(checked) =>
                        setValue(`families.${index}.isPrimary`, !!checked, { shouldDirty: true })
                      }
                    />
                    Principal
                  </label>
                  <Button type="button" variant="ghost" size="icon-sm" onClick={() => familyArray.remove(index)}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
            {errors.families?.message && <p className="mt-1 text-xs text-destructive">{errors.families.message}</p>}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2 gap-1.5"
              onClick={() => familyArray.append({ familyId: options.families[0]?.id ?? "", isPrimary: familyArray.fields.length === 0 })}
            >
              <Plus className="size-3.5" /> Adicionar família
            </Button>
          </div>

          <div>
            <Label>Pirâmide olfativa (notas)</Label>
            <div className="mt-2 space-y-2">
              {noteArray.fields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-2">
                  <SelectField
                    value={watch(`notes.${index}.noteId`)}
                    onChange={(v) => setValue(`notes.${index}.noteId`, v, { shouldDirty: true })}
                    options={options.notes}
                    className="flex-1"
                  />
                  <Select
                    value={watch(`notes.${index}.position`)}
                    onValueChange={(v) => v && setValue(`notes.${index}.position`, v as ProductFormValues["notes"][number]["position"], { shouldDirty: true })}
                  >
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {NOTE_POSITION_OPTIONS.map((p) => (
                        <SelectItem key={p} value={p}>{NOTE_POSITION_LABELS[p]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="ghost" size="icon-sm" onClick={() => noteArray.remove(index)}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2 gap-1.5"
              onClick={() => noteArray.append({ noteId: options.notes[0]?.id ?? "", position: "TOP", sortOrder: noteArray.fields.length })}
            >
              <Plus className="size-3.5" /> Adicionar nota
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Ocasiões</Label>
              <div className="mt-2 flex flex-wrap gap-3">
                {OCCASION_OPTIONS.map((o) => (
                  <CheckboxField
                    key={o}
                    label={OCCASION_LABELS[o]}
                    checked={watch("occasions").includes(o)}
                    onChange={(checked) => {
                      const current = watch("occasions");
                      setValue("occasions", checked ? [...current, o] : current.filter((v) => v !== o), { shouldDirty: true });
                    }}
                  />
                ))}
              </div>
            </div>
            <div>
              <Label>Estações</Label>
              <div className="mt-2 flex flex-wrap gap-3">
                {SEASON_OPTIONS.map((s) => (
                  <CheckboxField
                    key={s}
                    label={SEASON_LABELS[s]}
                    checked={watch("seasons").includes(s)}
                    onChange={(checked) => {
                      const current = watch("seasons");
                      setValue("seasons", checked ? [...current, s] : current.filter((v) => v !== s), { shouldDirty: true });
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="countryOfOrigin">País de origem</Label>
              <Input id="countryOfOrigin" {...register("countryOfOrigin")} value={watch("countryOfOrigin") ?? ""} placeholder="BR" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="longevity">Fixação estimada</Label>
              <Input id="longevity" {...register("longevity")} value={watch("longevity") ?? ""} placeholder="6 a 8 horas" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="projection">Projeção</Label>
              <Input id="projection" {...register("projection")} value={watch("projection") ?? ""} placeholder="Moderada" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="productionLeadTimeDays">Prazo de produção (dias, opcional)</Label>
            <Input
              id="productionLeadTimeDays"
              type="number"
              min={0}
              max={365}
              value={watch("productionLeadTimeDays") ?? ""}
              onChange={(e) => setValue("productionLeadTimeDays", e.target.value === "" ? null : Number(e.target.value), { shouldDirty: true })}
              placeholder="Herda da configuração da loja"
            />
            <p className="text-xs text-muted-foreground">
              Deixe em branco para herdar o prazo padrão da loja. Só vale para variantes que também não definirem o próprio prazo.
            </p>
          </div>
        </TabsContent>

        {/* ---------------------------------------------------------------- */}
        <TabsContent value="variants" className="space-y-4 rounded-2xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">
            Cada volume vendável é uma variante própria, com preço, disponibilidade e estoque
            independentes — 30 ml pode estar em pronta entrega enquanto 50 ml está sob encomenda.
          </p>
          {errors.variants?.message && <p className="text-xs text-destructive">{errors.variants.message}</p>}

          <div className="space-y-4">
            {variantArray.fields.map((field, index) => (
              <div key={field.id} className="space-y-3 rounded-xl border border-border p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">Variante {index + 1}</p>
                  <Button type="button" variant="ghost" size="icon-sm" onClick={() => variantArray.remove(index)}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>

                <div className="grid gap-3 sm:grid-cols-4">
                  <div className="space-y-1.5">
                    <Label>SKU</Label>
                    <Input {...register(`variants.${index}.sku`)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Volume (ml)</Label>
                    <Input type="number" {...register(`variants.${index}.volumeMl`, { valueAsNumber: true })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Preço (R$)</Label>
                    <Input type="number" step="0.01" {...register(`variants.${index}.priceReais`, { valueAsNumber: true })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Preço &ldquo;de&rdquo; (R$, opcional)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={watch(`variants.${index}.compareAtPriceReais`) ?? ""}
                      onChange={(e) =>
                        setValue(
                          `variants.${index}.compareAtPriceReais`,
                          e.target.value === "" ? null : Number(e.target.value),
                          { shouldDirty: true }
                        )
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-4">
                  <div className="space-y-1.5">
                    <Label>Peso (g)</Label>
                    <Input type="number" {...register(`variants.${index}.weightGrams`, { valueAsNumber: true })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Dimensões (mm)</Label>
                    <div className="flex gap-1.5">
                      <Input type="number" placeholder="C" {...register(`variants.${index}.lengthMm`, { valueAsNumber: true })} />
                      <Input type="number" placeholder="L" {...register(`variants.${index}.widthMm`, { valueAsNumber: true })} />
                      <Input type="number" placeholder="A" {...register(`variants.${index}.heightMm`, { valueAsNumber: true })} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Disponibilidade</Label>
                    <Select
                      value={watch(`variants.${index}.availabilityType`)}
                      onValueChange={(v) => v && setValue(`variants.${index}.availabilityType`, v as ProductFormValues["variants"][number]["availabilityType"], { shouldDirty: true })}
                    >
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {AVAILABILITY_TYPE_OPTIONS.map((a) => (
                          <SelectItem key={a} value={a}>{AVAILABILITY_LABELS[a]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>{product ? "Estoque atual (ml)" : "Estoque inicial"}</Label>
                    <Input type="number" min={0} {...register(`variants.${index}.initialOnHand`, { valueAsNumber: true })} disabled={!!product} />
                    {product && (
                      <p className="text-[11px] text-muted-foreground">Ajuste de estoque acontece no painel de inventário.</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-5">
                  <CheckboxField
                    label="Permite venda sob encomenda além do estoque"
                    checked={watch(`variants.${index}.allowBackorder`)}
                    onChange={(v) => setValue(`variants.${index}.allowBackorder`, v, { shouldDirty: true })}
                  />
                  <CheckboxField
                    label="Ativa"
                    checked={watch(`variants.${index}.isActive`)}
                    onChange={(v) => setValue(`variants.${index}.isActive`, v, { shouldDirty: true })}
                  />
                  <div className="flex items-center gap-1.5">
                    <Label className="text-xs text-muted-foreground">Prazo de produção (dias, opcional)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={365}
                      className="w-24"
                      value={watch(`variants.${index}.productionLeadTimeDays`) ?? ""}
                      onChange={(e) =>
                        setValue(
                          `variants.${index}.productionLeadTimeDays`,
                          e.target.value === "" ? null : Number(e.target.value),
                          { shouldDirty: true }
                        )
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => variantArray.append(emptyVariant())}>
            <Plus className="size-3.5" /> Adicionar variante
          </Button>
        </TabsContent>

        {/* ---------------------------------------------------------------- */}
        <TabsContent value="images" className="space-y-4 rounded-2xl border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground">
            Cole URLs de imagem (upload de arquivo chega na task 31). Marque uma como principal.
          </p>
          {imageArray.fields.map((field, index) => (
            <div key={field.id} className="flex items-start gap-3">
              <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                {watch(`images.${index}.url`) && (
                  // eslint-disable-next-line @next/next/no-img-element -- arbitrary admin-entered URLs, next/image would require configuring every remote host
                  <img
                    src={watch(`images.${index}.url`)}
                    alt=""
                    className="size-full object-cover"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <Input placeholder="URL da imagem" {...register(`images.${index}.url`)} />
                <Input placeholder="Texto alternativo" {...register(`images.${index}.alt`)} />
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Checkbox
                    checked={watch(`images.${index}.isPrimary`)}
                    onCheckedChange={(checked) => {
                      // Only one primary image: checking this one unchecks the rest.
                      imageArray.fields.forEach((_, i) => setValue(`images.${i}.isPrimary`, false, { shouldDirty: true }));
                      setValue(`images.${index}.isPrimary`, !!checked, { shouldDirty: true });
                    }}
                  />
                  Imagem principal
                </label>
              </div>
              <Button type="button" variant="ghost" size="icon-sm" onClick={() => imageArray.remove(index)}>
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
          {errors.images?.message && <p className="text-xs text-destructive">{errors.images.message}</p>}
          <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => imageArray.append({ url: "", alt: "", isPrimary: imageArray.fields.length === 0 })}>
            <Plus className="size-3.5" /> Adicionar imagem
          </Button>
        </TabsContent>

        {/* ---------------------------------------------------------------- */}
        <TabsContent value="seo" className="space-y-4 rounded-2xl border border-border bg-card p-5">
          <div className="space-y-1.5">
            <Label htmlFor="seoTitle">Título SEO</Label>
            <Input id="seoTitle" {...register("seoTitle")} value={watch("seoTitle") ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="seoDescription">Descrição SEO</Label>
            <Textarea id="seoDescription" rows={3} {...register("seoDescription")} value={watch("seoDescription") ?? ""} />
          </div>
        </TabsContent>
      </Tabs>
    </form>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  error,
  placeholder = "Selecione",
  allowEmpty = false,
  className,
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: ProductFormOption[];
  error?: string;
  placeholder?: string;
  allowEmpty?: boolean;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      {label && <Label>{label}</Label>}
      <Select value={value} onValueChange={(v) => onChange(v ?? "")}>
        <SelectTrigger className="w-full"><SelectValue placeholder={placeholder} /></SelectTrigger>
        <SelectContent>
          {allowEmpty && <SelectItem value="">{placeholder}</SelectItem>}
          {options.map((o) => (
            <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-foreground">
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(!!v)} />
      {label}
    </label>
  );
}
