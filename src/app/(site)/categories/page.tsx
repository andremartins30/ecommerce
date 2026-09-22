import type { Metadata } from "next";
import Link from "next/link";
import { listCategories } from "@/server/services/catalog/queries";

export const metadata: Metadata = {
  title: "Categorias",
  description: "Explore o catálogo por categoria.",
};

export default async function CategoriesPage() {
  const categories = await listCategories();

  return (
    <div className="container-page py-10 sm:py-14">
      <div className="max-w-2xl">
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Categorias
        </h1>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/categorias/${category.slug}`}
            className="group block rounded-2xl border border-border bg-card p-6 transition-colors hover:border-foreground/30"
          >
            <h2 className="font-heading text-lg font-semibold text-foreground">{category.name}</h2>
            {category.description && (
              <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">{category.description}</p>
            )}
            <p className="mt-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {category.productCount} {category.productCount === 1 ? "produto" : "produtos"}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
