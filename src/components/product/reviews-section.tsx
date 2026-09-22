"use client";

import { useState } from "react";
import { BadgeCheck, MessageSquare, Star, ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import type { ReviewDto } from "@/lib/types";
import { Rating } from "@/components/common/rating";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/common/empty-state";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export function ReviewsSection({
  productId,
  reviews,
  rating,
  reviewCount,
}: {
  productId: string;
  reviews: ReviewDto[];
  /** Null when nobody has reviewed the product yet. */
  rating: number | null;
  reviewCount: number;
}) {
  const [helpful, setHelpful] = useState<Record<string, boolean>>({});
  const [dialogOpen, setDialogOpen] = useState(false);

  const breakdown = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => Math.round(r.rating) === star).length;
    return { star, count, percent: reviews.length ? (count / reviews.length) * 100 : 0 };
  });

  return (
    <div id="reviews" className="grid gap-10 lg:grid-cols-[280px_1fr]">
      <div>
        <div className="flex items-baseline gap-2">
          <span className="font-heading text-4xl font-semibold text-foreground">
            {rating !== null ? rating.toFixed(1) : "—"}
          </span>
          <span className="text-muted-foreground">/ 5</span>
        </div>
        <Rating value={rating ?? 0} size="md" className="mt-2" />
        <p className="mt-1 text-sm text-muted-foreground">
          {reviewCount > 0 ? `Com base em ${reviewCount} avaliações` : "Ainda sem avaliações"}
        </p>

        <div className="mt-5 space-y-1.5">
          {breakdown.map((b) => (
            <div key={b.star} className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="w-3">{b.star}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-accent" style={{ width: `${b.percent}%` }} />
              </div>
              <span className="w-6 text-right">{b.count}</span>
            </div>
          ))}
        </div>

        <Button variant="outline" className="mt-6 w-full" onClick={() => setDialogOpen(true)}>
          Avaliar este produto
        </Button>
      </div>

      <div>
        {reviews.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="Nenhuma avaliação ainda"
            description="Seja o primeiro a avaliar este produto."
          />
        ) : (
          <ul className="space-y-6">
            {reviews.map((review) => (
              <li key={review.id} className="border-b border-border pb-6 last:border-0">
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{review.authorName}</p>
                      {review.verifiedPurchase && (
                        <span className="flex items-center gap-1 text-xs text-success">
                          <BadgeCheck className="size-3.5" /> Compra verificada
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <Rating value={review.rating} size="xs" />
                      <span className="text-xs text-muted-foreground">
                        {formatDate(review.createdAt)}
                      </span>
                    </div>
                    <h4 className="mt-2 text-sm font-semibold text-foreground">{review.title}</h4>
                    <p className="mt-1 text-sm text-muted-foreground">{review.body}</p>
                    <button
                      onClick={() => setHelpful((h) => ({ ...h, [review.id]: !h[review.id] }))}
                      className={cn(
                        "mt-3 flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground",
                        helpful[review.id] && "text-accent hover:text-accent"
                      )}
                    >
                      <ThumbsUp className="size-3.5" />
                      Útil ({review.helpfulCount + (helpful[review.id] ? 1 : 0)})
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <WriteReviewDialog productId={productId} open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}

function WriteReviewDialog({
  productId,
  open,
  onOpenChange,
}: {
  productId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [selectedRating, setSelectedRating] = useState(5);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setSubmitting(true);
    // TODO(task 22): submit through a Server Action once reviews are backed by
    // the database and tied to a verified order.
    setTimeout(() => {
      setSubmitting(false);
      onOpenChange(false);
      setTitle("");
      setContent("");
      setSelectedRating(5);
      toast.success("Avaliação enviada", {
        description: "Obrigado — sua avaliação está pendente de aprovação.",
      });
    }, 700);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Avaliar este produto</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4" id={`review-form-${productId}`}>
          <div>
            <Label className="mb-2 block">Sua nota</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setSelectedRating(star)}
                  aria-label={`${star} estrelas`}
                  className="p-0.5"
                >
                  <Star
                    className={cn(
                      "size-6 transition-colors",
                      star <= selectedRating
                        ? "fill-accent text-accent"
                        : "fill-transparent text-muted-foreground/40"
                    )}
                    strokeWidth={1.5}
                  />
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="review-title">Título</Label>
            <Input
              id="review-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Resuma sua experiência"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="review-content">Avaliação</Label>
            <Textarea
              id="review-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="O que você achou do produto?"
              rows={4}
              required
            />
          </div>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit" form={`review-form-${productId}`} disabled={submitting}>
            {submitting ? "Enviando…" : "Enviar avaliação"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
