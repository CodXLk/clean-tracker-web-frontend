import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check } from "lucide-react";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { PageHero } from "@/components/marketing/PageHero";
import { SectionTag } from "@/components/marketing/SectionTag";
import { JsonLd } from "@/components/marketing/JsonLd";
import { BUSINESS } from "@/lib/constants/business";
import { SERVICES, getServiceBySlug } from "@/lib/constants/marketing-services";

interface Props {
    params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
    return SERVICES.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const service = getServiceBySlug(slug);
    if (!service) return {};

    return {
        title: `${service.name} in Australia`,
        description: service.metaDescription,
        alternates: { canonical: `/services/${service.slug}` },
    };
}

export default async function ServiceDetailPage({ params }: Props) {
    const { slug } = await params;
    const service = getServiceBySlug(slug);
    if (!service) notFound();

    const otherServices = SERVICES.filter((s) => s.slug !== service.slug).slice(0, 3);
    const Icon = service.icon;

    return (
        <>
            <JsonLd
                data={{
                    "@context": "https://schema.org",
                    "@type": "Service",
                    serviceType: service.name,
                    name: service.name,
                    description: service.metaDescription,
                    areaServed: BUSINESS.serviceArea,
                    provider: { "@type": "LocalBusiness", name: BUSINESS.name, telephone: BUSINESS.phone },
                }}
            />
            <Navbar />
            <main>
                <PageHero
                    eyebrow="Our Services"
                    title={`${service.name} in Australia`}
                    description={service.description}
                    breadcrumbs={[
                        { label: "Our Services", href: "/services" },
                        { label: service.name, href: `/services/${service.slug}` },
                    ]}
                />

                <section className="mx-auto max-w-[1368px] px-5 py-16 sm:px-8">
                    {service.photo && (
                        <div className="relative mb-10 aspect-[21/9] overflow-hidden rounded-xl">
                            <Image
                                src={service.photo}
                                alt={`${service.name} — Primeway Property Services`}
                                fill
                                sizes="(min-width: 1024px) 1368px, 100vw"
                                className="object-cover"
                                priority
                            />
                        </div>
                    )}
                    <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
                        <div>
                            <div className="flex items-center gap-3">
                                <span className="flex size-12 items-center justify-center rounded-lg bg-brand-2/10 text-brand-2">
                                    <Icon size={24} aria-hidden="true" />
                                </span>
                                <h2 className="text-2xl font-medium text-ink">What&rsquo;s Included</h2>
                            </div>
                            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
                                {service.included.map((item) => (
                                    <li key={item} className="flex items-start gap-2.5 text-body-2">
                                        <Check size={18} className="mt-0.5 shrink-0 text-brand-2" aria-hidden="true" />
                                        {item}
                                    </li>
                                ))}
                            </ul>

                            <div className="mt-10">
                                <SectionTag>How It Works</SectionTag>
                                <p className="mt-4 text-body-2">
                                    Share your facility requirements and schedule with our team — we&rsquo;ll design a
                                    tailored {service.name.toLowerCase()} plan and assign a consistent, vetted crew to
                                    your site, backed by periodic quality audits.
                                </p>
                            </div>
                        </div>

                        <aside className="flex flex-col gap-4 rounded-xl border border-line p-6">
                            <h2 className="text-lg font-medium text-ink">Request a Quote</h2>
                            <p className="text-sm text-body-2">Get a tailored quote for {service.name.toLowerCase()} at your facility.</p>
                            <Link
                                href="/contact"
                                className="inline-flex items-center justify-center rounded-full bg-brand-2 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-2-dark"
                            >
                                Request a Quote
                            </Link>
                            <a href={BUSINESS.phoneHref} className="text-center text-sm font-medium text-ink hover:text-brand-2">
                                Or call {BUSINESS.phone}
                            </a>
                        </aside>
                    </div>
                </section>

                <section aria-labelledby="other-services-heading" className="bg-surface-muted">
                    <div className="mx-auto max-w-[1368px] px-5 py-16 sm:px-8">
                        <h2 id="other-services-heading" className="text-2xl font-medium text-ink">
                            Other Services
                        </h2>
                        <ul className="mt-6 grid gap-4 sm:grid-cols-3">
                            {otherServices.map((other) => (
                                <li key={other.slug}>
                                    <Link
                                        href={`/services/${other.slug}`}
                                        className="block rounded-xl border border-line-2 bg-white p-5 text-sm font-medium text-ink transition-colors hover:border-brand-2 hover:text-brand-2"
                                    >
                                        {other.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>
            </main>
            <Footer />
        </>
    );
}
