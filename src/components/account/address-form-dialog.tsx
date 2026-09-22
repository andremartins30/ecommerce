"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import type { LegacyAddress as Address } from "@/lib/types";
import { useProfileStore } from "@/store/profile-store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

const addressSchema = z.object({
  label: z.string().min(1, "Label is required"),
  fullName: z.string().min(1, "Full name is required"),
  line1: z.string().min(1, "Address is required"),
  line2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  country: z.string().min(1, "Country is required"),
  phone: z.string().min(7, "Enter a valid phone number"),
  isDefault: z.boolean().optional(),
});
type AddressValues = z.infer<typeof addressSchema>;

export function AddressFormDialog({
  open,
  onOpenChange,
  address,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  address?: Address;
}) {
  const addAddress = useProfileStore((s) => s.addAddress);
  const updateAddress = useProfileStore((s) => s.updateAddress);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AddressValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      label: "Home",
      fullName: "",
      line1: "",
      line2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "United States",
      phone: "",
      isDefault: false,
    },
  });

  useEffect(() => {
    if (open) {
      reset(
        address ?? {
          label: "Home",
          fullName: "",
          line1: "",
          line2: "",
          city: "",
          state: "",
          postalCode: "",
          country: "United States",
          phone: "",
          isDefault: false,
        }
      );
    }
  }, [open, address, reset]);

  function onSubmit(values: AddressValues) {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        if (address) {
          updateAddress(address.id, { ...values, isDefault: !!values.isDefault });
          toast.success("Address updated");
        } else {
          addAddress({ ...values, isDefault: !!values.isDefault });
          toast.success("Address added");
        }
        onOpenChange(false);
        resolve();
      }, 500);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{address ? "Edit Address" : "Add Address"}</DialogTitle>
        </DialogHeader>
        <form id="address-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="label">Label</Label>
              <Input id="label" placeholder="Home, Work…" {...register("label")} />
              {errors.label && <p className="text-xs text-destructive">{errors.label.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" {...register("fullName")} />
              {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="line1">Address</Label>
            <Input id="line1" {...register("line1")} />
            {errors.line1 && <p className="text-xs text-destructive">{errors.line1.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="line2">Apartment, suite, etc. (optional)</Label>
            <Input id="line2" {...register("line2")} />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="city">City</Label>
              <Input id="city" {...register("city")} />
              {errors.city && <p className="text-xs text-destructive">{errors.city.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="state">State</Label>
              <Input id="state" {...register("state")} />
              {errors.state && <p className="text-xs text-destructive">{errors.state.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="postalCode">Postal Code</Label>
              <Input id="postalCode" {...register("postalCode")} />
              {errors.postalCode && <p className="text-xs text-destructive">{errors.postalCode.message}</p>}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="country">Country</Label>
              <Input id="country" {...register("country")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" {...register("phone")} />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
            </div>
          </div>
          <label className="flex items-center gap-2.5 text-sm text-foreground">
            <Checkbox
              checked={watch("isDefault")}
              onCheckedChange={(checked) => setValue("isDefault", !!checked)}
            />
            Set as default address
          </label>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="address-form" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Save Address"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
