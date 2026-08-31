import Image from "next/image";
import Link from "next/link";
import { Settings2 } from "lucide-react";
import { SectionTag } from "../SectionTag";
import { QuoteButton } from "../QuoteButton";
import { SERVICES } from "@/lib/constants/marketing-services";

/** Matches the Figma showcase order (left-to-right, top-to-bottom), not the canonical SERVICES order used elsewhere. */
const SHOWCASE_ORDER = [
    "deep-cleaning",
    "regular-commercial-cleaning",
    "floor-scrubbing-strip-and-seal",
    "hospital-grade-disinfecting",
    "hygiene-services-and-consumables",
    "commercial-window-cleaning",
    "carpet-steam-cleaning",
] as const;

/** Home-only photo-card treatment for the 7 services Figma shows with imagery; the 8th (no photo) still gets a page via /services. */
export function ServicesShowcase() {
    const featured = SHOWCASE_ORDER.map((slug) => SERVICES.find((s) => s.slug === slug)!);

    return (
        <section aria-labelledby="services-showcase-heading" className="border-y border-line bg-white">
            <div className="mx-auto max-w-[1368px] px-5 py-20 sm:px-8">
                {/* A 3x3 grid: heading fills the first cell, the 7 photo cards fill the middle cells, the CTA fills the last — matching the Figma layout. */}
                <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <li className="flex flex-col justify-start gap-4">
                        <SectionTag>Our Specialised Services</SectionTag>
                        <h2 id="services-showcase-heading" className="text-3xl font-medium tracking-tight text-ink sm:text-4xl">
                            Commercial Cleaning &amp; Property Maintenance Solutions
                        </h2>
                    </li>

                    {featured.map((service) => (
                        <li key={service.slug}>
                            <Link
                                href={`/services/${service.slug}`}
                                className="group flex h-full flex-col overflow-hidden rounded-xl border border-line-2 p-3 transition-colors hover:border-brand-2"
                            >
                                <div className="relative aspect-[430/273] overflow-hidden rounded-lg">
                                    <Image
                                        src={service.photo!}
                                        alt={`${service.name} — Primeway Property Services`}
                                        fill
                                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                                    />
                                </div>
                                <div className="flex flex-1 flex-col gap-2 px-1 pt-4 pb-2">
                                    <h3 className="text-xl font-medium text-ink">{service.name}</h3>
                                    <p className="text-sm text-body-2">{service.shortDescription}</p>
                                </div>
                            </Link>
                        </li>
                    ))}

                    <li className="flex items-end justify-center sm:justify-end">
                        <QuoteButton href="/contact" icon={Settings2}>
                            Request a Free Quote
                        </QuoteButton>
                    </li>
                </ul>
            </div>
        </section>
    );
}
