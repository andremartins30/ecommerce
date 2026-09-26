"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, Tag, X } from "lucide-react";
import { toast } from "sonner";
import { applyCoupon, removeCoupon } from "@/server/services/cart/cart-actions";
import type { CartCoupon } from "@/server/services/cart/cart-queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function CouponInput({
  coupon,
  onChanged,
}: {
  coupon: CartCoupon | null;
  onChanged?: () => void;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleApply(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await applyCoupon({ code });
      if (result.success) {
        toast.success("Cupom aplicado", { description: `${code.trim().toUpperCase()} adicionado ao pedido` });
        setCode("");
        onChanged?.();
      } else {
        setError(result.formError ?? "Código inválido ou expirado.");
        toast.error(result.formError ?? "Código inválido ou expirado.");
      }
    });
  }

  function handleRemove() {
    startTransition(async () => {
      const result = await removeCoupon();
      if (result.success) onChanged?.();
    });
  }

  if (coupon?.valid) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-success/30 bg-success/10 px-3.5 py-2.5">
        <div className="flex items-center gap-2 text-sm font-medium text-success">
          <Check className="size-4" />
          {coupon.code} aplicado
        </div>
        <button
          onClick={handleRemove}
          disabled={isPending}
          aria-label="Remover cupom"
          className="rounded-md p-1 text-success hover:bg-success/15"
        >
          <X className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleApply} className="space-y-1.5">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Tag className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              if (error) setError(null);
            }}
            placeholder="Código de desconto"
            className={cn("h-10 pl-9", error && "border-destructive")}
          />
        </div>
        <Button type="submit" variant="outline" disabled={isPending || !code.trim()} className="h-10">
          {isPending ? <Loader2 className="size-4 animate-spin" /> : "Aplicar"}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </form>
  );
}
