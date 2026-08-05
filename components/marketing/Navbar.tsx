"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { QuoteButton } from "./QuoteButton";

const NAV_LINKS = [
  { label: "Home",       href: "#top" },
  { label: "About Us",   href: "#who-we-are" },
  { label: "Services",   href: "#services" },
  { label: "Contact Us", href: "#contact" },
] as const;

/**
 * Sections tag themselves with `data-nav-theme`; the bar reads whichever one is
 * currently behind it and flips its link colour. Figma draws the navbar with no
 * surface of its own — white links over the sky scenes, black over the white
 * Services scene — so the theme has to follow the content rather than scroll
 * distance.
 */
type NavTheme = "light" | "dark";

export function Navbar() {
  const [theme, setTheme] = useState<NavTheme>("light");
  const [activeHref, setActiveHref] = useState<string>("#top");
  const [mobileOpen, setMobileOpen] = useState(false);

  // Which section sits *behind the bar itself* — a sliver-shaped root at the top
  // of the viewport, so the answer changes exactly when a section slides under.
  useEffect(() => {
    const sections = document.querySelectorAll<HTMLElement>("[data-nav-theme]");
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setTheme((entry.target as HTMLElement).dataset.navTheme as NavTheme);
          }
        }
      },
      // A band across the top tenth of the viewport — tall enough to always be
      // a positive-height root (a -100% bottom margin would collapse it) while
      // still only ever containing whatever sits directly behind the bar.
      { rootMargin: "0px 0px -90% 0px", threshold: 0 },
    );

    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Which nav link to mark current — the section occupying the middle band.
  useEffect(() => {
    const targets = NAV_LINKS.map((l) => document.querySelector(l.href)).filter(
      (el): el is HTMLElement => el instanceof HTMLElement,
    );
    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveHref(`#${entry.target.id}`);
        }
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Lock body scroll while the mobile sheet is open.
  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  const navigate = useCallback((href: string) => {
    setMobileOpen(false);
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const isLight = theme === "light" && !mobileOpen;

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50">
      {/* 1432 of a 1512 canvas => a 2.71% gutter either side, capped so the bar
          stops spreading past the design's own maximum. */}
      {/* Figma seats the 55px bar 48px down from the top of the canvas, inside a
          41px gutter — hence padding rather than a centred fixed height. */}
      <div className="pointer-events-auto relative mx-auto flex w-full max-w-[1512px] items-center justify-between px-[max(1.25rem,2.712vw)] pt-[clamp(0.625rem,3.175vw,3rem)] pb-[clamp(0.625rem,1.5vw,1.25rem)]">
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            navigate("#top");
          }}
          aria-label="Primeway Property Services — back to top"
          className="shrink-0 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        >
          <Image
            src="/images/marketing/brand/logo.png"
            alt="Primeway Property Services"
            width={492}
            height={220}
            priority
            className="h-[clamp(2.25rem,3.64vw,3.4375rem)] w-auto"
          />
        </a>

        {/* Desktop nav — the 554px centred pill from Figma. */}
        <nav
          aria-label="Primary"
          className="absolute left-1/2 hidden w-[min(36.6vw,34.625rem)] -translate-x-1/2 items-center justify-between px-[1.19vw] lg:flex"
        >
          {NAV_LINKS.map((link) => {
            const isActive = activeHref === link.href;
            return (
              <a
                key={link.href}
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(link.href);
                }}
                className={cn(
                  "rounded-md px-[0.53vw] py-[0.33vw] font-heading text-nav whitespace-nowrap transition-colors duration-200",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                  isActive
                    ? "font-extrabold text-accent"
                    : cn(
                        "font-normal hover:text-accent",
                        isLight ? "text-white" : "text-black",
                      ),
                )}
              >
                {link.label}
              </a>
            );
          })}
        </nav>

        <QuoteButton onNavigate={navigate} className="hidden lg:inline-flex" />

        <button
          type="button"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav"
          onClick={() => setMobileOpen((open) => !open)}
          className={cn(
            "flex size-11 items-center justify-center rounded-full transition-colors lg:hidden",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
            isLight ? "text-white" : "text-black",
          )}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileOpen && (
        <nav
          id="mobile-nav"
          aria-label="Primary"
          className="pointer-events-auto flex flex-col gap-1 border-t border-black/5 bg-white px-5 pb-6 pt-2 shadow-xl lg:hidden"
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              aria-current={activeHref === link.href ? "page" : undefined}
              onClick={(e) => {
                e.preventDefault();
                navigate(link.href);
              }}
              className={cn(
                "rounded-xl px-3 py-3 font-heading text-lg transition-colors",
                activeHref === link.href
                  ? "font-extrabold text-accent"
                  : "font-normal text-on-surface hover:text-accent",
              )}
            >
              {link.label}
            </a>
          ))}
          <Link
            href="/login"
            onClick={() => setMobileOpen(false)}
            className="rounded-xl px-3 py-3 font-heading text-lg text-on-surface hover:text-accent"
          >
            Sign in
          </Link>
          <QuoteButton onNavigate={navigate} className="mt-2 w-full" />
        </nav>
      )}
    </header>
  );
}
