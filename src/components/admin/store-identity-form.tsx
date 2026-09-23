"use client";

import { useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ImageOff } from "lucide-react";
import { toast } from "sonner";
import { storeIdentitySchema, type StoreIdentityValues } from "@/server/services/admin/settings-schema";
import { updateStoreIdentity } from "@/server/services/admin/settings-actions";
import type { StoreSettings } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export function StoreIdentityForm({ settings }: { settings: StoreSettings }) {
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm<StoreIdentityValues>({
    resolver: zodResolver(storeIdentitySchema),
    defaultValues: {
      name: settings.name,
      logoUrl: settings.logoUrl,
      faviconUrl: settings.faviconUrl,
      primaryColor: settings.primaryColor,
      email: settings.email,
      phone: settings.phone,
      whatsapp: settings.whatsapp,
      cnpj: settings.cnpj,
      address: settings.address,
    },
  });

  const logoUrl = watch("logoUrl");
  const primaryColor = watch("primaryColor");

  async function onSubmit(values: StoreIdentityValues) {
    setSubmitting(true);
    setFormError(null);
    try {
      const result = await updateStoreIdentity(values);
      if (!result.success) {
        if (result.fieldErrors) {
          for (const [field, message] of Object.entries(result.fieldErrors)) {
            setError(field as keyof StoreIdentityValues, { message });
          }
        }
        setFormError(result.formError ?? "Não foi possível salvar as configurações.");
        return;
      }
      toast.success("Configurações salvas");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-6">
      <div className="rounded-2xl border border-border p-5 sm:p-6">
        <h2 className="font-heading text-base font-semibold text-foreground">Identidade visual</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Nome, logotipo e cor de destaque usados no site, no painel e nos e-mails transacionais.
        </p>

        <div className="mt-5 flex items-center gap-4">
          <div className="flex size-20 shrink-0 items-center justify-center rounded-xl border border-border bg-white p-2">
            {logoUrl ? (
              <Image src={logoUrl} alt="Pré-visualização da logo" width={72} height={72} className="h-full w-full object-contain" unoptimized />
            ) : (
              <ImageOff className="size-6 text-muted-foreground" />
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Pré-visualização a partir da URL informada abaixo em &quot;URL da logo&quot;.
          </p>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="name">Nome da loja</Label>
            <Input id="name" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="logoUrl">URL da logo</Label>
            <Input id="logoUrl" placeholder="/logo-alquimia.png" {...register("logoUrl")} />
            {errors.logoUrl && <p className="text-xs text-destructive">{errors.logoUrl.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="faviconUrl">URL do favicon</Label>
            <Input id="faviconUrl" placeholder="/favicon.ico" {...register("faviconUrl")} />
            {errors.faviconUrl && <p className="text-xs text-destructive">{errors.faviconUrl.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="primaryColor">Cor de destaque</Label>
            <div className="flex items-center gap-2">
              <span
                className="size-8 shrink-0 rounded-md border border-border"
                style={{ backgroundColor: /^#[0-9a-fA-F]{6}$/.test(primaryColor) ? primaryColor : undefined }}
              />
              <Input id="primaryColor" placeholder="#1B1B1F" {...register("primaryColor")} />
            </div>
            {errors.primaryColor && <p className="text-xs text-destructive">{errors.primaryColor.message}</p>}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border p-5 sm:p-6">
        <h2 className="font-heading text-base font-semibold text-foreground">Contato</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Exibidos no rodapé do site e usados como remetente dos e-mails transacionais.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail de contato</Label>
            <Input id="email" type="email" placeholder="contato@alquimia.com.br" {...register("email")} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">Telefone</Label>
            <Input id="phone" placeholder="(11) 4000-0000" {...register("phone")} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <Input id="whatsapp" placeholder="(11) 90000-0000" {...register("whatsapp")} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cnpj">CNPJ</Label>
            <Input id="cnpj" placeholder="00.000.000/0000-00" {...register("cnpj")} />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="address">Endereço</Label>
            <Textarea id="address" rows={2} {...register("address")} />
          </div>
        </div>
      </div>

      {formError && <p className="text-sm text-destructive">{formError}</p>}

      <Button type="submit" size="lg" className="gap-2" disabled={submitting}>
        {submitting && <Loader2 className="size-4 animate-spin" />}
        {submitting ? "Salvando…" : "Salvar configurações"}
      </Button>
    </form>
  );
}
