import Link from "next/link";
import { listCategories } from "@/server/services/catalog/queries";
import { Reveal } from "@/components/common/reveal";

/** Real categories from the database (Contratipos, Importados, Nicho, Outros). */
export async function FeaturedCategories() {
  const categories = await listCategories();
  const withProducts = categories.filter((c) => c.productCount > 0);

  if (withProducts.length === 0) return null;

  return (
    <section className="container-page py-10 sm:py-14">
      <Reveal>
        <h2 className="font-heading text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          Categorias
        </h2>
      </Reveal>

      <div className="mt-6 grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        {withProducts.map((category, i) => (
          <Reveal key={category.id} delay={i * 0.05}>
            <Link
              href={`/categorias/${category.slug}`}
              className="flex flex-col gap-1 rounded-xl border border-border bg-card p-4 transition-colors hover:border-foreground/30"
            >
              <span className="font-heading text-sm font-medium text-foreground">
                {category.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {category.productCount} {category.productCount === 1 ? "produto" : "produtos"}
              </span>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
