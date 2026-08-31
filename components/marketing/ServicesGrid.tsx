import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SERVICES } from "@/lib/constants/marketing-services";
import { SectionTag } from "./SectionTag";

/** Reused on Home (teaser) and /services (full hub) — same data, same cards. */
export function ServicesGrid({ heading = true }: { heading?: boolean }) {
    return (
        <section aria-labelledby={heading ? "services-grid-heading" : undefined} className="bg-surface-muted">
            <div className="mx-auto max-w-[1368px] px-5 py-20 sm:px-8">
                {heading && (
                    <div className="flex flex-col items-center gap-4 text-center">
                        <SectionTag>Our Services</SectionTag>
                        <h2 id="services-grid-heading" className="text-3xl font-medium tracking-tight text-ink sm:text-4xl">
                            Specialised Commercial Cleaning Services
                        </h2>
                    </div>
                )}

                <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {SERVICES.map((service) => {
                        const Icon = service.icon;
                        return (
                            <li key={service.slug}>
                                <Link
                                    href={`/services/${service.slug}`}
                                    className="group flex h-full flex-col gap-4 rounded-xl border border-line-2 bg-white p-6 transition-colors hover:border-brand-2"
                                >
                                    <span className="flex size-11 items-center justify-center rounded-lg bg-brand-2/10 text-brand-2">
                                        <Icon size={22} aria-hidden="true" />
                                    </span>
                                    <h3 className="text-lg font-medium text-ink">{service.name}</h3>
                                    <p className="flex-1 text-sm text-body-2">{service.shortDescription}</p>
                                    <span className="inline-flex items-center gap-1 text-sm font-medium text-brand-2">
                                        Learn more
                                        <ArrowRight size={16} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" />
                                    </span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </section>
    );
}
