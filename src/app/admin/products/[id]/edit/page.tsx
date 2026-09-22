"use client";

import { use } from "react";
import { useAdminProductsStore } from "@/store/admin-products-store";
import { useHydrated } from "@/hooks/use-hydrated";
import { ProductForm } from "@/components/admin/product-form";
import { EmptyState } from "@/components/common/empty-state";
import { PackageX } from "lucide-react";

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const hydrated = useHydrated();
  const product = useAdminProductsStore((s) => s.getById(id));

  if (!hydrated) return null;

  if (!product) {
    return (
      <EmptyState
        icon={PackageX}
        title="Product not found"
        description="This product may have been deleted."
        actionLabel="Back to Products"
        actionHref="/admin/products"
      />
    );
  }

  return <ProductForm key={product.id} product={product} />;
}
