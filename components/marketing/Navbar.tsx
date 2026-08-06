"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { Menu, X } from "lucide-react";
import { gsap } from "@/lib/gsap";
import { cn } from "@/lib/utils/cn";
import { scrollToAnchor, scrollToTop } from "@/lib/scroll";
import { useMediaQuery } from "@/hooks/useMediaQuery";
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

/** How far the page must move before the bar takes on its glass surface. */
const GLASS_AFTER = 40;

export function Navbar() {
  const [theme, setTheme] = useState<NavTheme>("light");
  const [activeHref, setActiveHref] = useState<string>("#top");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const navRef       = useRef<HTMLElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const progressRef  = useRef<HTMLSpanElement>(null);
  const sheetRef     = useRef<HTMLDivElement>(null);
  const toggleRef    = useRef<HTMLButtonElement>(null);

  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

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

  // The glass surface only appears once the page has actually moved, so the
  // hero is seen exactly as Figma draws it. `passive` keeps the listener off
  // the scroll critical path.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > GLASS_AFTER);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Reading progress. Scrubbed rather than tied to a scroll handler so it moves
  // on the same tick as every other scroll-linked element on the page.
  useGSAP(
    () => {
      if (!progressRef.current || reduceMotion) return;
      gsap.fromTo(
        progressRef.current,
        { scaleX: 0 },
        {
          scaleX: 1,
          ease: "none",
          scrollTrigger: {
            trigger: document.documentElement,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.3,
            // This is the only trigger on the page measured against the whole
            // document, and it starts at the same scroll position as the hero's
            // pin. A negative priority refreshes it last — after the pin has
            // created its spacer — so it reads the final document height rather
            // than racing the scenes for it.
            refreshPriority: -1,
          },
        },
      );
    },
    { dependencies: [reduceMotion] },
  );

  // Slide the underline to whichever link is current. Measured rather than
  // drawn per-link so the indicator travels between them instead of blinking.
  useEffect(() => {
    const indicator = indicatorRef.current;
    const active = navRef.current?.querySelector<HTMLElement>(`[href="${activeHref}"]`);
    if (!indicator || !active) return;

    const move = () => {
      // The <nav> is positioned, so it is the offset parent of both the links
      // and the indicator — `offsetLeft` is already the value we want.
      gsap.to(indicator, {
        x: active.offsetLeft,
        width: active.offsetWidth,
        opacity: 1,
        duration: reduceMotion ? 0 : 0.45,
        ease: "power3.out",
        overwrite: true,
      });
    };

    move();
    window.addEventListener("resize", move);
    return () => window.removeEventListener("resize", move);
  }, [activeHref, reduceMotion]);

  // Lock body scroll while the mobile sheet is open. Removing the scrollbar
  // would otherwise widen the page by its own width and shift everything left,
  // so the same width is handed back as padding for as long as the lock lasts.
  useEffect(() => {
    if (!mobileOpen) return;

    const { body } = document;
    const previousOverflow = body.style.overflow;
    const previousPadding = body.style.paddingRight;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;

    body.style.overflow = "hidden";
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;

    return () => {
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPadding;
    };
  }, [mobileOpen]);

  // Sheet keyboard contract: Escape closes it, Tab cycles inside it, and focus
  // returns to the button that opened it.
  useEffect(() => {
    if (!mobileOpen) return;
    const sheet = sheetRef.current;
    if (!sheet) return;

    // Captured now, not in the cleanup: by the time the sheet closes the ref may
    // point somewhere else entirely.
    const opener = (document.activeElement as HTMLElement | null) ?? toggleRef.current;
    sheet.querySelector<HTMLElement>("a, button")?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = sheet.querySelectorAll<HTMLElement>("a[href], button:not([disabled])");
      if (focusable.length === 0) return;
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      opener?.focus?.();
    };
  }, [mobileOpen]);

  const navigate = useCallback((href: string) => {
    setMobileOpen(false);
    if (href === "#top") scrollToTop();
    else scrollToAnchor(href);
  }, []);

  const isLight = theme === "light" && !mobileOpen;

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50">
      {/* Glass surface. Figma gives the file a Glass style (a 25px blur behind a
          faint wash); the bar wears it once the page scrolls so the hero stays
          exactly as drawn. The tint follows the section behind it — a dark wash
          over the sky scenes, a light one over the white Services scene — so the
          links keep their contrast either way. */}
      <div
        aria-hidden="true"
        className={cn(
          "absolute inset-0 border-b backdrop-blur-[25px] transition-all duration-500 ease-out",
          scrolled && !mobileOpen ? "opacity-100" : "opacity-0",
          isLight
            ? "border-white/10 bg-[rgba(16,32,36,0.28)]"
            : "border-black/5 bg-[rgba(255,255,255,0.72)]",
        )}
      />

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
          className="shrink-0 rounded-md transition-transform duration-300 hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent motion-reduce:hover:scale-100"
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
          ref={navRef}
          aria-label="Primary"
          className="absolute left-1/2 hidden w-[min(36.6vw,34.625rem)] -translate-x-1/2 items-center justify-between px-[1.19vw] lg:flex"
        >
          <span
            ref={indicatorRef}
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 left-0 h-[2px] w-0 rounded-full bg-accent opacity-0"
          />
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
                  "relative rounded-md px-[0.53vw] py-[0.33vw] font-heading text-nav whitespace-nowrap",
                  "transition-[color,transform] duration-300 ease-out hover:-translate-y-0.5",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                  "motion-reduce:hover:translate-y-0",
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
          ref={toggleRef}
          type="button"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav"
          onClick={() => setMobileOpen((open) => !open)}
          className={cn(
            "relative flex size-11 items-center justify-center rounded-full transition-colors duration-300 lg:hidden",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
            isLight ? "text-white" : "text-black",
          )}
        >
          <Menu
            size={24}
            aria-hidden="true"
            className={cn(
              "absolute transition-all duration-300",
              mobileOpen ? "rotate-90 scale-50 opacity-0" : "rotate-0 scale-100 opacity-100",
            )}
          />
          <X
            size={24}
            aria-hidden="true"
            className={cn(
              "absolute transition-all duration-300",
              mobileOpen ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-50 opacity-0",
            )}
          />
        </button>
      </div>

      {/* Reading progress — a hairline that fills as the page is consumed. */}
      <span
        ref={progressRef}
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-[2px] origin-left scale-x-0 bg-gradient-to-r from-primary via-accent to-accent"
      />

      {/* The sheet stays mounted so it can animate both ways; `invisible` takes
          it out of the tab order while closed. */}
      <div
        id="mobile-nav"
        ref={sheetRef}
        className={cn(
          "pointer-events-auto absolute inset-x-0 top-full origin-top border-t border-black/5 bg-white/95",
          "shadow-[0_24px_48px_-24px_rgba(0,0,0,0.35)] backdrop-blur-[25px] transition-all duration-300 ease-out lg:hidden",
          mobileOpen
            ? "visible translate-y-0 opacity-100"
            : "invisible -translate-y-3 opacity-0",
        )}
      >
        <nav aria-label="Primary" className="flex flex-col gap-1 px-5 pb-6 pt-3">
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
                  ? "bg-accent/10 font-extrabold text-accent"
                  : "font-normal text-on-surface hover:bg-black/5 hover:text-accent",
              )}
            >
              {link.label}
            </a>
          ))}
          <Link
            href="/login"
            onClick={() => setMobileOpen(false)}
            className="rounded-xl px-3 py-3 font-heading text-lg text-on-surface transition-colors hover:bg-black/5 hover:text-accent"
          >
            Sign in
          </Link>
          <QuoteButton onNavigate={navigate} className="mt-2 w-full" />
        </nav>
      </div>
    </header>
  );
}
