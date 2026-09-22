"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Copy, Eye, MoreHorizontal, PackageX, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAdminProductsStore } from "@/store/admin-products-store";
import { categories, getCategoryById } from "@/lib/data/categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge, StockBadge } from "@/components/common/status-badge";
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

export default function AdminProductsPage() {
  const allProducts = useAdminProductsStore((s) => s.products);
  const deleteProduct = useAdminProductsStore((s) => s.deleteProduct);
  const duplicateProduct = useAdminProductsStore((s) => s.duplicateProduct);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [pendingDelete, setPendingDelete] = useState<string | string[] | null>(null);

  const filtered = useMemo(() => {
    return allProducts.filter((p) => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.sku.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      if (category !== "all" && p.categoryId !== category) return false;
      if (status !== "all" && p.status !== status) return false;
      return true;
    });
  }, [allProducts, search, category, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageProducts = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function confirmDelete() {
    if (!pendingDelete) return;
    const ids = Array.isArray(pendingDelete) ? pendingDelete : [pendingDelete];
    ids.forEach(deleteProduct);
    setSelected((s) => s.filter((id) => !ids.includes(id)));
    toast.success(ids.length > 1 ? `${ids.length} products deleted` : "Product deleted");
    setPendingDelete(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-foreground sm:text-3xl">Products</h1>
          <p className="mt-1 text-sm text-muted-foreground">{allProducts.length} products in your catalog</p>
        </div>
        <Button className="gap-1.5" render={<Link href="/admin/products/new" />}>
          <Plus className="size-4" /> Add Product
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
            placeholder="Search by name or SKU…"
            className="pl-9"
          />
        </div>
        <Select value={category} onValueChange={(v) => { setCategory(v ?? "all"); setPage(1); }}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => { setStatus(v ?? "all"); setPage(1); }}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        {selected.length > 0 && (
          <Button variant="destructive" size="sm" className="gap-1.5" onClick={() => setPendingDelete(selected)}>
            <Trash2 className="size-3.5" /> Delete ({selected.length})
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={PackageX} title="No products found" description="Try adjusting your search or filters." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40 text-xs text-muted-foreground uppercase">
                <tr>
                  <th className="w-10 px-4 py-3">
                    <Checkbox
                      checked={pageProducts.length > 0 && pageProducts.every((p) => selected.includes(p.id))}
                      onCheckedChange={(checked) =>
                        setSelected(checked ? pageProducts.map((p) => p.id) : [])
                      }
                    />
                  </th>
                  <th className="px-4 py-3 text-left font-medium">Product</th>
                  <th className="px-4 py-3 text-left font-medium">Category</th>
                  <th className="px-4 py-3 text-right font-medium">Price</th>
                  <th className="px-4 py-3 text-right font-medium">Stock</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Updated</th>
                  <th className="w-10 px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pageProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <Checkbox
                        checked={selected.includes(product.id)}
                        onCheckedChange={(checked) =>
                          setSelected((s) => (checked ? [...s, product.id] : s.filter((id) => id !== product.id)))
                        }
                      />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-muted">
                          <Image src={product.images[0]?.url} alt={product.name} fill className="object-cover" sizes="44px" />
                        </div>
                        <div className="min-w-0">
                          <Link href={`/admin/products/${product.id}/edit`} className="line-clamp-1 font-medium text-foreground hover:underline">
                            {product.name}
                          </Link>
                          <p className="text-xs text-muted-foreground">{product.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground">
                      {getCategoryById(product.categoryId)?.name}
                    </td>
                    <td className="px-4 py-3.5 text-right font-medium text-foreground">
                      {formatPrice(product.price)}
                    </td>
                    <td className="px-4 py-3.5 text-right text-foreground">{product.stock}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col gap-1">
                        <StatusBadge status={product.status} />
                        <StockBadge stock={product.stock} />
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground">{formatDate(product.updatedAt)}</td>
                    <td className="px-4 py-3.5 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="rounded-md p-1.5 text-muted-foreground hover:bg-muted">
                          <MoreHorizontal className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem render={<Link href={`/product/${product.slug}`} target="_blank" />}>
                            <Eye className="size-4" /> View
                          </DropdownMenuItem>
                          <DropdownMenuItem render={<Link href={`/admin/products/${product.id}/edit`} />}>
                            <Pencil className="size-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              duplicateProduct(product.id);
                              toast.success("Product duplicated");
                            }}
                          >
                            <Copy className="size-4" /> Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem variant="destructive" onClick={() => setPendingDelete(product.id)}>
                            <Trash2 className="size-4" /> Delete
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
            <AlertDialogTitle>Delete {Array.isArray(pendingDelete) ? `${pendingDelete.length} products` : "product"}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently remove the product from your catalog.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
