import Link from "next/link";
import { categories } from "@/lib/data/categories";
import { NewsletterForm } from "@/components/home/newsletter-form";

const SHOP_LINKS = [
  { label: "All Products", href: "/shop" },
  { label: "New Arrivals", href: "/shop?collection=new-arrivals" },
  { label: "Best Sellers", href: "/shop?collection=best-sellers" },
  { label: "Sale", href: "/shop?collection=sale" },
];

const HELP_LINKS = [
  { label: "Contact Us", href: "/account" },
  { label: "Shipping & Returns", href: "/account" },
  { label: "FAQ", href: "/account" },
  { label: "Track Order", href: "/account/orders" },
];

const COMPANY_LINKS = [
  { label: "About", href: "/" },
  { label: "Journal", href: "/" },
  { label: "Careers", href: "/" },
  { label: "Sustainability", href: "/" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-secondary/40">
      <div className="container-page py-14 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-[#0B1A30] text-white shadow-xs">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                  <path d="M3 6h18" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="font-heading text-lg font-extrabold tracking-[0.08em] text-[#0B1A30] uppercase">
                  Nebula
                </span>
                <span className="text-[10px] font-medium tracking-tight text-slate-500">
                  Live Better. Every Day.
                </span>
              </div>
            </Link>
            <p className="mt-3.5 max-w-xs text-xs leading-relaxed text-slate-500">
              Your destination for elevated essentials across fashion, electronics, home decor, and lifestyle gear.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2 sm:gap-3">
              {["Instagram", "Twitter", "Pinterest", "YouTube"].map((label) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="flex h-8 items-center justify-center rounded-full border border-slate-200 bg-white px-3 text-[11px] font-medium text-slate-700 transition-colors hover:border-[#0B1A30] hover:text-[#0B1A30]"
                >
                  {label}
                </a>
              ))}
            </div>
          </div>

          <FooterColumn title="Shop" links={SHOP_LINKS} />
          <FooterColumn
            title="Categories"
            links={categories.slice(0, 4).map((c) => ({ label: c.name, href: `/categories/${c.slug}` }))}
          />
          <FooterColumn title="Help & Support" links={HELP_LINKS} />
          <FooterColumn title="Company" links={COMPANY_LINKS} />
        </div>

        <div className="mt-10 sm:mt-14 rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-8 shadow-xs">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-md">
              <h3 className="font-heading text-base sm:text-lg font-bold text-slate-900">
                Join the Nebula Member Circle
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Receive weekly curated drops, members-only pricing, and 15% off your first purchase.
              </p>
            </div>
            <NewsletterForm />
          </div>
        </div>

        <div className="mt-8 sm:mt-10 flex flex-col items-center justify-between gap-3 sm:gap-4 border-t border-slate-200 pt-6 text-xs text-slate-500 sm:flex-row text-center sm:text-left">
          <p>© {new Date().getFullYear()} NEBULA Retail Inc. All rights reserved.</p>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-5">
            <Link href="/" className="hover:text-foreground">
              Privacy Policy
            </Link>
            <Link href="/" className="hover:text-foreground">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h4 className="text-xs font-semibold tracking-wide text-foreground uppercase">{title}</h4>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.label}>
            <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
