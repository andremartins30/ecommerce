"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, MailWarning } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function VerifyEmail() {
  const [status, setStatus] = useState<"verifying" | "success">("verifying");

  useEffect(() => {
    const id = setTimeout(() => setStatus("success"), 1600);
    return () => clearTimeout(id);
  }, []);

  if (status === "verifying") {
    return (
      <div className="text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-muted">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
        <h1 className="mt-5 font-heading text-2xl font-semibold text-foreground">Verifying your email</h1>
        <p className="mt-2 text-sm text-muted-foreground">This will just take a moment…</p>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-success/15">
        <CheckCircle2 className="size-6 text-success" />
      </div>
      <h1 className="mt-5 font-heading text-2xl font-semibold text-foreground">Email verified</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Your email has been confirmed. You&apos;re all set to start shopping.
      </p>
      <Button size="lg" className="mt-6 w-full" render={<Link href="/account" />}>
        Continue to Account
      </Button>
      <button
        onClick={() =>
          toast.info("Verification email resent", { description: "Check your inbox in a few minutes." })
        }
        className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        <MailWarning className="size-3.5" />
        Didn&apos;t get an email? Resend
      </button>
    </div>
  );
}
