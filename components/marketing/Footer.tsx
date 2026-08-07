import Image from "next/image";
import { Mail, MapPin, Phone } from "lucide-react";
import { BackToTopButton, FooterNav } from "./FooterNav";

const SERVICES = [
  "Regular Cleaning",
  "Periodical Cleaning",
  "Deep Cleaning",
  "Specialist Cleaning",
] as const;

const CONTACT = [
  { icon: MapPin, label: "Victoria, Australia", href: undefined },
  { icon: Phone,  label: "1800 890 991",        href: "tel:1800890991" },
  { icon: Mail,   label: "info@primewayservices.com.au", href: "mailto:info@primewayservices.com.au" },
] as const;

export function Footer() {
  return (
    <footer className="relative bg-primary text-white">
      {/* A hairline of the accent across the top ties the teal slab back to the
          rest of the palette rather than letting it read as a separate page. */}
      <div
        aria-hidden="true"
        className="h-px w-full bg-[linear-gradient(to_right,transparent,var(--color-accent),transparent)]"
      />

      <div className="mx-auto grid w-full max-w-[1512px] gap-10 px-[max(1.25rem,2.712vw)] py-14 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1.2fr] lg:gap-12">
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

        <FooterNav />

        <div className="flex flex-col gap-3">
          <h2 className="font-heading text-sm font-bold tracking-[0.18em] text-white/50 uppercase">
            Services
          </h2>
          <ul className="flex flex-col gap-3">
            {SERVICES.map((service) => (
              <li key={service} className="font-body text-sm text-white/75">
                {service}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="font-heading text-sm font-bold tracking-[0.18em] text-white/50 uppercase">
            Contact
          </h2>
          <ul className="flex flex-col gap-3">
            {CONTACT.map(({ icon: Icon, label, href }) => (
              <li key={label} className="flex items-start gap-2.5 font-body text-sm text-white/75">
                <Icon size={16} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
                {href ? (
                  <a
                    href={href}
                    className="rounded break-all underline-offset-4 transition-colors hover:text-white hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    {label}
                  </a>
                ) : (
                  <span>{label}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex w-full max-w-[1512px] flex-col items-start gap-4 px-[max(1.25rem,2.712vw)] py-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-body text-xs text-white/60">
            © {new Date().getFullYear()} Primeway Property Services. All rights reserved.
          </p>
          <BackToTopButton />
        </div>
      </div>
    </footer>
  );
}
