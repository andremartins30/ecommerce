"use client";

import { Heart } from "lucide-react";
import { useWishlistStore } from "@/store/wishlist-store";
import { useHydrated } from "@/hooks/use-hydrated";
import { useProductsByIds } from "@/hooks/use-products-by-ids";
import { ProductGrid } from "@/components/product/product-grid";
import { EmptyState } from "@/components/common/empty-state";
import { ProductGridSkeleton } from "@/components/common/skeletons";

export function WishlistView() {
  const productIds = useWishlistStore((s) => s.productIds);
  const hydrated = useHydrated();
  const { items, loading } = useProductsByIds(hydrated ? productIds : []);

  const showSkeleton = !hydrated || loading;

  return (
    <div className="container-page py-10 sm:py-14">
      <div className="max-w-2xl">
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Lista de desejos
        </h1>
        <p className="mt-2 text-muted-foreground">
          {!showSkeleton && `${items.length} ${items.length === 1 ? "item salvo" : "itens salvos"}`}
        </p>
      </div>

      <div className="mt-10">
        {showSkeleton ? (
          <ProductGridSkeleton count={4} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="Sua lista de desejos está vazia"
            description="Salve os perfumes que você gosta e volte para eles quando quiser."
            actionLabel="Explorar o catálogo"
            actionHref="/shop"
          />
        ) : (
          <ProductGrid products={items} />
        )}
      </div>
    </div>
  );
}
