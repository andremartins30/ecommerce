"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = 99,
  size = "md",
  className,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md";
  className?: string;
}) {
  const isSmall = size === "sm";

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-lg border border-border",
        isSmall ? "h-8" : "h-11",
        className
      )}
    >
      <button
        type="button"
        aria-label="Decrease quantity"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className={cn(
          "flex h-full items-center justify-center text-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-30",
          isSmall ? "w-8" : "w-10"
        )}
      >
        <Minus className={isSmall ? "size-3" : "size-3.5"} />
      </button>
      <span
        className={cn(
          "flex h-full flex-1 items-center justify-center text-sm font-medium tabular-nums text-foreground",
          isSmall ? "w-8" : "w-10"
        )}
        aria-live="polite"
      >
        {value}
      </span>
      <button
        type="button"
        aria-label="Increase quantity"
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className={cn(
          "flex h-full items-center justify-center text-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-30",
          isSmall ? "w-8" : "w-10"
        )}
      >
        <Plus className={isSmall ? "size-3" : "size-3.5"} />
      </button>
    </div>
  );
}
