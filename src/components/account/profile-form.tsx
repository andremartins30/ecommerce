"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { profileSchema, type ProfileValues } from "@/server/services/account/profile-schema";
import { updateProfile } from "@/server/services/account/profile-actions";
import type { AccountProfile } from "@/server/services/account/profile-queries";
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

export function ProfileForm({ profile }: { profile: AccountProfile }) {
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isDirty },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: profile.name,
      phone: profile.phone ?? "",
      documentType: profile.documentType,
      document: profile.document ?? "",
      birthDate: profile.birthDate,
      acceptsMarketing: profile.acceptsMarketing,
    },
  });

  const documentType = watch("documentType");

  async function onSubmit(values: ProfileValues) {
    setSubmitting(true);
    setFormError(null);
    try {
      const result = await updateProfile(values);
      if (!result.success) {
        if (result.fieldErrors) {
          for (const [field, message] of Object.entries(result.fieldErrors)) {
            setError(field as keyof ProfileValues, { message });
          }
        }
        setFormError(result.formError ?? "Não foi possível salvar o perfil.");
        return;
      }
      toast.success("Perfil atualizado");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Nome completo</Label>
        <Input id="name" {...register("name")} />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="phone">Telefone</Label>
        <Input id="phone" type="tel" placeholder="11999998888" {...register("phone")} />
        {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="documentType">Tipo de documento</Label>
          <Select
            value={documentType ?? "none"}
            onValueChange={(v) => setValue("documentType", v === "none" ? null : (v as "CPF" | "CNPJ"), { shouldDirty: true })}
          >
            <SelectTrigger id="documentType" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Não informar</SelectItem>
              <SelectItem value="CPF">CPF</SelectItem>
              <SelectItem value="CNPJ">CNPJ</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="document">{documentType === "CNPJ" ? "CNPJ" : "CPF"}</Label>
          <Input
            id="document"
            placeholder={documentType === "CNPJ" ? "00.000.000/0000-00" : "000.000.000-00"}
            disabled={!documentType}
            {...register("document")}
          />
          {errors.document && <p className="text-xs text-destructive">{errors.document.message}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="birthDate">Data de nascimento</Label>
        <Input
          id="birthDate"
          type="date"
          value={watch("birthDate") ?? ""}
          onChange={(e) => setValue("birthDate", e.target.value || null, { shouldDirty: true })}
        />
      </div>

      <label className="flex items-center gap-2.5 text-sm text-foreground">
        <Checkbox
          checked={watch("acceptsMarketing")}
          onCheckedChange={(checked) => setValue("acceptsMarketing", !!checked, { shouldDirty: true })}
        />
        Quero receber novidades e promoções por e-mail
      </label>

      {formError && <p className="text-sm text-destructive">{formError}</p>}

      <Button type="submit" disabled={submitting || !isDirty} className="gap-2">
        {submitting && <Loader2 className="size-4 animate-spin" />}
        {submitting ? "Salvando…" : "Salvar alterações"}
      </Button>
    </form>
  );
}
