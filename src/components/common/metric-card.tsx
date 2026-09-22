import type { LucideIcon } from "lucide-react";
import { AnimatedCounter } from "@/components/common/animated-counter";
import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  prefix,
  suffix,
  decimals,
  icon: Icon,
  trend,
  className,
}: {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  icon?: LucideIcon;
  trend?: { value: number; positive: boolean };
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col justify-between rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-xs", className)}>
      <div className="flex items-center justify-between gap-1">
        <p className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">{label}</p>
        {Icon && <Icon className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.5} />}
      </div>
      <div className="my-2">
        <p className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-2xl">
          <AnimatedCounter value={value} prefix={prefix} suffix={suffix} decimals={decimals} />
        </p>
      </div>
      <div>
        {trend ? (
          <p className={cn("text-xs font-semibold", trend.positive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
            {trend.positive ? "+" : ""}
            {trend.value}% vs last month
          </p>
        ) : (
          <p className="text-xs font-medium text-muted-foreground/80">Active total</p>
        )}
      </div>
    </div>
  );
}
