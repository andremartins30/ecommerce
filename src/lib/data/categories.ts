import type { LegacyCategory } from "@/lib/types";
import { NEBULA_ASSETS } from "./images";

/** @deprecated Mock catalogue category. Real categories live in the database
 *  (src/server/services/catalog). Migrated when the admin category manager
 *  moves off Zustand (task 14). */
export const categories: LegacyCategory[] = [
  {
    id: "cat-fashion",
    slug: "fashion",
    name: "Fashion",
    description: "Curated apparel, luxury bags, and elevated style essentials.",
    image: NEBULA_ASSETS.categories.fashion,
    productCount: 142,
  },
  {
    id: "cat-beauty",
    slug: "beauty",
    name: "Beauty",
    description: "Skincare essentials, clean cosmetics, and beauty rituals.",
    image: NEBULA_ASSETS.categories.beauty,
    productCount: 86,
  },
  {
    id: "cat-electronics",
    slug: "electronics",
    name: "Electronics",
    description: "Premium audio, wireless gear, and high-fidelity devices.",
    image: NEBULA_ASSETS.categories.electronics,
    productCount: 94,
  },
  {
    id: "cat-home",
    slug: "home-living",
    name: "Home & Living",
    description: "Designer furniture, statement lighting, and serene decor.",
    image: NEBULA_ASSETS.categories.home,
    productCount: 118,
  },
  {
    id: "cat-sports",
    slug: "sports",
    name: "Sports",
    description: "High-performance footwear, activewear, and fitness essentials.",
    image: NEBULA_ASSETS.categories.sports,
    productCount: 65,
  },
  {
    id: "cat-toys",
    slug: "toys-games",
    name: "Toys & Games",
    description: "Premium collectibles, plush companions, and creative play.",
    image: NEBULA_ASSETS.categories.toys,
    productCount: 42,
  },
  {
    id: "cat-automotive",
    slug: "automotive",
    name: "Automotive",
    description: "Performance parts, forged alloy accessories, and car care.",
    image: NEBULA_ASSETS.categories.automotive,
    productCount: 38,
  },
  {
    id: "cat-books",
    slug: "books",
    name: "Books",
    description: "Art monographs, design compendiums, and bestselling reads.",
    image: NEBULA_ASSETS.categories.books,
    productCount: 57,
  },
];

export const CATEGORY_NAMES: Record<string, string> = {
  "cat-fashion": "Fashion",
  "cat-apparel": "Apparel & Fashion",
  "cat-footwear": "Footwear",
  "cat-bags": "Bags & Leather",
  "cat-watches": "Watches & Jewelry",
  "cat-eyewear": "Eyewear",
  "cat-tech": "Tech & Audio",
  "cat-electronics": "Electronics",
  "cat-fragrance": "Fragrance & Grooming",
  "cat-beauty": "Beauty",
  "cat-home": "Home & Living",
  "cat-sports": "Sports",
  "cat-toys": "Toys & Games",
  "cat-automotive": "Automotive",
  "cat-books": "Books",
};

export function getCategoryName(id: string): string {
  return (
    CATEGORY_NAMES[id] ??
    categories.find((c) => c.id === id)?.name ??
    id.replace(/^cat-/, "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

export function getCategoryBySlug(slug: string) {
  return categories.find((c) => c.slug === slug);
}

export function getCategoryById(id: string) {
  return categories.find((c) => c.id === id);
}
