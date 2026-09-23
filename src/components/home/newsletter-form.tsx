"use client";

import { useState } from "react";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * Newsletter signup — still a client-side mock (setTimeout, no real
 * subscription backend). That's out of scope for Task 19 (store branding);
 * this only fixes the hardcoded "NEBULA" in the success toast.
 */
export function NewsletterForm({ className, storeName }: { className?: string; storeName?: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Informe um e-mail válido");
      return;
    }
    setError("");
    setStatus("loading");
    setTimeout(() => {
      setStatus("success");
      toast.success("Inscrição confirmada", { description: `Bem-vindo(a) à ${storeName ?? "nossa loja"}.` });
    }, 900);
  }

  if (status === "success") {
    return (
      <div className={cn("flex items-center gap-2 text-sm font-medium text-emerald-600", className)}>
        <Check className="size-4" />
        Obrigado — confira seu e-mail para confirmar.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={cn("w-full sm:w-auto", className)} noValidate>
      <div className="flex w-full flex-col sm:flex-row items-stretch gap-2 sm:w-80">
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError("");
          }}
          placeholder="Seu e-mail"
          aria-label="E-mail"
          aria-invalid={!!error}
          className={cn(
            "h-10 sm:h-11 flex-1 rounded-lg border border-slate-200 bg-slate-50/70 px-3.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#0B1A30] focus:bg-white focus:outline-hidden",
            error && "border-rose-500"
          )}
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="flex h-10 sm:h-11 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[#0B1A30] px-4 text-xs sm:text-sm font-bold text-white transition-colors hover:bg-[#132847] disabled:opacity-60"
        >
          {status === "loading" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <>
              Inscrever-se <ArrowRight className="size-4" />
            </>
          )}
        </button>
      </div>
      {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
    </form>
  );
}
