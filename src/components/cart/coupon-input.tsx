"use client";

import { useState } from "react";
import { Check, Loader2, Tag, X } from "lucide-react";
import { toast } from "sonner";
import { getDiscountByCode } from "@/lib/data/discounts";
import type { DiscountInput } from "@/lib/pricing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function CouponInput({
  appliedCode,
  onApply,
  onRemove,
}: {
  appliedCode: string | null;
  onApply: (discount: DiscountInput) => void;
  onRemove: () => void;
}) {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  function handleApply(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setStatus("loading");
    setTimeout(() => {
      const discount = getDiscountByCode(code.trim());
      if (discount) {
        onApply({
          code: discount.code,
          kind: discount.type,
          value: discount.value,
          minOrderCents: discount.minOrder,
        });
        toast.success("Cupom aplicado", { description: `${discount.code} adicionado ao pedido` });
        setCode("");
        setStatus("idle");
      } else {
        setStatus("error");
        toast.error("Código inválido ou expirado");
      }
    }, 600);
  }

  if (appliedCode) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-success/30 bg-success/10 px-3.5 py-2.5">
        <div className="flex items-center gap-2 text-sm font-medium text-success">
          <Check className="size-4" />
          {appliedCode} applied
        </div>
        <button
          onClick={onRemove}
          aria-label="Remove coupon"
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
              if (status === "error") setStatus("idle");
            }}
            placeholder="Discount code"
            className={cn("h-10 pl-9", status === "error" && "border-destructive")}
          />
        </div>
        <Button type="submit" variant="outline" disabled={status === "loading" || !code.trim()} className="h-10">
          {status === "loading" ? <Loader2 className="size-4 animate-spin" /> : "Apply"}
        </Button>
      </div>
      {status === "error" && <p className="text-xs text-destructive">That code isn&apos;t valid or has expired.</p>}
    </form>
  );
}
