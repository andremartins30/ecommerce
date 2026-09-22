"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, Loader2, Lock } from "lucide-react";
import { checkoutSchema, STEP_FIELDS, type CheckoutFormValues } from "@/lib/checkout-schema";
import { useCartStore } from "@/store/cart-store";
import { useOrderStore, generateOrderId } from "@/store/order-store";
import { computeOrderTotals } from "@/lib/pricing";
import { formatPrice } from "@/lib/format";
import { CheckoutSteps, type CheckoutStepKey } from "@/components/checkout/checkout-steps";
import { PaymentMethods } from "@/components/checkout/payment-methods";
import { OrderSummary } from "@/components/cart/order-summary";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/common/empty-state";
import { ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

const STEP_ORDER: CheckoutStepKey[] = ["information", "shipping", "payment", "review"];

export function CheckoutFlow() {
  const router = useRouter();
  const lines = useCartStore((s) => s.lines);
  const clearCart = useCartStore((s) => s.clear);
  const appliedDiscount = useCartStore((s) => s.appliedDiscount);
  const setLastOrder = useOrderStore((s) => s.setLastOrder);

  const [hydrated, setHydrated] = useState(false);
  const [step, setStep] = useState<CheckoutStepKey>("information");
  const [placing, setPlacing] = useState(false);

  useEffect(() => setHydrated(true), []);

  const activeLines = lines.filter((l) => !l.savedForLater);
  const subtotal = activeLines.reduce((sum, l) => sum + l.price * l.quantity, 0);

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      email: "",
      phone: "",
      firstName: "",
      lastName: "",
      address1: "",
      address2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "United States",
      shippingMethod: "standard",
      paymentMethod: "card",
    },
  });

  const shippingMethod = watch("shippingMethod");
  // Every amount comes from the shared pricing module. This component used to
  // hardcode its own express price and re-add the total by hand, which meant the
  // checkout could disagree with the cart.
  const {
    discountAmount,
    shipping: shippingCost,
    total: finalTotal,
  } = computeOrderTotals(subtotal, appliedDiscount, shippingMethod);
  const standardShipping = computeOrderTotals(subtotal, appliedDiscount, "standard").shipping;
  const expressShipping = computeOrderTotals(subtotal, appliedDiscount, "express").shipping;

  async function goNext() {
    const fields = STEP_FIELDS[step as keyof typeof STEP_FIELDS];
    if (fields) {
      const valid = await trigger([...fields] as (keyof CheckoutFormValues)[]);
      if (!valid) return;
    }
    const idx = STEP_ORDER.indexOf(step);
    setStep(STEP_ORDER[Math.min(idx + 1, STEP_ORDER.length - 1)]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goBack() {
    const idx = STEP_ORDER.indexOf(step);
    if (idx === 0) {
      router.push("/cart");
      return;
    }
    setStep(STEP_ORDER[idx - 1]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function onPlaceOrder(values: CheckoutFormValues) {
    setPlacing(true);
    setTimeout(() => {
      const orderId = generateOrderId();
      const paymentLabels: Record<string, string> = {
        card: `Card •••• ${values.cardNumber?.slice(-4) ?? "0000"}`,
        paypal: "PayPal",
        "apple-pay": "Apple Pay",
        "google-pay": "Google Pay",
        cod: "Cash on Delivery",
      };

      setLastOrder({
        id: orderId,
        items: activeLines.map((l) => ({
          productId: l.productId,
          name: l.name,
          image: l.image,
          variant: l.variantLabel,
          price: l.price,
          quantity: l.quantity,
        })),
        subtotal,
        discount: discountAmount,
        discountCode: appliedDiscount?.code,
        shipping: shippingCost,
        shippingMethod,
        total: finalTotal,
        paymentMethod: paymentLabels[values.paymentMethod],
        shippingAddress: {
          id: "addr-checkout",
          label: "Shipping",
          fullName: `${values.firstName} ${values.lastName}`,
          line1: values.address1,
          line2: values.address2,
          city: values.city,
          state: values.state,
          postalCode: values.postalCode,
          country: values.country,
          phone: values.phone,
          isDefault: false,
        },
        email: values.email,
        createdAt: new Date().toISOString(),
      });

      clearCart();
      router.push("/checkout/confirmation");
    }, 1200);
  }

  if (!hydrated) return <div className="container-page py-14" />;

  if (activeLines.length === 0) {
    return (
      <div className="container-page py-14">
        <EmptyState
          icon={ShoppingBag}
          title="Your bag is empty"
          description="Add something to your bag before checking out."
          actionLabel="Continue Shopping"
          actionHref="/shop"
        />
      </div>
    );
  }

  return (
    <div className="container-page grid gap-10 py-8 sm:py-10 lg:grid-cols-[1fr_400px] lg:gap-16">
      <div>
        <button
          onClick={goBack}
          className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          {step === "information" ? "Back to Bag" : "Back"}
        </button>

        <CheckoutSteps current={step} />

        <form onSubmit={handleSubmit(onPlaceOrder)} className="mt-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              {step === "information" && (
                <div className="space-y-4">
                  <h2 className="font-heading text-xl font-semibold text-foreground">Contact Information</h2>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="you@example.com" {...register("email")} />
                    {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" type="tel" placeholder="(555) 555-0100" {...register("phone")} />
                    {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input id="firstName" {...register("firstName")} />
                      {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" {...register("lastName")} />
                      {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
                    </div>
                  </div>
                </div>
              )}

              {step === "shipping" && (
                <div className="space-y-4">
                  <h2 className="font-heading text-xl font-semibold text-foreground">Shipping Address</h2>
                  <div className="space-y-1.5">
                    <Label htmlFor="address1">Address</Label>
                    <Input id="address1" placeholder="Street address" {...register("address1")} />
                    {errors.address1 && <p className="text-xs text-destructive">{errors.address1.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="address2">Apartment, suite, etc. (optional)</Label>
                    <Input id="address2" {...register("address2")} />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="city">City</Label>
                      <Input id="city" {...register("city")} />
                      {errors.city && <p className="text-xs text-destructive">{errors.city.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="state">State</Label>
                      <Input id="state" placeholder="OR" {...register("state")} />
                      {errors.state && <p className="text-xs text-destructive">{errors.state.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="postalCode">Postal Code</Label>
                      <Input id="postalCode" {...register("postalCode")} />
                      {errors.postalCode && <p className="text-xs text-destructive">{errors.postalCode.message}</p>}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="country">Country</Label>
                    <Select
                      value={watch("country")}
                      onValueChange={(v) => v && setValue("country", v, { shouldValidate: true })}
                    >
                      <SelectTrigger id="country" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="United States">United States</SelectItem>
                        <SelectItem value="Canada">Canada</SelectItem>
                        <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="pt-2">
                    <Label className="mb-2 block">Shipping Method</Label>
                    <RadioGroup
                      value={watch("shippingMethod")}
                      onValueChange={(v) => setValue("shippingMethod", v as "standard" | "express")}
                      className="gap-2.5"
                    >
                      <ShippingOption
                        value="standard"
                        selected={shippingMethod === "standard"}
                        label="Standard Shipping"
                        detail="4–7 business days"
                        price={standardShipping}
                      />
                      <ShippingOption
                        value="express"
                        selected={shippingMethod === "express"}
                        label="Express Shipping"
                        detail="1–2 business days"
                        price={expressShipping}
                      />
                    </RadioGroup>
                  </div>
                </div>
              )}

              {step === "payment" && (
                <div className="space-y-4">
                  <h2 className="font-heading text-xl font-semibold text-foreground">Payment</h2>
                  <PaymentMethods register={register} watch={watch} setValue={setValue} errors={errors} />
                </div>
              )}

              {step === "review" && (
                <ReviewStep values={getValues()} shippingCost={shippingCost} />
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-8 flex justify-end">
            {step !== "review" ? (
              <Button type="button" size="lg" onClick={goNext}>
                Continue
              </Button>
            ) : (
              <Button type="submit" size="lg" disabled={placing} className="gap-2">
                {placing && <Loader2 className="size-4 animate-spin" />}
                {placing ? "Placing Order…" : "Place Order"}
              </Button>
            )}
          </div>
        </form>
      </div>

      <div className="h-fit space-y-6 rounded-2xl border border-border bg-card p-6 lg:sticky lg:top-24">
        <div className="max-h-72 space-y-4 overflow-y-auto">
          {activeLines.map((line) => (
            <div key={line.lineId} className="flex items-center gap-3">
              <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                {line.image && (
                  <Image src={line.image} alt={line.name} fill className="object-cover" sizes="56px" />
                )}
                <span className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-foreground text-[10px] font-semibold text-background">
                  {line.quantity}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-sm font-medium text-foreground">{line.name}</p>
                {line.variantLabel && <p className="text-xs text-muted-foreground">{line.variantLabel}</p>}
              </div>
              <span className="text-sm font-medium text-foreground">
                {formatPrice(line.price * line.quantity)}
              </span>
            </div>
          ))}
        </div>
        <OrderSummary
          subtotal={subtotal}
          discount={discountAmount}
          discountLabel={appliedDiscount ? `Desconto (${appliedDiscount.code})` : undefined}
          shipping={shippingCost}
          total={finalTotal}
        />
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Lock className="size-3.5" /> Secure, encrypted checkout
        </p>
      </div>
    </div>
  );
}

function ShippingOption({
  value,
  selected,
  label,
  detail,
  price,
}: {
  value: string;
  selected: boolean;
  label: string;
  detail: string;
  price: number;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-4 transition-colors",
        selected ? "border-foreground" : "border-border"
      )}
    >
      <div className="flex items-center gap-3">
        <RadioGroupItem value={value} />
        <div>
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">{detail}</p>
        </div>
      </div>
      <span className="text-sm font-medium text-foreground">
        {price === 0 ? "Free" : formatPrice(price)}
      </span>
    </label>
  );
}

function ReviewStep({
  values,
  shippingCost,
}: {
  values: CheckoutFormValues;
  shippingCost: number;
}) {
  return (
    <div className="space-y-6">
      <h2 className="font-heading text-xl font-semibold text-foreground">Review Your Order</h2>

      <div className="rounded-xl border border-border p-4">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Contact</p>
        <p className="mt-1 text-sm text-foreground">{values.email}</p>
        <p className="text-sm text-foreground">{values.phone}</p>
      </div>

      <div className="rounded-xl border border-border p-4">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Ship To</p>
        <p className="mt-1 text-sm text-foreground">
          {values.firstName} {values.lastName}
        </p>
        <p className="text-sm text-muted-foreground">
          {values.address1}
          {values.address2 ? `, ${values.address2}` : ""}, {values.city}, {values.state}{" "}
          {values.postalCode}, {values.country}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {values.shippingMethod === "express" ? "Express Shipping" : "Standard Shipping"} —{" "}
          {shippingCost === 0 ? "Free" : formatPrice(shippingCost)}
        </p>
      </div>

      <div className="rounded-xl border border-border p-4">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Payment</p>
        <p className="mt-1 text-sm text-foreground capitalize">
          {values.paymentMethod === "card"
            ? `Card ending in ${values.cardNumber?.replace(/\s/g, "").slice(-4) ?? "----"}`
            : values.paymentMethod.replace("-", " ")}
        </p>
      </div>

      <p className="text-xs text-muted-foreground">
        This is a portfolio demo — placing an order will not charge any payment method.
      </p>
    </div>
  );
}
