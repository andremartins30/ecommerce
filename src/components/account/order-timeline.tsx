"use client";

import { motion } from "motion/react";
import { Check } from "lucide-react";
import type { LegacyOrderTimelineEvent as OrderTimelineEvent } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export function OrderTimeline({
  timeline,
  cancelled,
}: {
  timeline: OrderTimelineEvent[];
  cancelled?: boolean;
}) {
  if (cancelled) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        This order was cancelled and is no longer being processed.
      </div>
    );
  }

  const doneCount = timeline.filter((t) => t.done).length;
  const percent = ((doneCount - 1) / (timeline.length - 1)) * 100;

  return (
    <div className="relative pt-2 pb-4">
      <div className="absolute top-[13px] right-0 left-0 h-0.5 bg-border sm:top-4">
        <motion.div
          className="h-full bg-foreground"
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(0, percent)}%` }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
      <div className="relative flex justify-between">
        {timeline.map((event) => (
          <div key={event.label} className="flex flex-col items-center gap-2 text-center">
            <span
              className={cn(
                "flex size-7 items-center justify-center rounded-full border-2 bg-background text-xs font-medium sm:size-8",
                event.done ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground"
              )}
            >
              {event.done ? <Check className="size-3.5" /> : ""}
            </span>
            <div>
              <p className={cn("text-xs font-medium", event.done ? "text-foreground" : "text-muted-foreground")}>
                {event.label}
              </p>
              {event.date && (
                <p className="text-[11px] text-muted-foreground">{formatDate(event.date)}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
