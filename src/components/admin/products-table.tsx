"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, Eye, MoreHorizontal, PackageX, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { AdminProductListItem } from "@/server/services/admin/product-queries";
import { deleteProduct, duplicateProduct } from "@/server/services/admin/product-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Pagination } from "@/components/common/pagination";
import { EmptyState } from "@/components/common/empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatDate, formatPrice } from "@/lib/format";

const PAGE_SIZE = 10;

const STATUS_LABELS: Record<string, string> = { DRAFT: "Rascunho", ACTIVE: "Ativo", ARCHIVED: "Arquivado" };
const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  ACTIVE: "bg-success/10 text-success",
  ARCHIVED: "bg-muted text-muted-foreground",
};

function ProductStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap",
        STATUS_STYLES[status] ?? "bg-secondary text-secondary-foreground"
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

/**
 * Client-side table over an already-fetched product list.
 *
 * Filtering/pagination stay in memory here (the admin catalogue is the same
 * "dozens to a few hundred SKUs" scale as the storefront's), while
 * delete/duplicate go through the real Server Actions in product-actions.ts
 * — this is the CRUD boundary the mock admin-products-store used to own.
 */
export function ProductsTable({ products, categoryNames }: { products: AdminProductListItem[]; categoryNames: string[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (category !== "all" && p.categoryName !== category) return false;
      if (status !== "all" && p.status !== status) return false;
      return true;
    });
  }, [products, search, category, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageProducts = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function confirmDelete() {
    if (!pendingDelete) return;
    const id = pendingDelete;
    setPendingDelete(null);
    startTransition(async () => {
      const result = await deleteProduct(id);
      if (result.success) {
        toast.success("Produto excluído");
        router.refresh();
      } else {
        toast.error(result.formError ?? "Não foi possível excluir o produto");
      }
    });
  }

  function handleDuplicate(id: string) {
    startTransition(async () => {
      const result = await duplicateProduct(id);
      if (result.success) {
        toast.success("Produto duplicado como rascunho");
        router.refresh();
      } else {
        toast.error(result.formError ?? "Não foi possível duplicar o produto");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-foreground sm:text-3xl">Produtos</h1>
          <p className="mt-1 text-sm text-muted-foreground">{products.length} produtos no catálogo</p>
        </div>
        <Button className="gap-1.5" render={<Link href="/admin/products/new" />}>
          <Plus className="size-4" /> Novo produto
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Buscar por nome…"
            className="pl-9"
          />
        </div>
        <Select value={category} onValueChange={(v) => { setCategory(v ?? "all"); setPage(1); }}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {categoryNames.map((name) => (
              <SelectItem key={name} value={name}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => { setStatus(v ?? "all"); setPage(1); }}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="ACTIVE">Ativo</SelectItem>
            <SelectItem value="DRAFT">Rascunho</SelectItem>
            <SelectItem value="ARCHIVED">Arquivado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={PackageX} title="Nenhum produto encontrado" description="Ajuste a busca ou os filtros." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40 text-xs text-muted-foreground uppercase">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Produto</th>
                  <th className="px-4 py-3 text-left font-medium">Categoria</th>
                  <th className="px-4 py-3 text-right font-medium">A partir de</th>
                  <th className="px-4 py-3 text-right font-medium">Variantes</th>
                  <th className="px-4 py-3 text-right font-medium">Estoque total</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Atualizado</th>
                  <th className="w-10 px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pageProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-muted">
                          {product.primaryImageUrl && (
                            <Image src={product.primaryImageUrl} alt={product.name} fill className="object-cover" sizes="44px" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <Link href={`/admin/products/${product.id}/edit`} className="line-clamp-1 font-medium text-foreground hover:underline">
                            {product.name}
                          </Link>
                          <p className="text-xs text-muted-foreground">{product.brandName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground">{product.categoryName}</td>
                    <td className="px-4 py-3.5 text-right font-medium text-foreground">
                      {formatPrice(product.priceFromCents)}
                    </td>
                    <td className="px-4 py-3.5 text-right text-foreground">{product.variantCount}</td>
                    <td className="px-4 py-3.5 text-right text-foreground">{product.totalOnHand}</td>
                    <td className="px-4 py-3.5">
                      <ProductStatusBadge status={product.status} />
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground">{formatDate(product.updatedAt)}</td>
                    <td className="px-4 py-3.5 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="rounded-md p-1.5 text-muted-foreground hover:bg-muted">
                          <MoreHorizontal className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem render={<Link href={`/produto/${product.slug}`} target="_blank" />}>
                            <Eye className="size-4" /> Ver
                          </DropdownMenuItem>
                          <DropdownMenuItem render={<Link href={`/admin/products/${product.id}/edit`} />}>
                            <Pencil className="size-4" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem disabled={isPending} onClick={() => handleDuplicate(product.id)}>
                            <Copy className="size-4" /> Duplicar
                          </DropdownMenuItem>
                          <DropdownMenuItem variant="destructive" onClick={() => setPendingDelete(product.id)}>
                            <Trash2 className="size-4" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />}

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir produto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O produto e todas as suas variantes, imagens e
              estoque serão removidos permanentemente do catálogo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
