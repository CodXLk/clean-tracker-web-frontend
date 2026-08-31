import { ChevronRight } from "lucide-react";
import { SectionTag } from "../SectionTag";
import { FaqAccordion } from "../FaqAccordion";
import { JsonLd } from "../JsonLd";
import { QuoteButton } from "../QuoteButton";
import { HOME_FAQ_ITEMS } from "@/lib/constants/faq";

/** Home's own "Commercial Cleaning FAQs" — distinct from the FAQ set embedded on /contact. */
export function HomeFaq() {
    return (
        <section aria-labelledby="home-faq-heading" className="border-b border-line bg-surface-muted">
            <JsonLd
                data={{
                    "@context": "https://schema.org",
                    "@type": "FAQPage",
                    mainEntity: HOME_FAQ_ITEMS.map((item) => ({
                        "@type": "Question",
                        name: item.question,
                        acceptedAnswer: { "@type": "Answer", text: item.answer },
                    })),
                }}
            />
            <div className="mx-auto max-w-[1368px] px-5 py-20 sm:px-8">
                <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
                    <div className="flex flex-col justify-between gap-10">
                        <div className="flex flex-col gap-4">
                            <SectionTag>FAQ</SectionTag>
                            <h2 id="home-faq-heading" className="text-3xl font-medium tracking-tight text-ink sm:text-4xl">
                                Commercial Cleaning FAQs
                            </h2>
                        </div>
                        <QuoteButton href="/contact" icon={ChevronRight} className="w-fit">
                            Enquire With Our Team
                        </QuoteButton>
                    </div>

                    <FaqAccordion items={HOME_FAQ_ITEMS} />
                </div>
            </div>
        </section>
    );
}
