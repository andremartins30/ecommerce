"use client";

import { ArrowLeftRight } from "lucide-react";
import { motion } from "motion/react";
import { useCompareStore } from "@/store/compare-store";
import { cn } from "@/lib/utils";

export function CompareButton({
  productId,
  productName,
  className,
  variant = "floating",
}: {
  productId: string;
  productName: string;
  className?: string;
  variant?: "floating" | "solid";
}) {
  const isCompared = useCompareStore((s) => s.productIds.includes(productId));
  const toggle = useCompareStore((s) => s.toggle);

  return (
    <button
      type="button"
      aria-pressed={isCompared}
      aria-label={isCompared ? `Remove ${productName} from comparison` : `Compare ${productName}`}
      title={isCompared ? "Remove from compare" : "Add to compare"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(productId, productName);
      }}
      className={cn(
        "group/cmp flex size-8.5 sm:size-9 items-center justify-center rounded-full transition-all duration-200 active:scale-95",
        variant === "floating"
          ? isCompared
            ? "bg-[#0B1A30] text-white shadow-sm ring-1 ring-[#0B1A30]"
            : "bg-white/95 text-slate-700 shadow-xs ring-1 ring-black/10 backdrop-blur-xs hover:bg-white hover:text-black"
          : isCompared
            ? "bg-[#0B1A30] text-white"
            : "bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-black",
        className
      )}
    >
      <motion.span
        key={isCompared ? "on" : "off"}
        initial={{ scale: 0.7, opacity: 0.6 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
      >
        <ArrowLeftRight className="size-3.75 sm:size-4" strokeWidth={isCompared ? 2.2 : 1.75} />
      </motion.span>
    </button>
  );
}
