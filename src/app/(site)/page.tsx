import { Hero } from "@/components/home/hero";
import { FeaturedCategories } from "@/components/home/featured-categories";
import { TrendingGrid } from "@/components/home/trending-grid";
import { FeaturedCollections } from "@/components/home/featured-collections";
import { TrustSection } from "@/components/home/trust-section";

// TODO(task 32): CMS-driven hero, banners and curated sections replace this
// minimal composition once content editing exists.
export default function HomePage() {
  return (
    <div className="bg-background pb-0">
      <Hero />
      <FeaturedCategories />
      <TrendingGrid />
      <FeaturedCollections />
      <TrustSection />
    </div>
  );
}
