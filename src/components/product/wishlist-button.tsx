"use client";

import { Heart } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { useWishlistStore } from "@/store/wishlist-store";
import { cn } from "@/lib/utils";

export function WishlistButton({
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
  const isWishlisted = useWishlistStore((s) => s.productIds.includes(productId));
  const toggle = useWishlistStore((s) => s.toggle);

  return (
    <button
      type="button"
      aria-pressed={isWishlisted}
      aria-label={isWishlisted ? `Remove ${productName} from wishlist` : `Add ${productName} to wishlist`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(productId);
        toast(isWishlisted ? "Removed from wishlist" : "Added to wishlist", {
          description: productName,
        });
      }}
      className={cn(
        "group/wish flex size-9 items-center justify-center rounded-full transition-colors duration-200",
        variant === "floating"
          ? "bg-background/90 shadow-sm ring-1 ring-border backdrop-blur-sm hover:bg-background"
          : "bg-secondary hover:bg-secondary/80",
        className
      )}
    >
      <motion.span
        key={isWishlisted ? "on" : "off"}
        initial={{ scale: 0.6, opacity: 0.6 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
      >
        <Heart
          className={cn(
            "size-4 transition-colors",
            isWishlisted ? "fill-accent text-accent" : "text-foreground"
          )}
          strokeWidth={1.75}
        />
      </motion.span>
    </button>
  );
}
