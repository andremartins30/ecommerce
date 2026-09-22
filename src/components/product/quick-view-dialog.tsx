"use client";

import Image from "next/image";
import Link from "next/link";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Rating } from "@/components/common/rating";
import { PriceDisplay } from "@/components/common/price-display";
import { AvailabilityTag } from "@/components/product/availability-tag";
import { WishlistButton } from "@/components/product/wishlist-button";
import { CompareButton } from "@/components/product/compare-button";
import { Button } from "@/components/ui/button";
import { useUiStore } from "@/store/ui-store";
import type { ProductSummary } from "@/lib/types";

/**
 * Quick view stays intentionally light: a summary and a link to the full
 * product page, rather than a second purchase flow. Availability, volume and
 * production lead time are the kind of decision the specification says belongs
 * on the product page, not squeezed into a modal.
 */
export function QuickViewDialog() {
  const product = useUiStore((s) => s.quickViewProduct);
  const closeQuickView = useUiStore((s) => s.closeQuickView);

  return (
    <Dialog open={!!product} onOpenChange={(open) => !open && closeQuickView()}>
      <DialogContent className="w-full max-w-2xl overflow-hidden p-0 sm:max-w-2xl">
        {product && <QuickViewBody product={product} onClose={closeQuickView} />}
      </DialogContent>
    </Dialog>
  );
}

function QuickViewBody({
  product,
  onClose,
}: {
  product: ProductSummary;
  onClose: () => void;
}) {
  return (
    <div className="grid sm:grid-cols-2">
      <div className="relative aspect-[4/5] bg-muted sm:aspect-auto">
        {product.image && (
          <Image
            src={product.image.url}
            alt={product.image.alt}
            fill
            sizes="(min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        )}
      </div>
      <div className="flex flex-col p-6 sm:p-7">
        <DialogTitle className="sr-only">{product.name}</DialogTitle>
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {product.brand.name}
        </p>
        <h2 className="mt-1 font-heading text-xl font-semibold text-foreground">{product.name}</h2>
        {product.rating !== null && (
          <div className="mt-2">
            <Rating value={product.rating} count={product.reviewCount} showValue />
          </div>
        )}
        <div className="mt-3">
          <PriceDisplay
            price={product.priceFromCents}
            compareAtPrice={product.compareAtFromCents ?? undefined}
            size="lg"
          />
        </div>
        <p className="mt-4 text-sm text-muted-foreground">{product.shortDescription}</p>

        <div className="mt-5">
          <AvailabilityTag availability={product.availability} />
        </div>

        <div className="mt-6 flex items-center gap-3">
          <Button className="flex-1" render={<Link href={`/produto/${product.slug}`} onClick={onClose} />}>
            Ver produto
          </Button>
          <WishlistButton productId={product.id} productName={product.name} variant="solid" />
          <CompareButton productId={product.id} productName={product.name} variant="solid" />
        </div>
      </div>
    </div>
  );
}
