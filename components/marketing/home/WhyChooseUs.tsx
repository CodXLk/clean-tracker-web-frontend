import { Headset, Settings2, ShieldCheck, Tag } from "lucide-react";
import { SectionTag } from "../SectionTag";
import { QuoteButton } from "../QuoteButton";
import { BUSINESS } from "@/lib/constants/business";

const REASONS = [
    {
        icon: ShieldCheck,
        title: "Highly Skilled & Verified Team",
        description:
            "Our professional, uniformed staff undergo strict Police Checks, VEVO work rights checks, and comprehensive safety inductions.",
    },
    {
        icon: Tag,
        title: "Flexible Service Scheduling",
        description:
            "We customise our cleaning schedules to meet your operational requirements, ensuring minimal disruption to your business.",
    },
    {
        icon: Settings2,
        title: "Continuous Quality Assurance",
        description:
            "We continuously monitor our cleaning processes through periodic audits and digital inspections to ensure strict compliance and service consistency.",
    },
    {
        icon: Headset,
        title: "Fast Client Response",
        description:
            "We pride ourselves on responding promptly and efficiently to client requests, concerns, and changing operational requirements.",
    },
] as const;

/** Full compliance detail now lives on its own /compliance page — this section stays a general "why choose us" overview. */
export function WhyChooseUs() {
    return (
        <section aria-labelledby="why-choose-us-heading" className="mx-auto max-w-[1368px] px-5 py-20 sm:px-8">
            <div className="grid gap-10 lg:grid-cols-[340px_1fr] lg:gap-16">
                <div className="flex flex-col justify-between gap-10">
                    <div className="flex flex-col gap-4">
                        <SectionTag>Why Choose {BUSINESS.name}</SectionTag>
                        <h2 id="why-choose-us-heading" className="text-3xl font-medium tracking-tight text-ink sm:text-4xl">
                            Tailored Commercial Cleaning Solutions
                        </h2>
                    </div>
                    <QuoteButton href="/services" icon={Settings2} className="w-fit">
                        View Our Specialised Services
                    </QuoteButton>
                </div>

                <div className="flex flex-col gap-8">
                    <p className="max-w-xl text-body-2">
                        {BUSINESS.name} delivers reliable, professional, and high-quality cleaning services backed by
                        strong operational support. We customise our cleaning programs to suit your exact operational
                        requirements, schedules, and industry standards.
                    </p>

                    <ul className="grid gap-4 sm:grid-cols-2">
                        {REASONS.map(({ icon: Icon, title, description }) => (
                            <li key={title} className="rounded-xl border border-line p-6">
                                <div className="flex items-center gap-3">
                                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-2/10 text-brand-2">
                                        <Icon size={18} aria-hidden="true" />
                                    </span>
                                    <h3 className="text-lg font-medium text-ink">{title}</h3>
                                </div>
                                <p className="mt-3 text-sm text-body-2">{description}</p>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </section>
    );
}
