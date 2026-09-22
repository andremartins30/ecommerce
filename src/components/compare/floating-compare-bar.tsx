"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeftRight, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCompareStore, useCompareCount } from "@/store/compare-store";
import { useHydrated } from "@/hooks/use-hydrated";
import { products, trendingProducts } from "@/lib/data/products";

const allProducts = [...trendingProducts, ...products.filter(p => !trendingProducts.some(t => t.id === p.id))];

export function FloatingCompareBar() {
  const productIds = useCompareStore((s) => s.productIds);
  const remove = useCompareStore((s) => s.remove);
  const clear = useCompareStore((s) => s.clear);
  const count = useCompareCount();
  const hydrated = useHydrated();
  const pathname = usePathname();

  if (!hydrated || count === 0 || pathname === "/compare") {
    return null;
  }

  const items = allProducts.filter((p) => productIds.includes(p.id));

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        className="fixed bottom-6 inset-x-0 z-40 mx-auto w-[92%] max-w-xl"
      >
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-700/60 bg-[#0B1A30]/95 p-3 text-white shadow-2xl backdrop-blur-md">
          {/* Left: Mini Thumbnails */}
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2 overflow-hidden pl-1">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="group relative size-10 shrink-0 overflow-hidden rounded-full border-2 border-[#0B1A30] bg-white shadow-xs"
                >
                  <Image
                    src={item.images[0]?.url}
                    alt={item.name}
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => remove(item.id, item.name)}
                    aria-label={`Remove ${item.name}`}
                    className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <X className="size-3.5 text-white" />
                  </button>
                </div>
              ))}
            </div>

            <div className="hidden sm:flex flex-col pl-2">
              <span className="text-xs font-bold leading-tight">Compare Items</span>
              <span className="text-[10px] text-slate-300">{count} of 4 selected</span>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={clear}
              className="px-2.5 py-1.5 text-xs text-slate-300 hover:text-white transition-colors"
            >
              Clear
            </button>
            <Link
              href="/compare"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-white px-4 text-xs font-bold text-[#0B1A30] shadow-sm transition-all hover:bg-slate-100 active:scale-95"
            >
              <ArrowLeftRight className="size-3.5" />
              <span>Compare ({count})</span>
            </Link>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
