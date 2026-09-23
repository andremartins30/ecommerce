"use client";

import { useMemo, useState } from "react";
import { ClipboardList, Search } from "lucide-react";
import type { AuditLogItem } from "@/server/services/admin/audit-queries";
import { EmptyState } from "@/components/common/empty-state";
import { Pagination } from "@/components/common/pagination";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDateTime } from "@/lib/format";

const PAGE_SIZE = 20;

/** action strings follow "resource.verb" — the prefix before the first dot is the entity family, used only for display grouping here. */
function actionLabel(action: string): string {
  return action;
}

export function AuditLogTable({
  items,
  total,
  entityTypes,
}: {
  items: AuditLogItem[];
  total: number;
  entityTypes: string[];
}) {
  const [search, setSearch] = useState("");
  const [entityType, setEntityType] = useState("all");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (entityType !== "all" && item.entityType !== entityType) return false;
      if (search) {
        const q = search.toLowerCase();
        const matches =
          item.action.toLowerCase().includes(q) ||
          (item.actorLabel ?? "").toLowerCase().includes(q) ||
          (item.entityId ?? "").toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [items, search, entityType]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-foreground sm:text-3xl">Auditoria</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {total} registro(s) — mostrando os {items.length} mais recentes.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Buscar por ação, responsável ou ID…"
            className="pl-9"
          />
        </div>
        <Select value={entityType} onValueChange={(v) => { setEntityType(v ?? "all"); setPage(1); }}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Entidade" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as entidades</SelectItem>
            {entityTypes.map((type) => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Nenhum registro encontrado" description="Ajuste a busca ou o filtro." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40 text-xs text-muted-foreground uppercase">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Data</th>
                  <th className="px-4 py-3 text-left font-medium">Responsável</th>
                  <th className="px-4 py-3 text-left font-medium">Ação</th>
                  <th className="px-4 py-3 text-left font-medium">Entidade</th>
                  <th className="px-4 py-3 text-left font-medium">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pageItems.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3.5 whitespace-nowrap text-muted-foreground">
                      {formatDateTime(item.createdAt)}
                    </td>
                    <td className="px-4 py-3.5 text-foreground">{item.actorLabel ?? "—"}</td>
                    <td className="px-4 py-3.5">
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{actionLabel(item.action)}</code>
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground">
                      {item.entityType}
                      {item.entityId && <span className="ml-1 text-xs">({item.entityId.slice(0, 8)})</span>}
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground">{item.ipAddress ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onPageChange={setPage} className="pt-2" />}
    </div>
  );
}
