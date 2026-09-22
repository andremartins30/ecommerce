import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShopView } from "@/components/shop/shop-view";
import { ProductGridSkeleton } from "@/components/common/skeletons";
import { getCategoryBySlug, listProducts, type ListProductsSort } from "@/server/services/catalog/queries";
import { getFilterPanelOptions, parseShopSearchParams, type ShopSearchParams } from "@/server/services/catalog/filter-options";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return {};
  return { title: category.name, description: category.description ?? undefined };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<ShopSearchParams>;
}) {
  const { slug } = await params;
  const shopParams = await searchParams;

  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  return (
    <Suspense fallback={<div className="container-page py-10"><ProductGridSkeleton count={12} /></div>}>
      <CategoryContent
        categorySlug={category.slug}
        title={category.name}
        description={category.description}
        params={shopParams}
      />
    </Suspense>
  );
}

async function CategoryContent({
  categorySlug,
  title,
  description,
  params,
}: {
  categorySlug: string;
  title: string;
  description: string | null;
  params: ShopSearchParams;
}) {
  const filters = parseShopSearchParams(params, { categorySlug });
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
      title={title}
      description={description ?? undefined}
      products={result.items}
      page={result.page}
      totalPages={result.totalPages}
      filterOptions={filterOptions}
    />
  );
}
