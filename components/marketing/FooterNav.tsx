"use client";

import Link from "next/link";
import { ArrowUp } from "lucide-react";
import { scrollToAnchor, scrollToTop } from "@/lib/scroll";

const FOOTER_LINKS = [
  { label: "Home",       href: "#top" },
  { label: "About Us",   href: "#who-we-are" },
  { label: "Services",   href: "#services" },
  { label: "Industries", href: "#industries" },
  { label: "Contact Us", href: "#contact" },
] as const;

const LINK_CLASS =
  "w-fit rounded font-body text-sm text-white/75 underline-offset-4 transition-colors hover:text-white hover:underline " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

/**
 * The footer's interactive half. Split out from `Footer` so the copy, logo and
 * contact details stay on the server — the only reason this needs a bundle is
 * to route anchor clicks through the page's smooth scroller instead of letting
 * the browser jump.
 */
export function FooterNav() {
  return (
    <nav aria-label="Footer" className="flex flex-col gap-3">
      <h2 className="font-heading text-sm font-bold tracking-[0.18em] text-white/50 uppercase">
        Explore
      </h2>
      {FOOTER_LINKS.map((link) => (
        <a
          key={link.href}
          href={link.href}
          onClick={(e) => {
            e.preventDefault();
            if (link.href === "#top") scrollToTop();
            else scrollToAnchor(link.href);
          }}
          className={LINK_CLASS}
        >
          {link.label}
        </a>
      ))}
      <Link href="/login" className={LINK_CLASS}>
        Sign in
      </Link>
    </nav>
  );
}

export function BackToTopButton() {
  return (
    <button
      type="button"
      onClick={scrollToTop}
      className="group flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 font-body text-xs font-semibold tracking-[0.12em] text-white/80 uppercase transition-colors hover:border-white/40 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      Back to top
      <ArrowUp
        size={14}
        aria-hidden="true"
        className="transition-transform duration-300 group-hover:-translate-y-0.5"
      />
    </button>
  );
}
