import type { Metadata } from "next";
import { Mail, MapPin, Phone } from "lucide-react";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { PageHero } from "@/components/marketing/PageHero";
import { SectionTag } from "@/components/marketing/SectionTag";
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
                <PageHero
                    eyebrow="Contact Us"
                    title="Request a Commercial Cleaning Quote"
                    description="Tell us about your facility and we'll get back to you with a tailored quote."
                    breadcrumbs={[{ label: "Contact Us", href: "/contact" }]}
                />

                <section className="mx-auto max-w-[1368px] px-5 py-16 sm:px-8">
                    <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
                        <div className="rounded-xl border border-line p-6 sm:p-8">
                            <ContactForm />
                        </div>

                        <aside className="flex flex-col gap-4">
                            <div className="rounded-xl border border-line p-6">
                                <h2 className="text-lg font-medium text-ink">Get in Touch</h2>
                                <ul className="mt-4 flex flex-col gap-3 text-sm text-body-2">
                                    <li className="flex items-center gap-2.5">
                                        <Phone size={16} className="text-brand-2" aria-hidden="true" />
                                        <a href={BUSINESS.phoneHref} className="hover:text-brand-2 hover:underline">
                                            {BUSINESS.phone}
                                        </a>
                                    </li>
                                    <li className="flex items-center gap-2.5">
                                        <Mail size={16} className="text-brand-2" aria-hidden="true" />
                                        <a href={BUSINESS.emailHref} className="break-all hover:text-brand-2 hover:underline">
                                            {BUSINESS.email}
                                        </a>
                                    </li>
                                    <li className="flex items-center gap-2.5">
                                        <MapPin size={16} className="text-brand-2" aria-hidden="true" />
                                        {BUSINESS.streetAddress}, {BUSINESS.addressLocality} {BUSINESS.addressRegion} {BUSINESS.postalCode}
                                    </li>
                                </ul>
                            </div>
                            <div className="rounded-xl bg-surface-muted p-6 text-sm text-body-2">
                                ABN {BUSINESS.abn}
                                <br />
                                Servicing {BUSINESS.serviceArea}
                            </div>
                        </aside>
                    </div>
                </section>

                <section id="faq" aria-labelledby="faq-heading" className="bg-surface-muted">
                    <div className="mx-auto max-w-[1368px] px-5 py-16 sm:px-8">
                        <div className="flex flex-col gap-4">
                            <SectionTag>FAQ</SectionTag>
                            <h2 id="faq-heading" className="text-3xl font-medium tracking-tight text-ink sm:text-4xl">
                                Honest Answers, No Guesswork
                            </h2>
                        </div>
                        <div className="mt-8 max-w-3xl">
                            <FaqAccordion items={FAQ_ITEMS} />
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </>
    );
}
