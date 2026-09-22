import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-20 text-center">
      <p className="font-heading text-sm font-semibold tracking-[0.2em] text-accent uppercase">404</p>
      <div className="mt-4 flex size-16 items-center justify-center rounded-full bg-secondary">
        <Compass className="size-7 text-foreground" strokeWidth={1.5} />
      </div>
      <h1 className="mt-6 font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        Page not found
      </h1>
      <p className="mt-3 max-w-sm text-sm text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or may have been moved.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button render={<Link href="/" />}>Back to Home</Button>
        <Button variant="outline" render={<Link href="/shop" />}>
          Continue Shopping
        </Button>
      </div>
    </div>
  );
}
