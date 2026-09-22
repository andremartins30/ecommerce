import { Suspense } from "react";
import type { Metadata } from "next";
import { ShopView } from "@/components/shop/shop-view";
import { ProductGridSkeleton } from "@/components/common/skeletons";
import { listProducts, type ListProductsSort } from "@/server/services/catalog/queries";
import { getFilterPanelOptions, parseShopSearchParams, type ShopSearchParams } from "@/server/services/catalog/filter-options";

export const metadata: Metadata = {
  title: "Todos os perfumes",
  description: "Contratipos, importados e perfumes de nicho — o catálogo completo.",
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<ShopSearchParams>;
}) {
  const params = await searchParams;

  return (
    <Suspense fallback={<div className="container-page py-10"><ProductGridSkeleton count={12} /></div>}>
      <ShopContent params={params} />
    </Suspense>
  );
}

async function ShopContent({ params }: { params: ShopSearchParams }) {
  const filters = parseShopSearchParams(params);
  const [result, filterOptions] = await Promise.all([
    listProducts({
      filters,
      sort: (params.sort as ListProductsSort) ?? "featured",
      page: params.page ? Number(params.page) : 1,
    }),
    getFilterPanelOptions(),
  ]);

  return (
    <ShopView
      title="Todos os perfumes"
      description="O catálogo completo, sem pressa."
      products={result.items}
      page={result.page}
      totalPages={result.totalPages}
      filterOptions={filterOptions}
    />
  );
}
