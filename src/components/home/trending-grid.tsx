import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { listProducts } from "@/server/services/catalog/queries";
import { ProductGrid } from "@/components/product/product-grid";
import { Reveal } from "@/components/common/reveal";

/** Best sellers from the real catalogue. */
export async function TrendingGrid() {
  const { items } = await listProducts({ sort: "best-selling", pageSize: 8 });

  if (items.length === 0) return null;

  return (
    <section className="container-page py-10 sm:py-14">
      <Reveal className="flex items-end justify-between">
        <h2 className="font-heading text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          Mais vendidos
        </h2>
        <Link
          href="/shop?sort=best-selling"
          className="group flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Ver tudo
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
        </Link>
      </Reveal>

      <div className="mt-7">
        <ProductGrid products={items} />
      </div>
    </section>
  );
}
