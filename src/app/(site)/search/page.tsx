import { Suspense } from "react";
import type { Metadata } from "next";
import { SearchResults } from "@/components/shop/search-results";
import { ProductGridSkeleton } from "@/components/common/skeletons";

export const metadata: Metadata = {
  title: "Busca",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  return (
    <Suspense fallback={<div className="container-page py-10"><ProductGridSkeleton count={8} /></div>}>
      <SearchResults query={q ?? ""} />
    </Suspense>
  );
}
