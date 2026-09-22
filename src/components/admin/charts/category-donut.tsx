"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatPrice } from "@/lib/format";

const COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
  "var(--color-accent)",
  "var(--color-muted-foreground)",
  "var(--color-border)",
];

export function CategoryDonut({ data }: { data: { name: string; value: number }[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative mx-auto flex h-44 w-full items-center justify-center">
        <ResponsiveContainer width="100%" height={176}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={48}
              outerRadius={70}
              paddingAngle={3}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="var(--color-card)" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "var(--color-popover)",
                border: "1px solid var(--color-border)",
                borderRadius: 10,
                fontSize: 12,
              }}
              formatter={(value, name) => [formatPrice(Number(value)), String(name)]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">Total</span>
          <span className="font-heading text-sm font-extrabold text-foreground">{formatPrice(total)}</span>
        </div>
      </div>

      <ul className="divide-y divide-border/50 text-xs">
        {data.map((entry, i) => {
          const percent = total > 0 ? Math.round((entry.value / total) * 100) : 0;
          return (
            <li key={entry.name} className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
              <span className="flex items-center gap-2 text-foreground">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                />
                <span className="font-medium">{entry.name}</span>
                <span className="text-[10px] text-muted-foreground">({percent}%)</span>
              </span>
              <span className="font-bold text-foreground tabular-nums">
                {formatPrice(entry.value)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
