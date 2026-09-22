import type { LegacyReview as Review } from "@/lib/types";
import { avatar } from "./images";
import { products } from "./products";
import { daysAgo, pick, randInt, seededRandom } from "./seed";

const reviewerNames = [
  "Grace T.",
  "Daniel R.",
  "Maya S.",
  "Owen P.",
  "Harper L.",
  "Felix M.",
  "Ruby C.",
  "Simon K.",
  "Ana B.",
  "Leo W.",
  "Nina F.",
  "Jasper H.",
  "Cleo D.",
  "Milo A.",
  "Ivy G.",
];

const positiveTitles = [
  "Exactly as described",
  "Worth every penny",
  "New everyday favorite",
  "Better than expected",
  "Great craftsmanship",
  "Fits perfectly",
  "Holding up beautifully",
];

const positiveBodies = [
  "The quality is obvious the second you take it out of the box. Fit runs true to size and the material feels like it'll last for years.",
  "I was on the fence about the price but after a month of daily use I'm completely sold. Would buy again in another colorway.",
  "Shipping was fast and the packaging alone felt premium. The product itself has only gotten better with a bit of use.",
  "This has quietly become the piece I reach for most. Understated but clearly well made — exactly what I wanted.",
  "Ordered based on the photos and it looks even better in person. Customer service was also great when I had a sizing question.",
];

const mixedTitles = ["Good, with one caveat", "Solid but runs small", "Nice quality, slow shipping"];
const mixedBodies = [
  "The materials and construction are great, but I'd size up if you're between sizes — it runs a little snug.",
  "Really happy with the look and feel. Shipping took a few days longer than expected, otherwise five stars.",
  "Does exactly what it says. Not groundbreaking, but a dependable, well-made piece I'll get a lot of use out of.",
];

export const reviews: Review[] = Array.from({ length: 15 }, (_, index) => {
  const rng = seededRandom(`review-${index}`);
  const product = pick(rng, products);
  const isPositive = rng() > 0.25;
  const rating = isPositive ? randInt(rng, 4, 5) : randInt(rng, 3, 4);

  return {
    id: `rev-${String(index + 1).padStart(3, "0")}`,
    productId: product.id,
    customerName: pick(rng, reviewerNames),
    customerAvatar: avatar(index + 3),
    rating,
    title: isPositive ? pick(rng, positiveTitles) : pick(rng, mixedTitles),
    content: isPositive ? pick(rng, positiveBodies) : pick(rng, mixedBodies),
    createdAt: daysAgo(randInt(rng, 2, 260)),
    status: index === 13 ? "pending" : index === 14 ? "rejected" : "approved",
    verified: rng() > 0.15,
    helpfulCount: randInt(rng, 0, 48),
  };
});

export function getReviewsByProduct(productId: string) {
  return reviews.filter((r) => r.productId === productId && r.status === "approved");
}
