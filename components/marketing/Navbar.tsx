"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { BUSINESS } from "@/lib/constants/business";
import { QuoteButton } from "./QuoteButton";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Our services", href: "/services" },
  { label: "Industries", href: "/industries" },
  { label: "Compliance", href: "/compliance" },
  { label: "Reviews", href: "/reviews" },
  { label: "About us", href: "/about" },
  { label: "Contact", href: "/contact" },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** A floating white pill, inset from the viewport edges, so it reads over both the dark Home hero and light inner-page heroes. */
export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 p-3 sm:p-4">
      <div className="mx-auto flex h-14 max-w-[1368px] items-center justify-between gap-4 rounded-full bg-white/95 pr-2 pl-5 shadow-lg backdrop-blur">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-2"
        >
          <Image src="/images/marketing/brand/logomark.png" alt="" aria-hidden="true" width={28} height={28} className="size-7" />
          <span className="font-medium text-ink">{BUSINESS.name}</span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-6 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(pathname, link.href) ? "page" : undefined}
              className={cn(
                "text-sm text-body-2 transition-colors hover:text-brand-2",
                isActive(pathname, link.href) && "font-medium text-brand-2",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <QuoteButton className="hidden lg:inline-flex" />

          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
            className="flex size-10 shrink-0 items-center justify-center rounded-full border border-line text-ink lg:hidden"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <nav
          id="mobile-nav"
          aria-label="Primary"
          className="mx-auto mt-2 max-w-[1368px] rounded-2xl bg-white p-3 shadow-lg lg:hidden"
        >
          <ul className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  aria-current={isActive(pathname, link.href) ? "page" : undefined}
                  className={cn(
                    "block rounded-lg px-3 py-2.5 text-body-2",
                    isActive(pathname, link.href) && "bg-surface-muted font-medium text-brand-2",
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <QuoteButton className="mt-2 w-full justify-center" onClick={() => setOpen(false)} />
        </nav>
      )}
    </header>
  );
}
