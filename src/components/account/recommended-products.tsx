import Link from "next/link";
import { ProductCard } from "@/components/product/product-card";
import { listProducts } from "@/server/services/catalog/queries";

/** Server Component: fetches real catalogue data for the account overview's
 *  recommendation rail, independent of the (still mock-backed) orders list on
 *  the same page. */
export async function RecommendedProducts() {
  const { items } = await listProducts({ sort: "top-rated", pageSize: 8 });

  if (items.length === 0) return null;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-heading text-lg font-semibold text-foreground">Recomendados para você</h2>
        <Link href="/shop" className="text-sm font-medium text-foreground underline underline-offset-4">
          Ver tudo
        </Link>
      </div>
      <div className="scroll-fade-x-6 flex gap-4 overflow-x-auto pb-2 no-scrollbar">
        {items.map((product) => (
          <div key={product.id} className="w-40 shrink-0 sm:w-48">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </div>
  );
}
