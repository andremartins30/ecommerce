"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { changePasswordSchema, type ChangePasswordValues } from "@/server/services/account/profile-schema";
import { changePassword } from "@/server/services/account/profile-actions";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/auth/password-input";
import { PasswordStrength } from "@/components/auth/password-strength";

export function ChangePasswordForm() {
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    reset,
    setError,
    formState: { errors },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  async function onSubmit(values: ChangePasswordValues) {
    setSubmitting(true);
    setFormError(null);
    try {
      const result = await changePassword(values);
      if (!result.success) {
        if (result.fieldErrors) {
          for (const [field, message] of Object.entries(result.fieldErrors)) {
            setError(field as keyof ChangePasswordValues, { message });
          }
        }
        setFormError(result.formError ?? "Não foi possível atualizar a senha.");
        return;
      }
      reset();
      toast.success("Senha atualizada");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h2 className="font-heading text-lg font-semibold text-foreground">Alterar senha</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="currentPassword">Senha atual</Label>
          <PasswordInput id="currentPassword" {...register("currentPassword")} />
          {errors.currentPassword && (
            <p className="text-xs text-destructive">{errors.currentPassword.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="newPassword">Nova senha</Label>
          <PasswordInput id="newPassword" {...register("newPassword")} />
          <PasswordStrength password={watch("newPassword") || ""} />
          {errors.newPassword && <p className="text-xs text-destructive">{errors.newPassword.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
          <PasswordInput id="confirmPassword" {...register("confirmPassword")} />
          {errors.confirmPassword && (
            <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
          )}
        </div>
        {formError && <p className="text-sm text-destructive">{formError}</p>}
        <Button type="submit" variant="outline" disabled={submitting} className="gap-2">
          {submitting && <Loader2 className="size-4 animate-spin" />}
          {submitting ? "Atualizando…" : "Atualizar senha"}
        </Button>
      </form>
    </div>
  );
}
