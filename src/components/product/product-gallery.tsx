"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { ZoomIn } from "lucide-react";
import type { ImageRef } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ProductGallery({ images }: { images: ImageRef[] }) {
  const [active, setActive] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");

  const current = images[active] ?? images[0];

  return (
    <div className="flex flex-col gap-3 sm:flex-row-reverse">
      <div className="flex-1">
        <div
          className="group relative aspect-[4/5] cursor-zoom-in overflow-hidden rounded-2xl bg-muted"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            setOrigin(`${x}% ${y}%`);
          }}
          onMouseEnter={() => setIsZoomed(true)}
          onMouseLeave={() => setIsZoomed(false)}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0"
            >
              {current && (
                <Image
                  src={current.url}
                  alt={current.alt}
                  fill
                  priority
                  sizes="(min-width: 1024px) 45vw, 100vw"
                  className="object-cover transition-transform duration-300 ease-out"
                  style={{
                    transform: isZoomed ? "scale(1.6)" : "scale(1)",
                    transformOrigin: origin,
                  }}
                />
              )}
            </motion.div>
          </AnimatePresence>
          <div className="pointer-events-none absolute right-3 bottom-3 flex items-center gap-1.5 rounded-full bg-background/85 px-2.5 py-1.5 text-xs text-muted-foreground opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
            <ZoomIn className="size-3.5" /> Hover to zoom
          </div>
        </div>
      </div>

      {images.length > 1 && (
        <div className="flex gap-2.5 overflow-x-auto sm:w-20 sm:flex-col sm:overflow-visible">
          {images.map((img, i) => (
            <button
              key={img.url + i}
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1}`}
              aria-current={active === i}
              className={cn(
                "relative aspect-[4/5] w-16 shrink-0 overflow-hidden rounded-lg bg-muted ring-1 transition-all sm:w-full",
                active === i ? "ring-2 ring-foreground" : "ring-border hover:ring-foreground/40"
              )}
            >
              <Image src={img.url} alt={img.alt} fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
