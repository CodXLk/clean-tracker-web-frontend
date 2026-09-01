import type { Metadata } from "next";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { PageHero } from "@/components/marketing/PageHero";
import { SectionTag } from "@/components/marketing/SectionTag";
import { QuoteButton } from "@/components/marketing/QuoteButton";
import { FaqAccordion } from "@/components/marketing/FaqAccordion";
import { JsonLd } from "@/components/marketing/JsonLd";
import { FAQ_ITEMS, HOME_FAQ_ITEMS, type FaqItem } from "@/lib/constants/faq";

export const metadata: Metadata = {
    title: "FAQs",
    description: "Answers to common questions about Primeway Property Services' commercial cleaning, compliance and scheduling.",
    alternates: { canonical: "/faq" },
};

const ALL_FAQ_ITEMS: FaqItem[] = [...FAQ_ITEMS, ...HOME_FAQ_ITEMS].filter(
    (item, i, all) => all.findIndex((other) => other.question === item.question) === i,
);

export default function FaqPage() {
    return (
        <>
            <JsonLd
                data={{
                    "@context": "https://schema.org",
                    "@type": "FAQPage",
                    mainEntity: ALL_FAQ_ITEMS.map((item) => ({
                        "@type": "Question",
                        name: item.question,
                        acceptedAnswer: { "@type": "Answer", text: item.answer },
                    })),
                }}
            />
            <Navbar />
            <main>
                <PageHero
                    eyebrow="FAQ"
                    title="Frequently Asked Questions"
                    description="Honest answers about our cleaning services, compliance and scheduling — no guesswork."
                    breadcrumbs={[{ label: "FAQs", href: "/faq" }]}
                />

                <section aria-labelledby="faq-heading" className="mx-auto max-w-[1368px] px-5 py-16 sm:px-8">
                    <div className="flex flex-col items-start gap-4">
                        <SectionTag>FAQ</SectionTag>
                        <h2 id="faq-heading" className="text-3xl font-medium tracking-tight text-ink sm:text-4xl">
                            Everything You Need to Know
                        </h2>
                    </div>
                    <div className="mt-8 max-w-3xl">
                        <FaqAccordion items={ALL_FAQ_ITEMS} />
                    </div>
                </section>

                <section className="bg-ink">
                    <div className="mx-auto flex max-w-[1368px] flex-col items-center gap-4 px-5 py-16 text-center sm:px-8">
                        <h2 className="text-2xl font-medium text-white sm:text-3xl">Still have a question?</h2>
                        <p className="max-w-xl text-white/75">Get in touch and our team will get back to you directly.</p>
                        <QuoteButton href="/contact" className="w-fit">
                            Contact Us
                        </QuoteButton>
                    </div>
                </section>
            </main>
            <Footer />
        </>
    );
}
