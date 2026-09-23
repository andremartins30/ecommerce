"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { verifyMfaChallenge } from "@/server/services/auth/mfa-actions";

export function MfaChallengeForm() {
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      const result = await verifyMfaChallenge({ code });
      if (!result.success) {
        setFormError(result.formError ?? "Código incorreto.");
        return;
      }
      // Hard navigation: same reasoning as mfa-setup-form.tsx — /admin may
      // have been prefetched by the client router cache before mfaSatisfied
      // was set, and a soft push/refresh can still serve that stale response.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/admin");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="font-heading text-xl font-semibold text-foreground">Verificação em duas etapas</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        {useRecoveryCode
          ? "Informe um dos seus códigos de recuperação."
          : "Informe o código gerado pelo seu aplicativo autenticador."}
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="code">{useRecoveryCode ? "Código de recuperação" : "Código de 6 dígitos"}</Label>
          <Input
            id="code"
            inputMode={useRecoveryCode ? "text" : "numeric"}
            autoComplete="one-time-code"
            placeholder={useRecoveryCode ? "XXXX-XXXX" : "000000"}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={useRecoveryCode ? 9 : 6}
          />
        </div>
        {formError && <p className="text-sm text-destructive">{formError}</p>}
        <Button type="submit" size="lg" className="w-full gap-2" disabled={submitting || code.length === 0}>
          {submitting && <Loader2 className="size-4 animate-spin" />}
          {submitting ? "Verificando…" : "Verificar"}
        </Button>
      </form>

      <button
        type="button"
        onClick={() => {
          setUseRecoveryCode((v) => !v);
          setCode("");
          setFormError(null);
        }}
        className="mt-4 text-sm font-medium text-accent hover:underline"
      >
        {useRecoveryCode ? "Usar código do aplicativo" : "Usar código de recuperação"}
      </button>
    </div>
  );
}
