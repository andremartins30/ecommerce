import type { Metadata } from "next";
import { Manrope, Inter, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";
import { getStoreSettings } from "@/server/services/settings/store-settings";
import "./globals.css";

const heading = Manrope({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const body = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const mono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

/**
 * Metadata is generated from SystemSetting (see store-settings.ts) rather
 * than hardcoded — the store name, description and favicon come from the
 * admin panel (Task 19), not from a code deploy. APP_URL is validated env
 * config (src/server/env.ts), not a placeholder domain.
 */
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getStoreSettings();
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const title = `${settings.name} — Perfumes artesanais e contratipos`;
  const description = `${settings.name}: perfumaria artesanal brasileira com contratipos e fragrâncias importadas, disponibilidade real de estoque e prazos de produção claros.`;

  return {
    title: {
      default: title,
      template: `%s — ${settings.name}`,
    },
    description,
    metadataBase: new URL(appUrl),
    icons: settings.faviconUrl ? { icon: settings.faviconUrl } : undefined,
    openGraph: {
      title,
      description,
      siteName: settings.name,
      type: "website",
      images: settings.logoUrl ? [{ url: settings.logoUrl }] : undefined,
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${heading.variable} ${body.variable} ${mono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground" suppressHydrationWarning>
        <Providers>
          <TooltipProvider delay={150}>
            {children}
            <Toaster position="bottom-right" />
          </TooltipProvider>
        </Providers>
      </body>
    </html>
  );
}
