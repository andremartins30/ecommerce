import type { Metadata } from "next";
import { Manrope, Inter, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";
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

export const metadata: Metadata = {
  title: {
    default: "NEBULA — Live Better. Every Day.",
    template: "%s — NEBULA",
  },
  description:
    "NEBULA is a modern curated destination for lifestyle, fashion, electronics, and home essentials. Live better, every day.",
  metadataBase: new URL("https://nebula.example.com"),
  openGraph: {
    title: "NEBULA — Live Better. Every Day.",
    description:
      "Upgrade your lifestyle today. Find the latest trends, top brands, and exclusive deals all in one place.",
    siteName: "NEBULA",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
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
