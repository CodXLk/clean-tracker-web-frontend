import Image from "next/image";
import Link from "next/link";

const FOOTER_LINKS = [
  { label: "Home",       href: "#top" },
  { label: "About Us",   href: "#who-we-are" },
  { label: "Services",   href: "#services" },
  { label: "Contact Us", href: "#contact" },
] as const;

const LINK_CLASS =
  "rounded font-heading text-base text-white/80 transition-colors hover:text-white " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export function Footer() {
  return (
    <footer className="relative bg-primary text-white">
      <div className="mx-auto flex w-full max-w-[1512px] flex-col gap-10 px-[max(1.25rem,2.712vw)] py-14 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-col gap-4">
          <Image
            src="/images/marketing/brand/logo.png"
            alt="Primeway Property Services"
            width={492}
            height={220}
            className="h-14 w-auto brightness-0 invert"
          />
          <p className="max-w-sm font-body text-sm leading-relaxed text-white/70">
            A commercial cleaning company based in Victoria, Australia. Established 2021, serving a
            wide range of industry sectors.
          </p>
        </div>

        <nav aria-label="Footer" className="flex flex-wrap gap-x-8 gap-y-3">
          {FOOTER_LINKS.map((link) => (
            <a key={link.href} href={link.href} className={LINK_CLASS}>
              {link.label}
            </a>
          ))}
          <Link href="/login" className={LINK_CLASS}>
            Sign in
          </Link>
        </nav>
      </div>

      <div className="border-t border-white/10 px-[max(1.25rem,2.712vw)] py-5">
        <p className="mx-auto w-full max-w-[1512px] font-body text-xs text-white/60">
          © {new Date().getFullYear()} Primeway Property Services. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
