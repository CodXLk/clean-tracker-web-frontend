import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { QuoteButton } from "../QuoteButton";

/** Full-bleed banner between the FAQ and Footer — content aligned to the right. */
export function ComplianceCta() {
    return (
        <section className="relative min-h-[420px] overflow-hidden bg-ink sm:min-h-[560px]">
            <Image
                src="/images/marketing/home/compliance-cta-bg.jpg"
                alt="Cleaner maintaining a compliant commercial workplace"
                fill
                sizes="100vw"
                className="object-cover"
                style={{ transform: "scaleX(-1)" }}
            />
            <div aria-hidden="true" className="absolute inset-0 bg-ink/65" />

            <div className="relative mx-auto flex h-full max-w-[1368px] justify-end px-5 py-20 sm:px-8">
                <div className="flex max-w-xl flex-col gap-6 text-left">
                    <h2 className="text-3xl font-medium tracking-tight text-white sm:text-4xl">
                        Maintain a Safe, Hygienic &amp; Compliant Workplace
                    </h2>
                    <p className="text-white/80">
                        Partner with Primeway Property Services for reliable commercial cleaning and property
                        maintenance solutions tailored to your industry across Australia.
                    </p>
                    <QuoteButton href="/contact" icon={ChevronRight} className="w-fit">
                        Request a Free Quote
                    </QuoteButton>
                </div>
            </div>
        </section>
    );
}
