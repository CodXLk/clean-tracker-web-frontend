"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const NAV_LINKS = [
  { label: "Home", href: "#top" },
  { label: "About Us", href: "#who-we-are" },
  { label: "Services", href: "#services" },
  { label: "Contact Us", href: "#contact" },
] as const;

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [activeHash, setActiveHash] = useState("#top");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 80);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const sectionIds = NAV_LINKS.map((l) => l.href.slice(1));
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveHash(`#${entry.target.id}`);
          }
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );

    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  function handleNavClick(href: string) {
    setMobileOpen(false);
    const target = document.querySelector(href);
    target?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-300",
        scrolled ? "bg-white/95 shadow-md backdrop-blur-sm" : "bg-transparent",
      )}
    >
      <div className="mx-auto flex max-w-[1512px] items-center justify-between px-6 py-3 lg:px-10">
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            handleNavClick("#top");
          }}
          className="shrink-0"
          aria-label="Primeway Property Services home"
        >
          <Image
            src="/images/marketing/brand/logo-navbar.png"
            alt="Primeway Property Services"
            width={123}
            height={55}
            priority
            className="h-11 w-auto"
          />
        </a>

        {/* Desktop nav pill */}
        <nav
          aria-label="Primary"
          className={cn(
            "hidden items-center gap-2 rounded-full px-4 py-2 lg:flex",
            scrolled ? "bg-grey-100" : "bg-white/10 backdrop-blur-sm",
          )}
        >
          {NAV_LINKS.map((link) => {
            const isActive = activeHash === link.href;
            return (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(link.href);
                }}
                className={cn(
                  "rounded-full px-3 py-1.5 font-heading text-base font-extrabold transition-colors",
                  isActive
                    ? "text-[#ED5F25]"
                    : scrolled
                      ? "font-normal text-on-surface hover:text-primary"
                      : "font-normal text-white hover:text-white/80",
                )}
              >
                {link.label}
              </a>
            );
          })}
        </nav>

        <div className="hidden shrink-0 items-center gap-4 lg:flex">
          <Link
            href="/login"
            className={cn(
              "font-heading text-sm font-medium transition-colors",
              scrolled ? "text-on-surface hover:text-primary" : "text-white hover:text-white/80",
            )}
          >
            Sign in
          </Link>
          <a
            href="#contact"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick("#contact");
            }}
            className="rounded-full bg-primary px-5 py-2.5 font-heading text-sm font-extrabold text-white shadow-md transition-colors hover:bg-primary-variant"
          >
            Get a Quote
          </a>
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          onClick={() => setMobileOpen((v) => !v)}
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full lg:hidden",
            scrolled ? "text-on-surface" : "text-white",
          )}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="flex flex-col gap-1 bg-white px-6 pb-6 shadow-lg lg:hidden">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => {
                e.preventDefault();
                handleNavClick(link.href);
              }}
              className={cn(
                "rounded-xl px-3 py-2.5 font-heading text-base font-medium",
                activeHash === link.href ? "text-[#ED5F25]" : "text-on-surface",
              )}
            >
              {link.label}
            </a>
          ))}
          <Link
            href="/login"
            onClick={() => setMobileOpen(false)}
            className="rounded-xl px-3 py-2.5 font-heading text-base font-medium text-on-surface"
          >
            Sign in
          </Link>
          <a
            href="#contact"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick("#contact");
            }}
            className="mt-2 rounded-full bg-primary px-5 py-2.5 text-center font-heading text-sm font-extrabold text-white"
          >
            Get a Quote
          </a>
        </div>
      )}
    </header>
  );
}
