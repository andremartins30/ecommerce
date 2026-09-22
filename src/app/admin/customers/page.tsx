"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, Users } from "lucide-react";
import { customers } from "@/lib/data/customers";
import { StatusBadge } from "@/components/common/status-badge";
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
import { formatDate, formatPrice } from "@/lib/format";

const PAGE_SIZE = 10;

export default function AdminCustomersPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return customers.filter((c) => {
      if (status !== "all" && c.status !== status) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!c.name.toLowerCase().includes(q) && !c.email.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [search, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageCustomers = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-foreground sm:text-3xl">Customers</h1>
        <p className="mt-1 text-sm text-muted-foreground">{customers.length} customers</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name or email…"
            className="pl-9"
          />
        </div>
        <Select value={status} onValueChange={(v) => { setStatus(v ?? "all"); setPage(1); }}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="vip">VIP</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="No customers found" description="Try adjusting your search or filters." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40 text-xs text-muted-foreground uppercase">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Customer</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Orders</th>
                  <th className="px-4 py-3 text-right font-medium">Total Spent</th>
                  <th className="px-4 py-3 text-left font-medium">Last Order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pageCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3.5">
                      <Link href={`/admin/customers/${customer.id}`} className="flex items-center gap-3">
                        <div className="relative size-9 shrink-0 overflow-hidden rounded-full bg-muted">
                          {customer.avatar && (
                            <Image src={customer.avatar} alt={customer.name} fill className="object-cover" sizes="36px" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground hover:underline">{customer.name}</p>
                          <p className="text-xs text-muted-foreground">{customer.email}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={customer.status} />
                    </td>
                    <td className="px-4 py-3.5 text-right text-foreground">{customer.ordersCount}</td>
                    <td className="px-4 py-3.5 text-right font-medium text-foreground">
                      {formatPrice(customer.totalSpent)}
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground">
                      {customer.lastOrderAt ? formatDate(customer.lastOrderAt) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />}
    </div>
  );
}
