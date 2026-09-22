import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShopView } from "@/components/shop/shop-view";
import { ProductGridSkeleton } from "@/components/common/skeletons";
import { getCategoryBySlug, listProducts, type ListProductsSort } from "@/server/services/catalog/queries";

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
  searchParams: Promise<{ sort?: string; page?: string }>;
}) {
  const { slug } = await params;
  const { sort, page } = await searchParams;

  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  return (
    <Suspense fallback={<div className="container-page py-10"><ProductGridSkeleton count={12} /></div>}>
      <CategoryContent
        categoryId={category.id}
        categorySlug={category.slug}
        title={category.name}
        description={category.description}
        sort={sort as ListProductsSort | undefined}
        page={page}
      />
    </Suspense>
  );
}

async function CategoryContent({
  categorySlug,
  title,
  description,
  sort,
  page,
}: {
  categoryId: string;
  categorySlug: string;
  title: string;
  description: string | null;
  sort?: ListProductsSort;
  page?: string;
}) {
  const result = await listProducts({
    filters: { categorySlug },
    sort: sort ?? "featured",
    page: page ? Number(page) : 1,
  });

  return (
    <ShopView
      title={title}
      description={description ?? undefined}
      products={result.items}
      page={result.page}
      totalPages={result.totalPages}
    />
  );
}
