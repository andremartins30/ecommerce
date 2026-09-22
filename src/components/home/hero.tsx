import Link from "next/link";

/**
 * Placeholder hero for the perfumery storefront.
 *
 * Deliberately minimal — no stock photography, no fabricated slogans, no
 * banner CMS yet. A curated hero with real product photography and editable
 * banners is task 32 (CMS); putting a generic "lifestyle" banner here in the
 * meantime would be exactly the kind of filler the specification asks to
 * avoid (§92, "seções sem objetivo comercial").
 */
export function Hero() {
  return (
    <section className="container-page py-10 sm:py-16">
      <div className="max-w-xl">
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Perfumaria
        </h1>
        <p className="mt-3 text-muted-foreground">
          Contratipos, importados e perfumes de nicho. Pronta entrega e produção sob encomenda,
          sempre com o prazo informado antes da compra.
        </p>
        <Link
          href="/shop"
          className="mt-6 inline-flex h-11 items-center rounded-lg bg-foreground px-6 text-sm font-medium text-background transition-colors hover:bg-foreground/85"
        >
          Ver catálogo
        </Link>
      </div>
    </section>
  );
}
