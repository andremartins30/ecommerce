import { z } from "zod";

export const checkoutSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  phone: z.string().min(7, "Enter a valid phone number"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  address1: z.string().min(1, "Address is required"),
  address2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(2, "State is required"),
  postalCode: z.string().min(3, "Postal code is required"),
  country: z.string().min(1, "Country is required"),
  shippingMethod: z.enum(["standard", "express"]),
  paymentMethod: z.enum(["card", "paypal", "apple-pay", "google-pay", "cod"]),
  cardName: z.string().optional(),
  cardNumber: z.string().optional(),
  cardExpiry: z.string().optional(),
  cardCvc: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.paymentMethod === "card") {
    if (!data.cardName?.trim()) {
      ctx.addIssue({ code: "custom", path: ["cardName"], message: "Name on card is required" });
    }
    if (!data.cardNumber || data.cardNumber.replace(/\s/g, "").length < 15) {
      ctx.addIssue({ code: "custom", path: ["cardNumber"], message: "Enter a valid card number" });
    }
    if (!data.cardExpiry || !/^\d{2}\/\d{2}$/.test(data.cardExpiry)) {
      ctx.addIssue({ code: "custom", path: ["cardExpiry"], message: "Use MM/YY format" });
    }
    if (!data.cardCvc || data.cardCvc.length < 3) {
      ctx.addIssue({ code: "custom", path: ["cardCvc"], message: "Enter a valid CVC" });
    }
  }
});

export type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export const STEP_FIELDS = {
  information: ["email", "phone", "firstName", "lastName"] as const,
  shipping: ["address1", "city", "state", "postalCode", "country", "shippingMethod"] as const,
  payment: ["paymentMethod", "cardName", "cardNumber", "cardExpiry", "cardCvc"] as const,
};
