"use client";

import { useState } from "react";
import { CreditCard, MoreVertical, Plus } from "lucide-react";
import { toast } from "sonner";
import { useProfileStore } from "@/store/profile-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { EmptyState } from "@/components/common/empty-state";

export default function PaymentMethodsPage() {
  const paymentMethods = useProfileStore((s) => s.paymentMethods);
  const removePaymentMethod = useProfileStore((s) => s.removePaymentMethod);
  const setDefaultPaymentMethod = useProfileStore((s) => s.setDefaultPaymentMethod);
  const addPaymentMethod = useProfileStore((s) => s.addPaymentMethod);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const last4 = cardNumber.replace(/\D/g, "").slice(-4) || "0000";
    addPaymentMethod({ type: "visa", last4, expiry: expiry || "12/28", isDefault: paymentMethods.length === 0 });
    toast.success("Card added");
    setCardNumber("");
    setExpiry("");
    setDialogOpen(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-foreground">Payment Methods</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Manage your saved cards.</p>
        </div>
        <Button className="gap-1.5" onClick={() => setDialogOpen(true)}>
          <Plus className="size-4" /> Add Card
        </Button>
      </div>

      {paymentMethods.length === 0 ? (
        <div className="mt-8">
          <EmptyState icon={CreditCard} title="No payment methods" description="Add a card to check out faster." />
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {paymentMethods.map((pm) => (
            <div key={pm.id} className="rounded-2xl border border-border p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-11 items-center justify-center rounded bg-secondary text-[10px] font-bold tracking-wide text-foreground uppercase">
                    {pm.type}
                  </div>
                  {pm.isDefault && <Badge variant="secondary">Default</Badge>}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger className="rounded-md p-1 text-muted-foreground hover:bg-muted">
                    <MoreVertical className="size-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {!pm.isDefault && (
                      <DropdownMenuItem
                        onClick={() => {
                          setDefaultPaymentMethod(pm.id);
                          toast.success("Default card updated");
                        }}
                      >
                        Set as default
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => {
                        removePaymentMethod(pm.id);
                        toast("Card removed");
                      }}
                    >
                      Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <p className="mt-4 font-heading text-lg tracking-wider text-foreground">
                •••• •••• •••• {pm.last4}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">Expires {pm.expiry}</p>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Card</DialogTitle>
          </DialogHeader>
          <form id="card-form" onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="cardNumber">Card Number</Label>
              <Input
                id="cardNumber"
                placeholder="1234 5678 9012 3456"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="expiry">Expiry</Label>
              <Input
                id="expiry"
                placeholder="MM/YY"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                required
              />
            </div>
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="card-form">
              Add Card
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
