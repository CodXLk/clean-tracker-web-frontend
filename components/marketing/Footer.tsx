import Image from "next/image";
import Link from "next/link";

const FOOTER_LINKS = [
  { label: "Home", href: "#top" },
  { label: "About Us", href: "#who-we-are" },
  { label: "Services", href: "#services" },
  { label: "Contact Us", href: "#contact" },
] as const;

export function Footer() {
  return (
    <footer className="bg-primary text-white">
      <div className="mx-auto flex max-w-[1512px] flex-col gap-8 px-6 py-12 lg:flex-row lg:items-start lg:justify-between lg:px-10">
        <div className="flex flex-col gap-3">
          <Image
            src="/images/marketing/brand/logo-navbar.png"
            alt="Primeway Property Services"
            width={140}
            height={63}
            className="h-12 w-auto brightness-0 invert"
          />
          <p className="max-w-sm text-sm text-white/70">
            Commercial cleaning company based in Victoria, Australia, established in 2021.
          </p>
        </div>

        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2">
          {FOOTER_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="font-heading text-sm text-white/80 hover:text-white">
              {link.label}
            </a>
          ))}
          <Link href="/login" className="font-heading text-sm text-white/80 hover:text-white">
            Sign in
          </Link>
        </nav>
      </div>
      <div className="border-t border-white/10 px-6 py-4 text-center text-xs text-white/60 lg:px-10 lg:text-left">
        © {new Date().getFullYear()} Primeway Property Services. All rights reserved.
      </div>
    </footer>
  );
}
