import type { Metadata } from "next";
import { Phone, ArrowDownRight, MapPin } from "lucide-react";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { SectionTag } from "@/components/marketing/SectionTag";
import { QuoteButton } from "@/components/marketing/QuoteButton";
import { JsonLd } from "@/components/marketing/JsonLd";
import { ContactForm } from "@/components/marketing/ContactForm";
import { FaqAccordion } from "@/components/marketing/FaqAccordion";
import { BUSINESS } from "@/lib/constants/business";
import { FAQ_ITEMS } from "@/lib/constants/faq";

export const metadata: Metadata = {
    title: "Contact Us",
    description:
        "Request a commercial cleaning quote from Primeway Property Services. Call 1800 890 991 or send us your facility details.",
    alternates: { canonical: "/contact" },
};

const INFO_ITEMS: { label: string; value: string; href?: string }[] = [
    { label: "Email:", value: BUSINESS.email, href: BUSINESS.emailHref },
    { label: "Phone:", value: BUSINESS.phone, href: BUSINESS.phoneHref },
    {
        label: "Address:",
        value: `${BUSINESS.streetAddress}, ${BUSINESS.addressLocality} ${BUSINESS.addressRegion} ${BUSINESS.postalCode}`,
    },
    {
        label: "Working Hours:",
        value: "By appointment, including before/after hours and overnight scheduling.",
    },
];

export default function ContactPage() {
    return (
        <>
            <JsonLd
                data={{
                    "@context": "https://schema.org",
                    "@type": "FAQPage",
                    mainEntity: FAQ_ITEMS.map((item) => ({
                        "@type": "Question",
                        name: item.question,
                        acceptedAnswer: { "@type": "Answer", text: item.answer },
                    })),
                }}
            />
            <Navbar />
            <main>
                <section className="border-b border-line bg-surface-muted">
                    <div className="mx-auto max-w-[1368px] px-5 py-12 sm:px-8 sm:py-16">
                        <div className="flex flex-col gap-10 lg:flex-row lg:items-stretch lg:justify-between">
                            <div className="flex flex-col justify-between gap-16 lg:max-w-lg">
                                <div className="flex flex-col gap-4">
                                    <SectionTag>Contact us</SectionTag>
                                    <h1 className="flex flex-wrap items-end gap-2 text-4xl font-medium tracking-tight text-ink sm:text-5xl lg:text-6xl">
                                        Request a Commercial Facility Quote
                                        <ArrowDownRight size={36} className="hidden shrink-0 sm:block" aria-hidden="true" />
                                    </h1>
                                </div>

                                <ul className="grid grid-cols-2 gap-x-12 gap-y-8">
                                    {INFO_ITEMS.map(({ label, value, href }) => (
                                        <li key={label} className="flex flex-col gap-2">
                                            <p className="text-ink">{label}</p>
                                            {href ? (
                                                <a href={href} className="break-words text-sm text-body-2 hover:text-brand-2 hover:underline">
                                                    {value}
                                                </a>
                                            ) : (
                                                <p className="text-sm text-body-2">{value}</p>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="w-full rounded-lg border border-line p-6 sm:p-8 lg:max-w-xl">
                                <ContactForm />
                            </div>
                        </div>
                    </div>
                </section>

                <section aria-labelledby="coverage-heading">
                    <div className="mx-auto max-w-[1368px] px-5 py-16 sm:px-8">
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                            <div className="flex flex-col gap-4">
                                <SectionTag>Service Coverage</SectionTag>
                                <h2 id="coverage-heading" className="max-w-2xl text-4xl font-medium tracking-tight text-ink sm:text-5xl">
                                    {BUSINESS.serviceArea} Wide Coverage — Backed by Our Victorian Operations Base
                                </h2>
                            </div>
                            <p className="max-w-md text-body-2 lg:text-right">
                                Our head office is located in {BUSINESS.addressLocality}, {BUSINESS.addressRegion}, with dedicated
                                operational teams delivering commercial cleaning across Melbourne, Docklands, Dandenong, Geelong
                                and other regional hubs — extending to facilities across {BUSINESS.serviceArea}.
                            </p>
                        </div>
                    </div>

                    <div className="relative flex h-[500px] w-full flex-col items-center justify-center gap-4 bg-surface-muted sm:h-[600px]">
                        <MapPin size={40} className="text-brand-2" aria-hidden="true" />
                        <p className="text-lg font-medium text-ink">
                            {BUSINESS.streetAddress}, {BUSINESS.addressLocality} {BUSINESS.addressRegion} {BUSINESS.postalCode}
                        </p>
                        <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                `${BUSINESS.streetAddress}, ${BUSINESS.addressLocality} ${BUSINESS.addressRegion} ${BUSINESS.postalCode}, Australia`,
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-brand-2 hover:underline"
                        >
                            View on Google Maps
                        </a>
                    </div>
                </section>

                <section id="faq" aria-labelledby="faq-heading" className="bg-surface-muted">
                    <div className="mx-auto max-w-[1368px] px-5 py-16 sm:px-8">
                        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
                            <div className="flex flex-col justify-between gap-10">
                                <div className="flex flex-col gap-4">
                                    <SectionTag>FAQ</SectionTag>
                                    <h2 id="faq-heading" className="text-3xl font-medium tracking-tight text-ink sm:text-4xl">
                                        Clear answers for facility managers
                                    </h2>
                                </div>
                                <QuoteButton href={BUSINESS.phoneHref} icon={Phone} className="w-fit">
                                    Speak with Operations
                                </QuoteButton>
                            </div>

                            <FaqAccordion items={FAQ_ITEMS} />
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </>
    );
}
