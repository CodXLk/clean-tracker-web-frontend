import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Leaf, ShieldCheck, Star } from "lucide-react";
import type { ReactNode } from "react";

interface AuthLayoutProps {
  title:     string;
  subtitle:  string;
  children:  ReactNode;
  footer?:   ReactNode;
}

/** Auth shell mirroring the marketing home hero: a dark photo panel with an ink
    wash and orange (brand-2) accents beside a clean white form card. */
export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <main className="flex min-h-screen bg-surface-muted">
      {/* Brand panel — the home-hero look, hidden below lg */}
      <aside className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-ink p-12 text-white lg:flex">
        <Image
          src="/images/marketing/home/hero-bg.jpg"
          alt=""
          fill
          priority
          sizes="50vw"
          className="object-cover"
        />
        <div aria-hidden="true" className="absolute inset-0 bg-ink/70" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-brand-2/25 blur-3xl"
        />

        <div className="relative z-10">
          <Image
            src="/images/marketing/brand/logo.png"
            alt="Primeway Property Services"
            width={492}
            height={220}
            priority
            className="h-11 w-auto brightness-0 invert"
          />
        </div>

        <div className="relative z-10 max-w-md">
          <div className="flex w-fit items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm backdrop-blur">
            <span className="flex" aria-hidden="true">
              {Array.from({ length: 3 }).map((_, i) => (
                <Star key={i} size={14} className="fill-brand-2 text-brand-2" />
              ))}
            </span>
            Trusted commercial cleaning across Australia
          </div>

          <h2 className="mt-6 text-3xl font-medium tracking-tight sm:text-4xl">
            Primeway Operations Portal
          </h2>
          <p className="mt-4 text-base leading-relaxed text-white/80">
            Sign in to access rosters, inspections, deliveries, and client sites — the internal
            workspace for the Primeway team.
          </p>

          <ul className="mt-8 flex flex-col gap-3 text-sm text-white/90">
            <li className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-brand-2" aria-hidden="true" />
              Police &amp; VEVO checked staff
            </li>
            <li className="flex items-center gap-2">
              <Star size={18} className="text-brand-2" aria-hidden="true" />
              Fully insured &amp; WHS compliant
            </li>
            <li className="flex items-center gap-2">
              <Leaf size={18} className="text-brand-2" aria-hidden="true" />
              Eco-friendly cleaning solutions
            </li>
          </ul>
        </div>

        <p className="relative z-10 text-xs text-white/50">
          © {new Date().getFullYear()} Primeway Property Services. All rights reserved.
        </p>
      </aside>

      {/* Form panel */}
      <div className="flex w-full flex-col px-4 py-8 sm:px-6 lg:w-1/2 lg:px-16">
        <div className="flex items-center justify-between gap-4">
          <Image
            src="/images/marketing/brand/logo.png"
            alt="Primeway Property Services"
            width={492}
            height={220}
            priority
            className="h-10 w-auto lg:hidden"
          />
          <Link
            href="/"
            className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-sm text-body-2 transition-colors hover:border-brand-2 hover:text-brand-2"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Back to website
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center py-8">
          <div className="w-full max-w-md">
            <div className="rounded-2xl border border-line bg-white p-8 shadow-sm sm:p-10">
              <div className="mb-8">
                <h1 className="text-2xl font-medium tracking-tight text-ink sm:text-3xl">{title}</h1>
                <p className="mt-2 text-sm text-body-2">{subtitle}</p>
              </div>
              {children}
            </div>

            {footer && <div className="mt-6 text-center text-sm text-body-2">{footer}</div>}
          </div>
        </div>
      </div>
    </main>
  );
}
