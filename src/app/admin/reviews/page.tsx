"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Check, Search, Star as StarIcon, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useAdminReviewsStore } from "@/store/admin-reviews-store";
import { getProductById } from "@/lib/data/products";
import { StatusBadge } from "@/components/common/status-badge";
import { Rating } from "@/components/common/rating";
import { EmptyState } from "@/components/common/empty-state";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/lib/format";

export default function AdminReviewsPage() {
  const reviews = useAdminReviewsStore((s) => s.reviews);
  const setStatus = useAdminReviewsStore((s) => s.setStatus);
  const deleteReview = useAdminReviewsStore((s) => s.deleteReview);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    return reviews.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const product = getProductById(r.productId);
        if (
          !r.customerName.toLowerCase().includes(q) &&
          !r.title.toLowerCase().includes(q) &&
          !(product?.name.toLowerCase().includes(q))
        ) {
          return false;
        }
      }
      return true;
    });
  }, [reviews, search, statusFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-foreground sm:text-3xl">Reviews</h1>
        <p className="mt-1 text-sm text-muted-foreground">{reviews.length} total reviews</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search reviews…" className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={StarIcon} title="No reviews found" description="Try adjusting your search or filters." />
      ) : (
        <div className="space-y-4">
          {filtered.map((review) => {
            const product = getProductById(review.productId);
            return (
              <div key={review.id} className="flex flex-col gap-4 rounded-2xl border border-border p-5 sm:flex-row">
                {product && (
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                    <Image src={product.images[0]?.url} alt={product.name} fill className="object-cover" sizes="64px" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-foreground">{review.customerName}</p>
                    <span className="text-xs text-muted-foreground">on {product?.name ?? "Unknown product"}</span>
                    <StatusBadge status={review.status} />
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <Rating value={review.rating} size="xs" />
                    <span className="text-xs text-muted-foreground">{formatDate(review.createdAt)}</span>
                  </div>
                  <h3 className="mt-2 text-sm font-semibold text-foreground">{review.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{review.content}</p>
                </div>
                <div className="flex shrink-0 gap-2 sm:flex-col">
                  {review.status !== "approved" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      onClick={() => { setStatus(review.id, "approved"); toast.success("Review approved"); }}
                    >
                      <Check className="size-3.5" /> Approve
                    </Button>
                  )}
                  {review.status !== "rejected" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      onClick={() => { setStatus(review.id, "rejected"); toast("Review rejected"); }}
                    >
                      <X className="size-3.5" /> Reject
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => { deleteReview(review.id); toast("Review deleted"); }}
                  >
                    <Trash2 className="size-3.5" /> Delete
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
