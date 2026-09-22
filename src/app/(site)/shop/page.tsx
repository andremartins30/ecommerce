import { Suspense } from "react";
import type { Metadata } from "next";
import { ShopView } from "@/components/shop/shop-view";
import { ProductGridSkeleton } from "@/components/common/skeletons";
import { listProducts, type ListProductsSort } from "@/server/services/catalog/queries";

export const metadata: Metadata = {
  title: "Todos os perfumes",
  description: "Contratipos, importados e perfumes de nicho — o catálogo completo.",
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; page?: string }>;
}) {
  const { sort, page } = await searchParams;

  return (
    <Suspense fallback={<div className="container-page py-10"><ProductGridSkeleton count={12} /></div>}>
      <ShopContent sort={sort as ListProductsSort | undefined} page={page} />
    </Suspense>
  );
}

async function ShopContent({ sort, page }: { sort?: ListProductsSort; page?: string }) {
  const result = await listProducts({
    sort: sort ?? "featured",
    page: page ? Number(page) : 1,
  });

  return (
    <ShopView
      title="Todos os perfumes"
      description="O catálogo completo, sem pressa."
      products={result.items}
      page={result.page}
      totalPages={result.totalPages}
    />
  );
}
