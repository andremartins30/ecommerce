"use client";

import { Apple, Banknote, CreditCard, Smartphone, Wallet } from "lucide-react";
import type {
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";
import type { CheckoutFormValues } from "@/lib/checkout-schema";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const METHODS = [
  { value: "card", label: "Credit Card", icon: CreditCard },
  { value: "paypal", label: "PayPal", icon: Wallet },
  { value: "apple-pay", label: "Apple Pay", icon: Apple },
  { value: "google-pay", label: "Google Pay", icon: Smartphone },
  { value: "cod", label: "Cash on Delivery", icon: Banknote },
] as const;

function formatCardNumber(value: string) {
  return value
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, "$1 ");
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length < 3) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function PaymentMethods({
  register,
  watch,
  setValue,
  errors,
}: {
  register: UseFormRegister<CheckoutFormValues>;
  watch: UseFormWatch<CheckoutFormValues>;
  setValue: UseFormSetValue<CheckoutFormValues>;
  errors: FieldErrors<CheckoutFormValues>;
}) {
  const selected = watch("paymentMethod");

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {METHODS.map((method) => {
          const isSelected = selected === method.value;
          return (
            <button
              key={method.value}
              type="button"
              onClick={() => setValue("paymentMethod", method.value, { shouldValidate: true })}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl border px-3 py-4 text-center transition-colors",
                isSelected ? "border-foreground bg-secondary" : "border-border hover:border-foreground/40"
              )}
            >
              <method.icon className={cn("size-5", isSelected ? "text-foreground" : "text-muted-foreground")} />
              <span className="text-xs font-medium text-foreground">{method.label}</span>
            </button>
          );
        })}
      </div>

      {selected === "card" && (
        <div className="grid gap-4 rounded-xl border border-border p-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="cardName">Name on Card</Label>
            <Input id="cardName" placeholder="Jordan Avery" {...register("cardName")} />
            {errors.cardName && <p className="text-xs text-destructive">{errors.cardName.message}</p>}
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="cardNumber">Card Number</Label>
            <Input
              id="cardNumber"
              inputMode="numeric"
              placeholder="1234 5678 9012 3456"
              {...register("cardNumber", {
                onChange: (e) => setValue("cardNumber", formatCardNumber(e.target.value)),
              })}
            />
            {errors.cardNumber && <p className="text-xs text-destructive">{errors.cardNumber.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cardExpiry">Expiry</Label>
            <Input
              id="cardExpiry"
              placeholder="MM/YY"
              inputMode="numeric"
              {...register("cardExpiry", {
                onChange: (e) => setValue("cardExpiry", formatExpiry(e.target.value)),
              })}
            />
            {errors.cardExpiry && <p className="text-xs text-destructive">{errors.cardExpiry.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cardCvc">CVC</Label>
            <Input
              id="cardCvc"
              placeholder="123"
              inputMode="numeric"
              maxLength={4}
              {...register("cardCvc")}
            />
            {errors.cardCvc && <p className="text-xs text-destructive">{errors.cardCvc.message}</p>}
          </div>
        </div>
      )}

      {selected && selected !== "card" && (
        <p className="rounded-xl border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
          {selected === "cod"
            ? "Pay with cash when your order is delivered."
            : "You'll be redirected to complete payment after review. This is a demo — no real payment will be processed."}
        </p>
      )}
    </div>
  );
}
