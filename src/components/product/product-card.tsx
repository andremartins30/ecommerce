"use client";

import Image from "next/image";
import Link from "next/link";
import type { ProductSummary } from "@/lib/types";
import { PriceDisplay } from "@/components/common/price-display";
import { Rating } from "@/components/common/rating";
import { AvailabilityTag } from "@/components/product/availability-tag";
import { WishlistButton } from "@/components/product/wishlist-button";
import { CompareButton } from "@/components/product/compare-button";
import { cn } from "@/lib/utils";

/**
 * Catalogue card. Priority order on purpose: image, brand, name, volume,
 * price, availability. No quick-add here — availability, volume and lead time
 * are decisions that belong on the product page, not behind a hover state.
 */
export function ProductCard({
  product,
  priority = false,
}: {
  product: ProductSummary;
  priority?: boolean;
}) {
  const volumeLabel =
    product.volumesMl.length > 1
      ? `${product.volumesMl[0]}–${product.volumesMl[product.volumesMl.length - 1]} ml`
      : product.volumesMl[0]
        ? `${product.volumesMl[0]} ml`
        : null;

  return (
    <Link href={`/produto/${product.slug}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-muted">
        {product.image ? (
          <Image
            src={product.image.url}
            alt={product.image.alt}
            fill
            priority={priority}
            sizes="(min-width: 1280px) 23vw, (min-width: 640px) 46vw, 94vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-muted" />
        )}

        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-2.5">
          <div className="flex flex-col gap-1.5">
            {product.isNew && (
              <span className="rounded-full bg-foreground px-2.5 py-1 text-[10px] font-semibold tracking-wide text-background uppercase">
                Novo
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
            <CompareButton productId={product.id} productName={product.name} />
            <WishlistButton productId={product.id} productName={product.name} />
          </div>
        </div>
      </div>

      <div className="mt-3 space-y-1">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {product.brand.name}
        </p>
        <h3 className="line-clamp-1 font-heading text-sm font-medium text-foreground sm:text-[0.95rem]">
          {product.name}
        </h3>
        {volumeLabel && <p className="text-xs text-muted-foreground">{volumeLabel}</p>}
        {product.rating !== null && (
          <Rating value={product.rating} count={product.reviewCount} size="xs" />
        )}
        <div className={cn("flex items-center justify-between gap-2", !product.rating && "mt-0.5")}>
          <PriceDisplay
            price={product.priceFromCents}
            compareAtPrice={product.compareAtFromCents ?? undefined}
            size="sm"
          />
          <AvailabilityTag availability={product.availability} compact />
        </div>
      </div>
    </Link>
  );
}
