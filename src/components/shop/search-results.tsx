import { SearchX } from "lucide-react";
import { ProductGrid } from "@/components/product/product-grid";
import { EmptyState } from "@/components/common/empty-state";
import { listProducts } from "@/server/services/catalog/queries";

/**
 * Full-text-ish search across name, brand, SKU, notes, family and description
 * — including a contratipo's reference fragrance, so searching "Aventus"
 * surfaces both the imported original and any contratipo inspired by it. See
 * listProducts' search filter for how the two stay visually distinguishable
 * (productType is part of every ProductSummary).
 */
export async function SearchResults({ query }: { query: string }) {
  const trimmed = query.trim();
  const result = trimmed
    ? await listProducts({ filters: { search: trimmed }, pageSize: 24 })
    : null;

  return (
    <div className="container-page py-10">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Busca</p>
        <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {trimmed ? `Resultados para "${trimmed}"` : "Buscar na loja"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {trimmed
            ? `${result?.total ?? 0} ${result?.total === 1 ? "produto encontrado" : "produtos encontrados"}`
            : "Use a busca acima para encontrar perfumes, marcas ou notas olfativas."}
        </p>
      </div>

      <div className="mt-10">
        {trimmed && (result?.items.length ?? 0) === 0 ? (
          <EmptyState
            icon={SearchX}
            title="Nenhum resultado encontrado"
            description={`Não encontramos nada para "${trimmed}". Tente outro termo ou explore as categorias.`}
            actionLabel="Ver catálogo"
            actionHref="/shop"
          />
        ) : (
          <ProductGrid products={result?.items ?? []} />
        )}
      </div>
    </div>
  );
}
