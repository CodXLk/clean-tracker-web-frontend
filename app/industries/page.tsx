import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { PageHero } from "@/components/marketing/PageHero";
import { INDUSTRIES } from "@/lib/constants/industries";
import { BUSINESS } from "@/lib/constants/business";

export const metadata: Metadata = {
    title: "Industries We Serve",
    description:
        "Primeway Property Services provides commercial cleaning across commercial, healthcare, education, logistics, retail and more industries across Australia.",
    alternates: { canonical: "/industries" },
};

export default function IndustriesPage() {
    return (
        <>
            <Navbar />
            <main>
                <PageHero
                    eyebrow="Industries We Serve"
                    title="Cleaning Expertise Across Industry Sectors"
                    description={`Since ${BUSINESS.foundedYear}, we've grown to serve a wide range of industry sectors across ${BUSINESS.serviceArea}.`}
                    breadcrumbs={[{ label: "Industries We Serve", href: "/industries" }]}
                />

                <section className="mx-auto max-w-[1368px] px-5 py-16 sm:px-8">
                    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                        {INDUSTRIES.map(({ name, icon: Icon }) => (
                            <li key={name} className="flex flex-col items-center gap-3 rounded-xl border border-line p-6 text-center">
                                <span className="flex size-12 items-center justify-center rounded-full bg-brand-2/10 text-brand-2">
                                    <Icon size={22} aria-hidden="true" />
                                </span>
                                <span className="text-sm font-medium text-ink">{name}</span>
                            </li>
                        ))}
                    </ul>
                </section>

                <section className="bg-ink">
                    <div className="mx-auto flex max-w-[1368px] flex-col items-center gap-4 px-5 py-16 text-center sm:px-8">
                        <h2 className="text-2xl font-medium text-white sm:text-3xl">Don&rsquo;t see your industry listed?</h2>
                        <p className="max-w-xl text-white/75">Get in touch — we tailor cleaning programs to facilities of all kinds.</p>
                        <Link
                            href="/contact"
                            className="inline-flex items-center rounded-full bg-brand-2 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-2-dark"
                        >
                            Request a Quote
                        </Link>
                    </div>
                </section>
            </main>
            <Footer />
        </>
    );
}
