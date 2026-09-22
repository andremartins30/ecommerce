"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

const MESSAGES = [
  "FREE SHIPPING ON ORDERS OVER $100",
  "NEW SEASON ARRIVALS — SHOP THE EDIT",
  "15% OFF YOUR FIRST ORDER WITH CODE WELCOME15",
];

export function AnnouncementBar() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % MESSAGES.length), 4500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative flex h-9 items-center justify-center overflow-hidden bg-primary px-4 text-primary-foreground">
      <AnimatePresence mode="wait">
        <motion.p
          key={index}
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -12, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="text-center text-[11px] font-medium tracking-[0.12em] whitespace-nowrap"
        >
          {MESSAGES[index]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
