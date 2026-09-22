"use client";

import { PackageSearch } from "lucide-react";
import type { ProductSummary } from "@/lib/types";
import { ProductCard } from "@/components/product/product-card";
import { EmptyState } from "@/components/common/empty-state";
import { cn } from "@/lib/utils";

export function ProductGrid({
  products,
  className,
  emptyTitle = "Nenhum produto encontrado",
  emptyDescription = "Tente ajustar os filtros ou o termo de busca.",
}: {
  products: ProductSummary[];
  className?: string;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (products.length === 0) {
    return (
      <EmptyState icon={PackageSearch} title={emptyTitle} description={emptyDescription} />
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
        className
      )}
    >
      {products.map((product, i) => (
        <ProductCard key={product.id} product={product} priority={i < 4} />
      ))}
    </div>
  );
}
