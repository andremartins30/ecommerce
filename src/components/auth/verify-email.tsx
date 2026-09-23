"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, CheckCircle2, Loader2, MailWarning } from "lucide-react";
import { toast } from "sonner";
import { verifyEmailAction, resendVerificationAction } from "@/server/services/auth/actions";
import { Button } from "@/components/ui/button";

interface VerifyState {
  status: "verifying" | "success" | "error";
  errorMessage: string | null;
}

export function VerifyEmail() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [state, setState] = useState<VerifyState>(
    token ? { status: "verifying", errorMessage: null } : { status: "error", errorMessage: "Este link está incompleto." }
  );

  useEffect(() => {
    if (!token) return;
    // Guards against React Strict Mode's double-invoke in development
    // firing this twice for the same token — the Server Action itself is
    // also idempotent (see verifyEmailAction), this just avoids a redundant
    // second round-trip.
    let cancelled = false;
    verifyEmailAction(token).then((result) => {
      if (cancelled) return;
      setState(
        result.success
          ? { status: "success", errorMessage: null }
          : { status: "error", errorMessage: result.formError ?? "Não foi possível verificar seu e-mail." }
      );
    });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const { status, errorMessage } = state;

  async function handleResend() {
    const result = await resendVerificationAction();
    if (result.success) {
      toast.success("E-mail de verificação reenviado", { description: "Confira sua caixa de entrada em alguns minutos." });
    } else {
      toast.error(result.formError ?? "Não foi possível reenviar o e-mail.");
    }
  }

  if (status === "verifying") {
    return (
      <div className="text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-muted">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
        <h1 className="mt-5 font-heading text-2xl font-semibold text-foreground">Verificando seu e-mail</h1>
        <p className="mt-2 text-sm text-muted-foreground">Isso leva só um instante…</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-destructive/15">
          <AlertTriangle className="size-6 text-destructive" />
        </div>
        <h1 className="mt-5 font-heading text-2xl font-semibold text-foreground">Não foi possível verificar</h1>
        <p className="mt-2 text-sm text-muted-foreground">{errorMessage}</p>
        <button
          onClick={handleResend}
          className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <MailWarning className="size-3.5" />
          Reenviar e-mail de verificação
        </button>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-success/15">
        <CheckCircle2 className="size-6 text-success" />
      </div>
      <h1 className="mt-5 font-heading text-2xl font-semibold text-foreground">E-mail verificado</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Seu e-mail foi confirmado. Você já pode começar a comprar.
      </p>
      <Button size="lg" className="mt-6 w-full" render={<Link href="/account" />}>
        Ir para minha conta
      </Button>
    </div>
  );
}
