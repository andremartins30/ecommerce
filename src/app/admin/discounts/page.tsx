"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MoreHorizontal, Plus, Ticket } from "lucide-react";
import { toast } from "sonner";
import { useAdminDiscountsStore } from "@/store/admin-discounts-store";
import type { LegacyDiscount as Discount, LegacyDiscountType as DiscountType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/common/status-badge";
import { EmptyState } from "@/components/common/empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate, formatPrice } from "@/lib/format";

const discountSchema = z.object({
  code: z.string().min(3, "Code must be at least 3 characters").toUpperCase(),
  type: z.enum(["percentage", "fixed", "free_shipping"]),
  value: z.coerce.number().min(0),
  minOrder: z.coerce.number().min(0).optional(),
  usageLimit: z.coerce.number().min(1),
  startsAt: z.string().min(1, "Start date is required"),
  expiresAt: z.string().min(1, "Expiry date is required"),
});
type DiscountValues = z.infer<typeof discountSchema>;

function statusFor(discount: Discount): Discount["status"] {
  const now = new Date();
  if (new Date(discount.startsAt) > now) return "scheduled";
  if (new Date(discount.expiresAt) < now) return "expired";
  return "active";
}

export default function AdminDiscountsPage() {
  const discounts = useAdminDiscountsStore((s) => s.discounts);
  const upsertDiscount = useAdminDiscountsStore((s) => s.upsertDiscount);
  const deleteDiscount = useAdminDiscountsStore((s) => s.deleteDiscount);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Discount | undefined>(undefined);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<DiscountValues>({ resolver: zodResolver(discountSchema) });

  useEffect(() => {
    if (dialogOpen) {
      reset(
        editing
          ? {
            code: editing.code,
            type: editing.type,
            value: editing.value,
            minOrder: editing.minOrder,
            usageLimit: editing.usageLimit,
            startsAt: editing.startsAt.slice(0, 10),
            expiresAt: editing.expiresAt.slice(0, 10),
          }
          : {
            code: "",
            type: "percentage",
            value: 10,
            minOrder: 0,
            usageLimit: 100,
            startsAt: new Date().toISOString().slice(0, 10),
            expiresAt: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
          }
      );
    }
  }, [dialogOpen, editing, reset]);

  function onSubmit(values: DiscountValues) {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        upsertDiscount({
          id: editing?.id ?? `disc-${Date.now()}`,
          code: values.code.toUpperCase(),
          type: values.type,
          value: values.value,
          minOrder: values.minOrder,
          usageLimit: values.usageLimit,
          usageCount: editing?.usageCount ?? 0,
          startsAt: new Date(values.startsAt).toISOString(),
          expiresAt: new Date(values.expiresAt).toISOString(),
          status: "active",
        });
        toast.success(editing ? "Discount updated" : "Discount created");
        setDialogOpen(false);
        resolve();
      }, 500);
    });
  }

  function formatValue(discount: Discount) {
    if (discount.type === "percentage") return `${discount.value}% off`;
    if (discount.type === "fixed") return `${formatPrice(discount.value)} off`;
    return "Free shipping";
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-foreground sm:text-3xl">Discounts</h1>
          <p className="mt-1 text-sm text-muted-foreground">{discounts.length} discount codes</p>
        </div>
        <Button className="gap-1.5" onClick={() => { setEditing(undefined); setDialogOpen(true); }}>
          <Plus className="size-4" /> Create Discount
        </Button>
      </div>

      {discounts.length === 0 ? (
        <EmptyState icon={Ticket} title="No discounts yet" description="Create your first discount code." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40 text-xs text-muted-foreground uppercase">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Code</th>
                  <th className="px-4 py-3 text-left font-medium">Value</th>
                  <th className="px-4 py-3 text-left font-medium">Min Order</th>
                  <th className="px-4 py-3 text-left font-medium">Usage</th>
                  <th className="px-4 py-3 text-left font-medium">Expires</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="w-10 px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {discounts.map((discount) => (
                  <tr key={discount.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3.5 font-mono text-sm font-medium text-foreground">{discount.code}</td>
                    <td className="px-4 py-3.5 text-foreground">{formatValue(discount)}</td>
                    <td className="px-4 py-3.5 text-muted-foreground">
                      {discount.minOrder ? formatPrice(discount.minOrder) : "—"}
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground">
                      {discount.usageCount} / {discount.usageLimit}
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground">{formatDate(discount.expiresAt)}</td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={statusFor(discount)} />
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="rounded-md p-1.5 text-muted-foreground hover:bg-muted">
                          <MoreHorizontal className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setEditing(discount); setDialogOpen(true); }}>
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => { deleteDiscount(discount.id); toast("Discount deleted"); }}
                          >
                            Delete
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Discount" : "Create Discount"}</DialogTitle>
          </DialogHeader>
          <form id="discount-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="code">Coupon Code</Label>
              <Input id="code" className="uppercase" {...register("code")} />
              {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="type">Type</Label>
                <Select value={watch("type")} onValueChange={(v) => setValue("type", v as DiscountType)}>
                  <SelectTrigger id="type" className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                    <SelectItem value="free_shipping">Free Shipping</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="value">Value</Label>
                <Input id="value" type="number" disabled={watch("type") === "free_shipping"} {...register("value")} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="minOrder">Minimum Order ($)</Label>
                <Input id="minOrder" type="number" {...register("minOrder")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="usageLimit">Usage Limit</Label>
                <Input id="usageLimit" type="number" {...register("usageLimit")} />
                {errors.usageLimit && <p className="text-xs text-destructive">{errors.usageLimit.message}</p>}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="startsAt">Start Date</Label>
                <Input id="startsAt" type="date" {...register("startsAt")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="expiresAt">Expiration Date</Label>
                <Input id="expiresAt" type="date" {...register("expiresAt")} />
              </div>
            </div>
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" form="discount-form" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : "Save Discount"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
