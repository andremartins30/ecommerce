import Image from "next/image";
import { reviews } from "@/lib/data/reviews";
import { Rating } from "@/components/common/rating";
import { Reveal } from "@/components/common/reveal";

export function TestimonialSpotlight() {
  const featured = reviews
    .filter((r) => r.status === "approved" && r.rating >= 4 && r.verified)
    .sort((a, b) => b.helpfulCount - a.helpfulCount)[0];

  if (!featured) return null;

  return (
    <section className="border-y border-border bg-secondary/40">
      <div className="container-page py-20 sm:py-28">
        <Reveal className="mx-auto flex max-w-2xl flex-col items-center text-center">
          <Rating value={featured.rating} size="md" />
          <p className="mt-6 font-heading text-2xl leading-snug text-balance text-foreground sm:text-3xl">
            &ldquo;{featured.content}&rdquo;
          </p>
          <div className="mt-7 flex items-center gap-3">
            {featured.customerAvatar && (
              <div className="relative size-11 overflow-hidden rounded-full bg-muted">
                <Image src={featured.customerAvatar} alt={featured.customerName} fill className="object-cover" />
              </div>
            )}
            <span className="text-sm font-medium text-foreground">
              {featured.customerName}, verified buyer
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
