import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { PageHero } from "@/components/marketing/PageHero";
import { ServicesGrid } from "@/components/marketing/ServicesGrid";
import { BUSINESS } from "@/lib/constants/business";

export const metadata: Metadata = {
    title: "Our Services",
    description:
        "Regular, deep, hospital-grade disinfecting, carpet steam and commercial window cleaning across Australia from Primeway Property Services.",
    alternates: { canonical: "/services" },
};

export default function ServicesPage() {
    return (
        <>
            <Navbar />
            <main>
                <PageHero
                    eyebrow="Our Services"
                    title="Specialised Commercial Cleaning Services"
                    description={`${BUSINESS.name} tailors every cleaning program to your facility, schedule and industry standards across ${BUSINESS.serviceArea}.`}
                    breadcrumbs={[{ label: "Our Services", href: "/services" }]}
                />
                <ServicesGrid heading={false} />
                <section className="mx-auto max-w-[1368px] px-5 py-16 text-center sm:px-8">
                    <h2 className="text-2xl font-medium text-ink sm:text-3xl">Not sure which service you need?</h2>
                    <p className="mt-3 text-body-2">Tell us about your facility and we&rsquo;ll recommend a cleaning plan.</p>
                    <Link
                        href="/contact"
                        className="mt-6 inline-flex items-center rounded-full bg-brand-2 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-2-dark"
                    >
                        Request a Quote
                    </Link>
                </section>
            </main>
            <Footer />
        </>
    );
}
