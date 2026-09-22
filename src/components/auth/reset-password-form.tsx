"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Check, Loader2 } from "lucide-react";
import { resetPasswordSchema, type ResetPasswordValues } from "@/lib/auth-schema";
import { resetPasswordAction } from "@/server/services/auth/actions";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/auth/password-input";
import { PasswordStrength } from "@/components/auth/password-strength";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  async function onSubmit(values: ResetPasswordValues) {
    setSubmitting(true);
    setFormError(null);
    try {
      const result = await resetPasswordAction(token, values);
      if (!result.success) {
        setFormError(result.formError ?? "Não foi possível redefinir a senha. Tente novamente.");
        return;
      }
      setDone(true);
      setTimeout(() => router.push("/login"), 1600);
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <div className="text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-destructive/15">
          <AlertTriangle className="size-6 text-destructive" />
        </div>
        <h1 className="mt-5 font-heading text-2xl font-semibold text-foreground">Link inválido</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Este link de redefinição está incompleto ou expirou. Solicite um novo.
        </p>
        <Button className="mt-6 w-full" render={<Link href="/forgot-password" />}>
          Solicitar novo link
        </Button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-success/15">
          <Check className="size-6 text-success" />
        </div>
        <h1 className="mt-5 font-heading text-2xl font-semibold text-foreground">Senha redefinida</h1>
        <p className="mt-2 text-sm text-muted-foreground">Redirecionando para o login…</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-semibold text-foreground">Defina uma nova senha</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Escolha uma senha forte que você ainda não tenha usado.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="password">Nova senha</Label>
          <PasswordInput id="password" placeholder="••••••••" {...register("password")} />
          <PasswordStrength password={watch("password") || ""} />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirmar senha</Label>
          <PasswordInput id="confirmPassword" placeholder="••••••••" {...register("confirmPassword")} />
          {errors.confirmPassword && (
            <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
          )}
        </div>
        {formError && <p className="text-sm text-destructive">{formError}</p>}
        <Button type="submit" size="lg" className="w-full gap-2" disabled={submitting}>
          {submitting && <Loader2 className="size-4 animate-spin" />}
          {submitting ? "Salvando…" : "Redefinir senha"}
        </Button>
      </form>

      <p className="mt-7 text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-medium text-foreground hover:underline">
          Voltar para o login
        </Link>
      </p>
    </div>
  );
}
