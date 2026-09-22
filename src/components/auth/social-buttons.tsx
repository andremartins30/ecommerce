"use client";

import { toast } from "sonner";

export function SocialButtons() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {["Google", "Apple"].map((provider) => (
        <button
          key={provider}
          type="button"
          onClick={() =>
            toast.info(`${provider} sign-in isn't wired up in this demo`, {
              description: "Use the form below instead.",
            })
          }
          className="flex h-11 items-center justify-center rounded-lg border border-border text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          {provider}
        </button>
      ))}
    </div>
  );
}
