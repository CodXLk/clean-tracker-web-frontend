import Image from "next/image";
import type { ReactNode } from "react";

interface AuthLayoutProps {
  title:     string;
  subtitle:  string;
  children:  ReactNode;
  footer?:   ReactNode;
}

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <main className="flex min-h-screen bg-[#F8FAFB]">
      {/* Brand panel — hidden below lg, this is the "professional SaaS" storytelling side */}
      <div className="relative hidden w-1/2 flex-col overflow-hidden bg-primary p-12 text-white lg:flex">
        <Image
          src="/images/marketing/industries/architectural-bg.jpg"
          alt=""
          fill
          sizes="50vw"
          className="object-cover opacity-80"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/75 to-primary/20" />

        <div className="relative z-10">
          <Image
            src="/images/marketing/brand/logo-navbar.png"
            alt="Primeway Property Services"
            width={140}
            height={63}
            priority
            className="h-11 w-auto brightness-0 invert"
          />
        </div>

        {/* Pushed down toward the bottom of the panel via mt-auto */}
        <div className="relative z-10 mt-auto max-w-md">
          <p className="font-heading text-xs font-bold uppercase tracking-[0.2em] text-[#ED5F25]">
            Operations Portal
          </p>
          <h2 className="mt-3 font-heading text-3xl font-bold leading-tight sm:text-4xl">
            Everything your team needs to run the job.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-white/80">
            Sign in to schedule your workforce, log inspections, manage deliveries, and stay on
            top of every client site from one secure workspace.
          </p>
        </div>

        <p className="relative z-10 mt-10 text-xs text-white/50">
          © {new Date().getFullYear()} Primeway Property Services. All rights reserved.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex w-full flex-col items-center justify-center px-4 py-10 sm:py-16 lg:w-1/2 lg:px-16">
        <div className="w-full max-w-md">
          <div className="mb-10 flex justify-center">
            <Image
              src="/images/marketing/brand/logo-full.png"
              alt="Primeway Property Services"
              width={340}
              height={152}
              priority
              className="h-24 w-auto sm:h-28"
            />
          </div>

          <div className="rounded-3xl border border-grey-200 bg-white p-8 shadow-xl shadow-black/[0.04] sm:p-10">
            <div className="mb-8 text-center lg:text-left">
              <h1 className="font-heading text-2xl font-bold text-on-surface">{title}</h1>
              <p className="mt-2 text-sm text-grey-500">{subtitle}</p>
            </div>
            {children}
          </div>

          {footer && <div className="mt-6 text-center text-sm text-grey-500">{footer}</div>}
        </div>
      </div>
    </main>
  );
}
