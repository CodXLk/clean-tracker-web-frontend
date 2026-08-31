import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Mail, MapPin, Phone } from "lucide-react";
import { BUSINESS } from "@/lib/constants/business";
import { SERVICES } from "@/lib/constants/marketing-services";
import { BackToTop } from "./BackToTop";
import { QuoteButton } from "./QuoteButton";

const QUICK_LINKS = [
    { label: "Home", href: "/" },
    { label: "About Us", href: "/about" },
    { label: "Specialised Services", href: "/services" },
    { label: "Industries We Serve", href: "/industries" },
    { label: "Compliance & Safety", href: "/#compliance" },
    { label: "Latest Insights", href: "/blog" },
    { label: "FAQs", href: "/contact#faq" },
    { label: "Contact Us", href: "/contact" },
] as const;

const LEGAL_LINKS = [
    { label: "Privacy policy", href: "/privacy" },
    { label: "Terms & conditions", href: "/terms" },
    { label: "Cookies policy", href: "/cookies" },
] as const;

/** Real Figma-exported brand marks (lucide-react ships no social icons). No real profiles have been supplied, so these are decorative, not linked. */
const SOCIAL_ICONS = [
    { name: "Instagram", src: "/images/marketing/social/instagram.svg", width: 13, height: 13, chip: true },
    { name: "Facebook", src: "/images/marketing/social/facebook.svg", width: 13, height: 13, chip: false },
    { name: "YouTube", src: "/images/marketing/social/youtube.svg", width: 15, height: 13, chip: false },
    { name: "LinkedIn", src: "/images/marketing/social/linkedin.svg", width: 13, height: 13, chip: false },
] as const;

export function Footer() {
    return (
        <footer className="bg-ink text-white">
            {/* One row: the heading block and the link columns sit side by side, matching Figma — not stacked in separate bordered blocks. */}
            <div className="mx-auto flex max-w-[1368px] flex-col gap-12 px-5 py-16 sm:px-8 lg:flex-row lg:items-stretch lg:justify-between">
                <div className="flex max-w-sm shrink-0 flex-col justify-between gap-5">
                    <div className="flex flex-col gap-5">
                        <h2 className="text-3xl font-medium tracking-tight sm:text-4xl">Commercial Cleaning Services Australia</h2>
                        <p className="text-white/60">
                            Fully insured, police-checked, and WHS-compliant cleaners providing reliable commercial
                            cleaning across Australia.
                        </p>
                    </div>
                    <div className="flex flex-col gap-5">
                        <QuoteButton href="/contact" icon={ChevronRight} className="w-fit">
                            Request a Free Quote
                        </QuoteButton>
                        <ul className="flex items-center gap-3">
                            {SOCIAL_ICONS.map((icon) => (
                                <li
                                    key={icon.name}
                                    aria-label={icon.name}
                                    className={icon.chip ? "flex size-[18px] items-center justify-center rounded-[4px] bg-brand-2" : "flex size-[18px] items-center justify-center"}
                                >
                                    <Image src={icon.src} alt="" aria-hidden="true" width={icon.width} height={icon.height} />
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="grid gap-10 sm:grid-cols-2 lg:flex lg:gap-16">
                    <nav aria-label="Quick links" className="flex flex-col gap-4">
                        <h3 className="text-xl font-medium">Quick Links</h3>
                        <ul className="flex flex-col gap-3">
                            {QUICK_LINKS.map((link) => (
                                <li key={link.href}>
                                    <Link href={link.href} className="text-white/60 hover:text-white hover:underline">
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    <nav aria-label="Our services" className="flex flex-col gap-4">
                        <h3 className="text-xl font-medium">Our Services</h3>
                        <ul className="flex flex-col gap-3">
                            {SERVICES.map((service) => (
                                <li key={service.slug}>
                                    <Link href={`/services/${service.slug}`} className="text-white/60 hover:text-white hover:underline">
                                        {service.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    <div className="flex flex-col gap-4">
                        <h3 className="text-xl font-medium">Contact</h3>
                        <ul className="flex flex-col gap-3">
                            <li className="flex items-start gap-2 text-white/60">
                                <MapPin size={18} className="mt-0.5 shrink-0 text-brand-2" aria-hidden="true" />
                                <span>
                                    {BUSINESS.streetAddress}, {BUSINESS.addressLocality} {BUSINESS.addressRegion} {BUSINESS.postalCode}
                                </span>
                            </li>
                            <li className="flex items-start gap-2 text-white/60">
                                <Phone size={18} className="mt-0.5 shrink-0 text-brand-2" aria-hidden="true" />
                                <a href={BUSINESS.phoneHref} className="rounded underline-offset-4 hover:text-white hover:underline">
                                    {BUSINESS.phone}
                                </a>
                            </li>
                            <li className="flex items-start gap-2 text-white/60">
                                <Mail size={18} className="mt-0.5 shrink-0 text-brand-2" aria-hidden="true" />
                                <a href={BUSINESS.emailHref} className="rounded break-all underline-offset-4 hover:text-white hover:underline">
                                    {BUSINESS.email}
                                </a>
                            </li>
                        </ul>
                    </div>

                    <div className="flex flex-col gap-4">
                        <h3 className="text-xl font-medium">Legal</h3>
                        <ul className="flex flex-col gap-3">
                            {LEGAL_LINKS.map((link) => (
                                <li key={link.href}>
                                    <Link href={link.href} className="text-white/60 hover:text-white hover:underline">
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            <div className="border-t border-white/10">
                <div className="mx-auto flex w-full max-w-[1368px] flex-col items-start gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
                    <p className="text-sm text-white/60">
                        © {new Date().getFullYear()} {BUSINESS.legalName} (T/A {BUSINESS.tradingAs}). All rights reserved.
                    </p>
                    <BackToTop />
                </div>
            </div>
        </footer>
    );
}
