"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";
import { forgotPasswordSchema, type ForgotPasswordValues } from "@/lib/auth-schema";
import { requestPasswordResetAction } from "@/server/services/auth/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function ForgotPasswordForm() {
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotPasswordValues) {
    setSubmitting(true);
    setFormError(null);
    try {
      const result = await requestPasswordResetAction(values);
      if (!result.success) {
        setFormError(result.formError ?? "Não foi possível enviar o link. Tente novamente.");
        return;
      }
      setSent(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-success/15">
          <MailCheck className="size-6 text-success" />
        </div>
        <h1 className="mt-5 font-heading text-2xl font-semibold text-foreground">Verifique seu e-mail</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Se houver uma conta com <span className="font-medium text-foreground">{getValues("email")}</span>,
          enviamos um link para redefinir sua senha.
        </p>
        <Button variant="outline" className="mt-6 w-full" render={<Link href="/login" />}>
          Voltar para o login
        </Button>
      </div>
    );
  }

  return (
    <div>
      <Link href="/login" className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" /> Voltar para o login
      </Link>
      <h1 className="font-heading text-2xl font-semibold text-foreground">Esqueceu a senha?</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Informe seu e-mail e enviaremos um link para redefinir sua senha.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" placeholder="voce@exemplo.com" {...register("email")} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
        {formError && <p className="text-sm text-destructive">{formError}</p>}
        <Button type="submit" size="lg" className="w-full gap-2" disabled={submitting}>
          {submitting && <Loader2 className="size-4 animate-spin" />}
          {submitting ? "Enviando…" : "Enviar link"}
        </Button>
      </form>
    </div>
  );
}
