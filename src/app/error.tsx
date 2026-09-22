"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertOctagon, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-20 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
        <AlertOctagon className="size-7 text-destructive" strokeWidth={1.5} />
      </div>
      <h1 className="mt-6 font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        Something went wrong
      </h1>
      <p className="mt-3 max-w-sm text-sm text-muted-foreground">
        An unexpected error occurred. Please try again, or head back to the homepage.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button onClick={reset} className="gap-1.5">
          <RefreshCcw className="size-4" /> Try Again
        </Button>
        <Button variant="outline" render={<Link href="/" />}>
          Back to Home
        </Button>
      </div>
    </div>
  );
}
