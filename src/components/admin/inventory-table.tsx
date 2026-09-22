"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Boxes, PackageX, Search, TriangleAlert } from "lucide-react";
import type { AdminInventoryItem } from "@/server/services/admin/inventory-queries";
import { StockAdjustmentDialog } from "@/components/admin/stock-adjustment-dialog";
import { MetricCard } from "@/components/common/metric-card";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/common/empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type StockLevel = "in-stock" | "low-stock" | "out-of-stock";

/** Derived from the variant's own onHand/reserved/lowStockThreshold — never a fixed number. */
function levelFor(item: AdminInventoryItem): StockLevel {
  if (item.availableStock <= 0) return "out-of-stock";
  if (item.availableStock <= item.lowStockThreshold) return "low-stock";
  return "in-stock";
}

const LEVEL_LABELS: Record<StockLevel, string> = {
  "in-stock": "Em estoque",
  "low-stock": "Estoque baixo",
  "out-of-stock": "Sem estoque",
};

const LEVEL_STYLES: Record<StockLevel, string> = {
  "in-stock": "bg-success/10 text-success",
  "low-stock": "bg-warning/15 text-warning",
  "out-of-stock": "bg-destructive/10 text-destructive",
};

function LevelBadge({ level }: { level: StockLevel }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap",
        LEVEL_STYLES[level]
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {LEVEL_LABELS[level]}
    </span>
  );
}

export function InventoryTable({ items }: { items: AdminInventoryItem[] }) {
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("all");

  const withLevel = useMemo(
    () => items.map((item) => ({ item, level: levelFor(item) })),
    [items]
  );

  const filtered = withLevel.filter(({ item, level: itemLevel }) => {
    if (
      search &&
      !item.productName.toLowerCase().includes(search.toLowerCase()) &&
      !item.sku.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    if (level !== "all" && itemLevel !== level) return false;
    return true;
  });

  const totalUnits = items.reduce((sum, item) => sum + item.availableStock, 0);
  const lowStockCount = withLevel.filter(({ level: l }) => l === "low-stock").length;
  const outOfStockCount = withLevel.filter(({ level: l }) => l === "out-of-stock").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-foreground sm:text-3xl">Estoque</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {items.length} variantes ativas. Cada ajuste é registrado como um movimento — o estoque nunca é
          sobrescrito diretamente.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="Unidades disponíveis" value={totalUnits} icon={Boxes} />
        <MetricCard label="Estoque baixo" value={lowStockCount} icon={TriangleAlert} />
        <MetricCard label="Sem estoque" value={outOfStockCount} icon={PackageX} />
      </div>

      {lowStockCount + outOfStockCount > 0 && (
        <div className="flex items-center gap-2.5 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-foreground">
          <AlertTriangle className="size-4 shrink-0 text-warning" />
          {lowStockCount + outOfStockCount} variante(s) precisam de atenção.
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por produto ou SKU…"
            className="pl-9"
          />
        </div>
        <Select value={level} onValueChange={(v) => setLevel(v ?? "all")}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Nível de estoque" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os níveis</SelectItem>
            <SelectItem value="in-stock">Em estoque</SelectItem>
            <SelectItem value="low-stock">Estoque baixo</SelectItem>
            <SelectItem value="out-of-stock">Sem estoque</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={PackageX} title="Nenhuma variante encontrada" description="Ajuste a busca ou o filtro." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40 text-xs text-muted-foreground uppercase">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Produto</th>
                  <th className="px-4 py-3 text-left font-medium">SKU</th>
                  <th className="px-4 py-3 text-right font-medium">Em mãos</th>
                  <th className="px-4 py-3 text-right font-medium">Reservado</th>
                  <th className="px-4 py-3 text-right font-medium">Disponível</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="w-10 px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(({ item, level: itemLevel }) => (
                  <tr key={item.variantId} className="hover:bg-muted/30">
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-foreground">{item.productName}</p>
                      <p className="text-xs text-muted-foreground">{item.brandName} · {item.volumeMl} ml</p>
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground">{item.sku}</td>
                    <td className="px-4 py-3.5 text-right text-foreground">{item.onHand}</td>
                    <td className="px-4 py-3.5 text-right text-muted-foreground">{item.reserved}</td>
                    <td className="px-4 py-3.5 text-right font-medium text-foreground">{item.availableStock}</td>
                    <td className="px-4 py-3.5">
                      <LevelBadge level={itemLevel} />
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <StockAdjustmentDialog
                        variantId={item.variantId}
                        variantLabel={`${item.productName} · ${item.volumeMl} ml (${item.sku})`}
                        currentOnHand={item.onHand}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
