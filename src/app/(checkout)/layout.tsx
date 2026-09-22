import Link from "next/link";
import { Lock } from "lucide-react";

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border">
        <div className="container-page flex h-16 items-center justify-between">
          <Link href="/" className="font-heading text-lg font-bold tracking-[0.14em] uppercase">
            Arkive
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="size-3.5" />
            Secure Checkout
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
