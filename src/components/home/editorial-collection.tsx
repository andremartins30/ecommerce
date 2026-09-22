import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HERO_IMAGES } from "@/lib/data/images";
import { Reveal } from "@/components/common/reveal";

export function EditorialCollection() {
  return (
    <section className="container-page py-16 sm:py-24">
      <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
        <Reveal className="relative aspect-[4/5] overflow-hidden rounded-2xl lg:order-2">
          <Image
            src={HERO_IMAGES.editorial}
            alt="ARKIVE Field Edit, outerwear layered for cold weather"
            fill
            sizes="(min-width: 1024px) 45vw, 100vw"
            className="object-cover"
          />
        </Reveal>
        <Reveal delay={0.1} className="lg:order-1">
          <h2 className="font-heading text-3xl leading-tight font-semibold tracking-tight text-balance text-foreground sm:text-4xl">
            The Field Edit: outerwear built for the in-between seasons.
          </h2>
          <p className="mt-4 max-w-md text-base text-muted-foreground">
            Waxed cotton, brushed wool, and technical shells, layered for the morning commute and
            built to hold up outdoors.
          </p>
          <Link
            href="/the-field-edit"
            className="mt-7 inline-flex items-center gap-2 border-b border-foreground pb-1 text-sm font-medium text-foreground"
          >
            Explore the Edit
            <ArrowRight className="size-4" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
