"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Loader2, RotateCcw, ShieldCheck, ShoppingBag, Truck } from "lucide-react";
import { toast } from "sonner";
import type { ProductDetail as ProductDetailDto, ReviewDto } from "@/lib/types";
import { ProductGallery } from "@/components/product/product-gallery";
import { VolumeSelector } from "@/components/product/variant-selector";
import { QuantitySelector } from "@/components/product/quantity-selector";
import { WishlistButton } from "@/components/product/wishlist-button";
import { CompareButton } from "@/components/product/compare-button";
import { AvailabilityTag } from "@/components/product/availability-tag";
import { Rating } from "@/components/common/rating";
import { PriceDisplay } from "@/components/common/price-display";
import { ReviewsSection } from "@/components/product/reviews-section";
import { ProductGrid } from "@/components/product/product-grid";
import { SectionHeading } from "@/components/common/section-heading";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useVariantSelection } from "@/hooks/use-variant-selection";
import { useCartStore } from "@/store/cart-store";
import { cn } from "@/lib/utils";
import type { ProductSummary } from "@/lib/types";

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

export function ProductDetail({
  product,
  reviews,
  related,
}: {
  product: ProductDetailDto;
  reviews: ReviewDto[];
  related: ProductSummary[];
}) {
  const router = useRouter();
  const { variant, setVariantId, isReady, purchasable } = useVariantSelection(product);
  const [quantity, setQuantity] = useState(1);
  const [addState, setAddState] = useState<"idle" | "loading" | "added">("idle");
  const openCart = useCartStore((s) => s.open);

  function handleAddToCart(buyNow = false) {
    if (!variant || !purchasable) return;
    setAddState("loading");
    setTimeout(() => {
      // TODO(task 21): route through the server-side cart service instead of
      // the local store once carts are persisted.
      toast.success("Adicionado à sacola", { description: product.name });
      setAddState("added");
      setTimeout(() => setAddState("idle"), 1200);
      if (buyNow) {
        router.push("/checkout");
      } else {
        openCart();
      }
    }, 450);
  }

  const hasPyramid =
    product.pyramid.top.length + product.pyramid.heart.length + product.pyramid.base.length > 0;

  return (
    <div className="container-page py-6 sm:py-10">
      <nav className="mb-6 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Início</Link>
        <span>/</span>
        <Link href={`/categorias/${product.category.slug}`} className="hover:text-foreground">
          {product.category.name}
        </Link>
        <span>/</span>
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-10 pb-16 lg:grid-cols-2 lg:gap-14">
        <ProductGallery images={product.images} />

        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {product.brand.name}
          </p>
          <h1 className="mt-1.5 font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {product.name}
          </h1>

          {product.rating !== null && (
            <div className="mt-3 flex items-center gap-3">
              <a href="#reviews" className="flex items-center gap-1.5">
                <Rating value={product.rating} count={product.reviewCount} showValue />
              </a>
            </div>
          )}

          <div className="mt-4">
            <PriceDisplay
              price={variant?.priceCents ?? product.priceFromCents}
              compareAtPrice={variant?.compareAtPriceCents ?? product.compareAtFromCents ?? undefined}
              size="lg"
            />
          </div>

          <p className="mt-4 max-w-md text-sm text-muted-foreground">{product.shortDescription}</p>

          {product.reference && (
            <div className="mt-4 max-w-md rounded-lg border border-border bg-muted/30 p-3.5 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">
                Inspirado em {[product.reference.referenceBrand, product.reference.referenceFragrance]
                  .filter(Boolean)
                  .join(" — ")}
              </p>
              <p className="mt-1">{product.reference.disclaimer}</p>
            </div>
          )}

          <div className="mt-6 space-y-5">
            <VolumeSelector variants={product.variants} value={variant?.id} onChange={setVariantId} />
          </div>

          {/* Availability sits directly above the CTA, never in an accordion:
              it is the single fact most likely to decide the purchase. */}
          {variant && (
            <div className="mt-5">
              <AvailabilityTag availability={variant.availability} />
            </div>
          )}

          <div className="mt-4 flex items-center gap-3">
            <QuantitySelector
              value={quantity}
              onChange={setQuantity}
              max={variant?.maxQuantity ?? undefined}
            />
            <WishlistButton productId={product.id} productName={product.name} variant="solid" className="size-11" />
            <CompareButton productId={product.id} productName={product.name} variant="solid" className="size-11" />
          </div>

          <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
            <button
              type="button"
              disabled={!isReady || !purchasable || addState !== "idle"}
              onClick={() => handleAddToCart(false)}
              className={cn(
                "flex h-12 flex-1 items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors",
                addState === "added"
                  ? "bg-success text-success-foreground"
                  : "bg-foreground text-background hover:bg-foreground/85",
                (!isReady || !purchasable) && "opacity-50"
              )}
            >
              {addState === "loading" && <Loader2 className="size-4 animate-spin" />}
              {addState === "added" && <Check className="size-4" />}
              {addState === "idle" && <ShoppingBag className="size-4" />}
              {!purchasable ? "Indisponível" : addState === "added" ? "Adicionado" : "Adicionar à sacola"}
            </button>
            <button
              type="button"
              disabled={!isReady || !purchasable || addState !== "idle"}
              onClick={() => handleAddToCart(true)}
              className="flex h-12 flex-1 items-center justify-center rounded-lg border border-foreground text-sm font-medium text-foreground transition-colors hover:bg-foreground hover:text-background disabled:opacity-50"
            >
              Comprar agora
            </button>
          </div>

          <div className="mt-6 space-y-2.5 rounded-xl border border-border bg-muted/30 p-4">
            <div className="flex items-center gap-2.5 text-sm text-foreground">
              <Truck className="size-4 shrink-0 text-accent" />
              Informe seu CEP no carrinho para calcular o frete
            </div>
            <div className="flex items-center gap-2.5 text-sm text-foreground">
              <RotateCcw className="size-4 shrink-0 text-accent" />
              Trocas em até 7 dias após o recebimento
            </div>
            <div className="flex items-center gap-2.5 text-sm text-foreground">
              <ShieldCheck className="size-4 shrink-0 text-accent" />
              Compra segura, pagamento protegido
            </div>
          </div>

          <Accordion multiple defaultValue={["description"]} className="mt-8">
            <AccordionItem value="description">
              <AccordionTrigger className="text-sm font-medium">Descrição</AccordionTrigger>
              <AccordionContent className="space-y-3 text-sm text-muted-foreground">
                <p>{product.description}</p>
              </AccordionContent>
            </AccordionItem>

            {hasPyramid && (
              <AccordionItem value="pyramid">
                <AccordionTrigger className="text-sm font-medium">Pirâmide olfativa</AccordionTrigger>
                <AccordionContent className="space-y-3 text-sm">
                  {product.pyramid.top.length > 0 && (
                    <p>
                      <span className="text-foreground">Notas de saída: </span>
                      <span className="text-muted-foreground">
                        {product.pyramid.top.map((n) => n.name).join(", ")}
                      </span>
                    </p>
                  )}
                  {product.pyramid.heart.length > 0 && (
                    <p>
                      <span className="text-foreground">Notas de coração: </span>
                      <span className="text-muted-foreground">
                        {product.pyramid.heart.map((n) => n.name).join(", ")}
                      </span>
                    </p>
                  )}
                  {product.pyramid.base.length > 0 && (
                    <p>
                      <span className="text-foreground">Notas de fundo: </span>
                      <span className="text-muted-foreground">
                        {product.pyramid.base.map((n) => n.name).join(", ")}
                      </span>
                    </p>
                  )}
                </AccordionContent>
              </AccordionItem>
            )}

            <AccordionItem value="specs">
              <AccordionTrigger className="text-sm font-medium">Especificações</AccordionTrigger>
              <AccordionContent>
                <dl className="space-y-2 text-sm">
                  {product.concentration && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Concentração</dt>
                      <dd className="text-right text-foreground">{product.concentration.name}</dd>
                    </div>
                  )}
                  {product.families.length > 0 && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Família olfativa</dt>
                      <dd className="text-right text-foreground">
                        {product.families.map((f) => f.name).join(", ")}
                      </dd>
                    </div>
                  )}
                  {product.occasions.length > 0 && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Ocasiões</dt>
                      <dd className="text-right text-foreground">
                        {product.occasions.map((o) => OCCASION_LABELS[o] ?? o).join(", ")}
                      </dd>
                    </div>
                  )}
                  {product.seasons.length > 0 && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Estações</dt>
                      <dd className="text-right text-foreground">
                        {product.seasons.map((s) => SEASON_LABELS[s] ?? s).join(", ")}
                      </dd>
                    </div>
                  )}
                  {product.countryOfOrigin && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">País de origem</dt>
                      <dd className="text-right text-foreground">{product.countryOfOrigin}</dd>
                    </div>
                  )}
                  {/* Longevity/projection shown only when the operator filled
                      them in — never fabricated. */}
                  {product.longevity && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Fixação estimada</dt>
                      <dd className="text-right text-foreground">{product.longevity}</dd>
                    </div>
                  )}
                  {product.projection && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Projeção</dt>
                      <dd className="text-right text-foreground">{product.projection}</dd>
                    </div>
                  )}
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">SKU</dt>
                    <dd className="text-foreground">{variant?.sku}</dd>
                  </div>
                </dl>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="shipping">
              <AccordionTrigger className="text-sm font-medium">Envio e trocas</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                Calcule o frete no carrinho informando seu CEP. Itens sob encomenda têm prazo de
                produção informado separadamente do prazo de transporte. Trocas em até 7 dias após o
                recebimento — consulte nossa política de trocas e devoluções.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      <div className="border-t border-border py-14">
        <ReviewsSection
          productId={product.id}
          reviews={reviews}
          rating={product.rating}
          reviewCount={product.reviewCount}
        />
      </div>

      {related.length > 0 && (
        <div className="border-t border-border py-14">
          <SectionHeading eyebrow="Você também pode gostar" title="Produtos relacionados" />
          <div className="mt-8">
            <ProductGrid products={related} />
          </div>
        </div>
      )}

      {/* Sticky mobile purchase bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-border bg-background/95 p-3 backdrop-blur-md sm:hidden">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-muted-foreground">{product.name}</p>
          <PriceDisplay
            price={variant?.priceCents ?? product.priceFromCents}
            compareAtPrice={variant?.compareAtPriceCents ?? product.compareAtFromCents ?? undefined}
            size="sm"
          />
        </div>
        <button
          type="button"
          disabled={!isReady || !purchasable || addState !== "idle"}
          onClick={() => handleAddToCart(false)}
          className="flex h-11 shrink-0 items-center gap-1.5 rounded-lg bg-foreground px-5 text-sm font-medium text-background disabled:opacity-50"
        >
          {addState === "loading" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ShoppingBag className="size-4" />
          )}
          {purchasable ? "Adicionar" : "Indisponível"}
        </button>
      </div>
      <div className="h-16 sm:hidden" aria-hidden />
    </div>
  );
}
