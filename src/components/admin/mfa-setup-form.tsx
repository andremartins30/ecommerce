"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Loader2, ShieldCheck, Copy, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { startMfaEnrollment, confirmMfaEnrollment, type MfaEnrollmentStart } from "@/server/services/auth/mfa-actions";

/**
 * Two-step enrollment UI:
 * 1. Fetch a secret + QR code from the server (nothing persisted yet).
 * 2. Submit the 6-digit code the user's app produced — only on success does
 *    the server persist the secret, and only then do we show recovery codes.
 */
export function MfaSetupForm({ email }: { email: string }) {
  const [enrollment, setEnrollment] = useState<MfaEnrollmentStart | null>(null);
  const [loadingSecret, setLoadingSecret] = useState(true);
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    startMfaEnrollment()
      .then((result) => {
        if (!cancelled) setEnrollment(result);
      })
      .catch(() => {
        if (!cancelled) setFormError("Não foi possível gerar o código de configuração. Recarregue a página.");
      })
      .finally(() => {
        if (!cancelled) setLoadingSecret(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!enrollment) return;
    setSubmitting(true);
    setFormError(null);
    try {
      const result = await confirmMfaEnrollment(enrollment.secret, { code });
      if (!result.success) {
        setFormError(result.formError ?? "Não foi possível confirmar o código.");
        return;
      }
      setRecoveryCodes(result.recoveryCodes ?? []);
    } finally {
      setSubmitting(false);
    }
  }

  function copyRecoveryCodes() {
    if (!recoveryCodes) return;
    navigator.clipboard.writeText(recoveryCodes.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (recoveryCodes) {
    return (
      <div>
        <div className="flex items-center gap-2 text-emerald-600">
          <ShieldCheck className="size-5" />
          <h1 className="font-heading text-xl font-semibold text-foreground">Autenticação em duas etapas ativada</h1>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Guarde estes códigos de recuperação em um lugar seguro. Cada um pode ser usado uma única vez para entrar
          caso você perca acesso ao seu aplicativo autenticador.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg border border-border bg-muted/40 p-4 font-mono text-sm">
          {recoveryCodes.map((code) => (
            <span key={code}>{code}</span>
          ))}
        </div>
        <Button type="button" variant="outline" className="mt-3 w-full gap-2" onClick={copyRecoveryCodes}>
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? "Copiado" : "Copiar códigos"}
        </Button>
        <Button
          type="button"
          className="mt-3 w-full"
          onClick={() => {
            // A hard navigation, not router.push, is intentional here: the
            // client router cache may have prefetched /admin before MFA was
            // satisfied (proxy.ts would have bounced that prefetch to
            // /admin/mfa/setup), and a soft push can serve that stale cached
            // response instead of asking proxy.ts to re-check the
            // now-satisfied session.
            // eslint-disable-next-line @next/next/no-location-assign-relative-destination
            window.location.assign("/admin");
          }}
        >
          Continuar para o painel
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-heading text-xl font-semibold text-foreground">Configurar autenticação em duas etapas</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Obrigatório para contas de administrador. Escaneie o código abaixo com seu aplicativo autenticador (Google
        Authenticator, Authy, 1Password, etc.).
      </p>

      {loadingSecret && (
        <div className="mt-6 flex items-center justify-center py-10">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {enrollment && (
        <>
          <div className="mt-6 flex flex-col items-center gap-3 rounded-lg border border-border bg-white p-4">
            <Image src={enrollment.qrCodeDataUrl} alt="Código QR para configurar MFA" width={200} height={200} unoptimized />
            <p className="text-center text-xs text-muted-foreground">
              Não consegue escanear? Insira manualmente: <br />
              <span className="font-mono font-medium text-foreground">{enrollment.secret}</span>
            </p>
          </div>

          <form onSubmit={onSubmit} className="mt-5 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="code">Código de 6 dígitos ({email})</Label>
              <Input
                id="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={6}
              />
            </div>
            {formError && <p className="text-sm text-destructive">{formError}</p>}
            <Button type="submit" size="lg" className="w-full gap-2" disabled={submitting || code.length !== 6}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {submitting ? "Confirmando…" : "Confirmar e ativar"}
            </Button>
          </form>
        </>
      )}
    </div>
  );
}
