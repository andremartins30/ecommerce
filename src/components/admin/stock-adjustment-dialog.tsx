"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PackagePlus } from "lucide-react";
import { toast } from "sonner";
import { adjustInventory } from "@/server/services/admin/inventory-actions";
import {
  MANUAL_MOVEMENT_TYPES,
  DECREASING_MOVEMENT_TYPES,
  type ManualMovementType,
} from "@/server/services/admin/inventory-schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TYPE_LABELS: Record<ManualMovementType, string> = {
  PURCHASE: "Compra / reposição",
  PRODUCTION: "Produção concluída",
  RETURN: "Devolução ao estoque",
  ADJUSTMENT: "Ajuste manual",
  LOSS: "Perda / quebra",
};

function directionFor(type: ManualMovementType): "IN" | "OUT" {
  return DECREASING_MOVEMENT_TYPES.includes(type) ? "OUT" : "IN";
}

/**
 * One manual movement per dialog submission — this is a ledger, not an
 * editable field, so there is no "current stock" input to overwrite. The
 * operator states what happened (a purchase arrived, a bottle broke) and the
 * Server Action derives the new balance.
 */
export function StockAdjustmentDialog({
  variantId,
  variantLabel,
  currentOnHand,
}: {
  variantId: string;
  variantLabel: string;
  currentOnHand: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [type, setType] = useState<ManualMovementType>("PURCHASE");
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const direction = directionFor(type);
  const requiresReason = type === "ADJUSTMENT" || type === "LOSS";

  function reset() {
    setType("PURCHASE");
    setQuantity(1);
    setReason("");
    setError(null);
  }

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await adjustInventory({
        variantId,
        type,
        quantity,
        direction,
        reason: reason.trim() || null,
      });

      if (!result.success) {
        setError(result.formError ?? Object.values(result.fieldErrors ?? {})[0] ?? "Não foi possível ajustar o estoque.");
        return;
      }

      toast.success("Estoque ajustado");
      setOpen(false);
      reset();
      router.refresh();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger render={<Button variant="outline" size="sm" className="gap-1.5" />}>
        <PackagePlus className="size-3.5" />
        Ajustar
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajustar estoque</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {variantLabel} · {currentOnHand} unidade(s) em mãos atualmente
          </p>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="movement-type">Tipo de movimento</Label>
            <Select value={type} onValueChange={(v) => v && setType(v as ManualMovementType)}>
              <SelectTrigger id="movement-type" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {MANUAL_MOVEMENT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{TYPE_LABELS[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {direction === "IN" ? "Este tipo aumenta o estoque." : "Este tipo reduz o estoque."}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="movement-quantity">Quantidade</Label>
            <Input
              id="movement-quantity"
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="movement-reason">
              Motivo {requiresReason ? "(obrigatório)" : "(opcional)"}
            </Label>
            <Textarea
              id="movement-reason"
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={requiresReason ? "Descreva o motivo do ajuste ou da perda" : undefined}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Salvando…" : "Confirmar ajuste"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
