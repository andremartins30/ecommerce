import Image from "next/image";
import Link from "next/link";
import { categories } from "@/lib/data/categories";
import { NewsletterForm } from "@/components/home/newsletter-form";

const SHOP_LINKS = [
  { label: "Todos os perfumes", href: "/shop" },
  { label: "Lançamentos", href: "/shop?collection=new-arrivals" },
  { label: "Mais vendidos", href: "/shop?collection=best-sellers" },
  { label: "Promoções", href: "/shop?collection=sale" },
];

const HELP_LINKS = [
  { label: "Contato", href: "/account" },
  { label: "Envio e trocas", href: "/account" },
  { label: "Perguntas frequentes", href: "/account" },
  { label: "Rastrear pedido", href: "/account/orders" },
];

const COMPANY_LINKS = [
  { label: "Sobre nós", href: "/" },
  { label: "Blog", href: "/" },
  { label: "Trabalhe conosco", href: "/" },
];

export function SiteFooter({
  storeName,
  logoUrl,
  email,
  phone,
}: {
  storeName: string;
  logoUrl: string;
  email?: string;
  phone?: string;
}) {
  return (
    <footer className="border-t border-border bg-secondary/40">
      <div className="container-page py-14 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center">
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt={storeName}
                  width={150}
                  height={40}
                  className="h-9 w-auto object-contain"
                  unoptimized
                />
              ) : (
                <span className="font-heading text-lg font-extrabold tracking-[0.08em] text-[#0B1A30] uppercase">
                  {storeName}
                </span>
              )}
            </Link>
            <p className="mt-3.5 max-w-xs text-xs leading-relaxed text-slate-500">
              Perfumaria artesanal brasileira: contratipos e fragrâncias importadas, com disponibilidade real de
              estoque e prazos de produção transparentes.
            </p>
            {(email || phone) && (
              <div className="mt-5 space-y-1 text-xs text-slate-500">
                {email && <p>{email}</p>}
                {phone && <p>{phone}</p>}
              </div>
            )}
            <div className="mt-5 flex flex-wrap items-center gap-2 sm:gap-3">
              {["Instagram", "WhatsApp"].map((label) => (
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

          <FooterColumn title="Loja" links={SHOP_LINKS} />
          <FooterColumn
            title="Categorias"
            links={categories.slice(0, 4).map((c) => ({ label: c.name, href: `/categorias/${c.slug}` }))}
          />
          <FooterColumn title="Ajuda" links={HELP_LINKS} />
          <FooterColumn title="Empresa" links={COMPANY_LINKS} />
        </div>

        <div className="mt-10 sm:mt-14 rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-8 shadow-xs">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-md">
              <h3 className="font-heading text-base sm:text-lg font-bold text-slate-900">
                Receba novidades da {storeName}
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Lançamentos, dicas de fragrâncias e 15% de desconto na sua primeira compra.
              </p>
            </div>
            <NewsletterForm storeName={storeName} />
          </div>
        </div>

        <div className="mt-8 sm:mt-10 flex flex-col items-center justify-between gap-3 sm:gap-4 border-t border-slate-200 pt-6 text-xs text-slate-500 sm:flex-row text-center sm:text-left">
          <p>© {new Date().getFullYear()} {storeName}. Todos os direitos reservados.</p>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-5">
            <Link href="/" className="hover:text-foreground">
              Política de Privacidade
            </Link>
            <Link href="/" className="hover:text-foreground">
              Termos de Uso
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
