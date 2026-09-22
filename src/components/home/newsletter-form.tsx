"use client";

import { useState } from "react";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function NewsletterForm({ className }: { className?: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email address");
      return;
    }
    setError("");
    setStatus("loading");
    setTimeout(() => {
      setStatus("success");
      toast.success("You're on the list", { description: "Welcome to NEBULA." });
    }, 900);
  }

  if (status === "success") {
    return (
      <div className={cn("flex items-center gap-2 text-sm font-medium text-emerald-600", className)}>
        <Check className="size-4" />
        Thanks — check your inbox to confirm.
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
          placeholder="Your email address"
          aria-label="Email address"
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
              Subscribe <ArrowRight className="size-4" />
            </>
          )}
        </button>
      </div>
      {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
    </form>
  );
}
