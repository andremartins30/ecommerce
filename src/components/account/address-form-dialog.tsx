"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { addressSchema, type AddressValues, BRAZILIAN_STATES } from "@/server/services/account/address-schema";
import { createAddress, updateAddress } from "@/server/services/account/address-actions";
import type { AccountAddress } from "@/server/services/account/address-queries";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const EMPTY_VALUES: AddressValues = {
  label: "Casa",
  recipient: "",
  postalCode: "",
  street: "",
  number: "",
  complement: "",
  district: "",
  city: "",
  state: "SP",
  phone: "",
  isDefaultShipping: false,
  isDefaultBilling: false,
};

export function AddressFormDialog({
  open,
  onOpenChange,
  address,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  address?: AccountAddress;
  onSaved?: () => void;
}) {
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AddressValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: EMPTY_VALUES,
  });

  useEffect(() => {
    if (open) {
      setFormError(null);
      reset(
        address
          ? {
            label: address.label,
            recipient: address.recipient,
            postalCode: address.postalCode,
            street: address.street,
            number: address.number,
            complement: address.complement ?? "",
            district: address.district,
            city: address.city,
            state: address.state as AddressValues["state"],
            phone: address.phone ?? "",
            isDefaultShipping: address.isDefaultShipping,
            isDefaultBilling: address.isDefaultBilling,
          }
          : EMPTY_VALUES
      );
    }
  }, [open, address, reset]);

  async function onSubmit(values: AddressValues) {
    setFormError(null);
    const result = address ? await updateAddress(address.id, values) : await createAddress(values);

    if (!result.success) {
      if (result.fieldErrors) {
        for (const [field, message] of Object.entries(result.fieldErrors)) {
          setError(field as keyof AddressValues, { message });
        }
      }
      setFormError(result.formError ?? "Não foi possível salvar o endereço.");
      return;
    }

    toast.success(address ? "Endereço atualizado" : "Endereço adicionado");
    onOpenChange(false);
    onSaved?.();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{address ? "Editar endereço" : "Adicionar endereço"}</DialogTitle>
        </DialogHeader>
        <form id="address-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="label">Nome do endereço</Label>
              <Input id="label" placeholder="Casa, Trabalho…" {...register("label")} />
              {errors.label && <p className="text-xs text-destructive">{errors.label.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="recipient">Destinatário</Label>
              <Input id="recipient" {...register("recipient")} />
              {errors.recipient && <p className="text-xs text-destructive">{errors.recipient.message}</p>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="postalCode">CEP</Label>
              <Input id="postalCode" placeholder="00000000" {...register("postalCode")} />
              {errors.postalCode && <p className="text-xs text-destructive">{errors.postalCode.message}</p>}
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="street">Logradouro</Label>
              <Input id="street" {...register("street")} />
              {errors.street && <p className="text-xs text-destructive">{errors.street.message}</p>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="number">Número</Label>
              <Input id="number" {...register("number")} />
              {errors.number && <p className="text-xs text-destructive">{errors.number.message}</p>}
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="complement">Complemento (opcional)</Label>
              <Input id="complement" {...register("complement")} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="district">Bairro</Label>
            <Input id="district" {...register("district")} />
            {errors.district && <p className="text-xs text-destructive">{errors.district.message}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="city">Cidade</Label>
              <Input id="city" {...register("city")} />
              {errors.city && <p className="text-xs text-destructive">{errors.city.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="state">UF</Label>
              <Select value={watch("state")} onValueChange={(v) => v && setValue("state", v as AddressValues["state"])}>
                <SelectTrigger id="state" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BRAZILIAN_STATES.map((uf) => (
                    <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">Telefone (opcional)</Label>
            <Input id="phone" placeholder="11999998888" {...register("phone")} />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
          </div>

          <label className="flex items-center gap-2.5 text-sm text-foreground">
            <Checkbox
              checked={watch("isDefaultShipping")}
              onCheckedChange={(checked) => setValue("isDefaultShipping", !!checked)}
            />
            Usar como endereço de entrega padrão
          </label>

          {formError && <p className="text-sm text-destructive">{formError}</p>}
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit" form="address-form" disabled={isSubmitting}>
            {isSubmitting ? "Salvando…" : "Salvar endereço"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
