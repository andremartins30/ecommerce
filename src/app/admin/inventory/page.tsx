"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { AlertTriangle, Search } from "lucide-react";
import { toast } from "sonner";
import { useAdminProductsStore } from "@/store/admin-products-store";
import { getCategoryById } from "@/lib/data/categories";
import { StockBadge, stockLevelFor } from "@/components/common/status-badge";
import { MetricCard } from "@/components/common/metric-card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Boxes, PackageX, TriangleAlert } from "lucide-react";

export default function AdminInventoryPage() {
  const products = useAdminProductsStore((s) => s.products);
  const upsertProduct = useAdminProductsStore((s) => s.upsertProduct);
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("all");

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.sku.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      if (level !== "all" && stockLevelFor(p.stock) !== level) return false;
      return true;
    });
  }, [products, search, level]);

  const lowStockCount = products.filter((p) => stockLevelFor(p.stock) === "low-stock").length;
  const outOfStockCount = products.filter((p) => stockLevelFor(p.stock) === "out-of-stock").length;
  const totalUnits = products.reduce((sum, p) => sum + p.stock, 0);

  function handleStockChange(productId: string, value: number) {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    upsertProduct({ ...product, stock: value, updatedAt: new Date().toISOString() });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-foreground sm:text-3xl">Inventory</h1>
        <p className="mt-1 text-sm text-muted-foreground">Monitor stock levels across your catalog.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <MetricCard label="Total Units" value={totalUnits} icon={Boxes} />
        <MetricCard label="Low Stock" value={lowStockCount} icon={TriangleAlert} />
        <MetricCard label="Out of Stock" value={outOfStockCount} icon={PackageX} />
      </div>

      {lowStockCount + outOfStockCount > 0 && (
        <div className="flex items-center gap-2.5 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
          <AlertTriangle className="size-4 shrink-0" />
          {lowStockCount} products are running low and {outOfStockCount} are out of stock. Consider restocking soon.
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by product or SKU…" className="pl-9" />
        </div>
        <Select value={level} onValueChange={(v) => setLevel(v ?? "all")}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Stock level" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="in-stock">In Stock</SelectItem>
            <SelectItem value="low-stock">Low Stock</SelectItem>
            <SelectItem value="out-of-stock">Out of Stock</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs text-muted-foreground uppercase">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Product</th>
                <th className="px-4 py-3 text-left font-medium">SKU</th>
                <th className="px-4 py-3 text-left font-medium">Category</th>
                <th className="px-4 py-3 text-right font-medium">Stock</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((product) => (
                <tr key={product.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-muted">
                        <Image src={product.images[0]?.url} alt={product.name} fill className="object-cover" sizes="40px" />
                      </div>
                      <span className="line-clamp-1 font-medium text-foreground">{product.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-muted-foreground">{product.sku}</td>
                  <td className="px-4 py-3.5 text-muted-foreground">{getCategoryById(product.categoryId)?.name}</td>
                  <td className="px-4 py-3.5 text-right">
                    <Input
                      type="number"
                      min={0}
                      defaultValue={product.stock}
                      className="ml-auto h-8 w-20 text-right"
                      onBlur={(e) => {
                        const value = Math.max(0, Number(e.target.value) || 0);
                        if (value !== product.stock) {
                          handleStockChange(product.id, value);
                          toast.success(`Stock updated for ${product.name}`);
                        }
                      }}
                    />
                  </td>
                  <td className="px-4 py-3.5">
                    <StockBadge stock={product.stock} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
