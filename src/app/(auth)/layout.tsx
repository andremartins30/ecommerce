import Image from "next/image";
import Link from "next/link";
import { HERO_IMAGES } from "@/lib/data/images";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden lg:block">
        <Image
          src={HERO_IMAGES.homeSecondary}
          alt="ARKIVE"
          fill
          priority
          sizes="50vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/20" />
        <div className="absolute inset-0 flex flex-col justify-between p-10">
          <Link href="/" className="font-heading text-xl font-extrabold tracking-[0.1em] text-white uppercase">
            NEBULA
          </Link>
          <p className="max-w-sm font-heading text-2xl font-bold leading-snug text-white text-balance">
            &ldquo;Live Better. Every Day.&rdquo;
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 sm:px-10">
        <Link
          href="/"
          className="mb-10 font-heading text-2xl font-extrabold tracking-[0.1em] text-[#0B1A30] uppercase lg:hidden"
        >
          NEBULA
        </Link>
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
