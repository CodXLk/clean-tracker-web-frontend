import Image from "next/image";
import { ClipboardList, ShieldCheck, SquareCheckBig, Users } from "lucide-react";
import { SectionTag } from "../SectionTag";

const STEPS = [
    {
        icon: SquareCheckBig,
        title: "Request a Consultation",
        description: "Share your facility requirements, operational schedules, and specific industry standards with our team.",
    },
    {
        icon: ClipboardList,
        title: "Tailored Cleaning Plan",
        description: "We design a customized cleaning program aligned with your budget, facility needs, and WHS requirements.",
    },
    {
        icon: Users,
        title: "Qualified Team On-Site",
        description:
            "Our uniformed, police-checked cleaners arrive on schedule with commercial-grade equipment and eco-friendly products.",
    },
    {
        icon: ShieldCheck,
        title: "Continuous Quality Assurance",
        description:
            "Maintain a clean, safe workplace supported by regular supervisor audits, digital inspections, and fast client response.",
    },
] as const;

/** Two stacked step cards either side of a centred logo panel, matching the Figma 3-column layout. */
export function ProcessSteps() {
    const [step1, step2, step3, step4] = STEPS;

    return (
        <section aria-labelledby="process-heading" className="mx-auto max-w-[1368px] px-5 py-20 sm:px-8">
            <SectionTag>Our Cleaning Process</SectionTag>
            <h2 id="process-heading" className="mt-4 text-3xl font-medium tracking-tight text-ink sm:text-4xl">
                How We Deliver Tailored Commercial Cleaning
            </h2>

            <div className="mt-10 grid gap-4 lg:grid-cols-[1fr_1fr_1fr] lg:items-stretch">
                <div className="flex flex-col gap-4">
                    <StepCard {...step1} />
                    <StepCard {...step2} />
                </div>

                <div className="flex min-h-[220px] items-center justify-center rounded-lg border border-line">
                    <Image src="/images/marketing/brand/logo.png" alt="Primeway Property Services" width={254} height={114} className="h-auto w-40" />
                </div>

                <div className="flex flex-col gap-4">
                    <StepCard {...step3} />
                    <StepCard {...step4} />
                </div>
            </div>
        </section>
    );
}

function StepCard({ icon: Icon, title, description }: (typeof STEPS)[number]) {
    return (
        <div className="flex-1 rounded-lg border border-line px-4 py-6">
            <div className="flex items-center gap-2">
                <Icon size={24} className="shrink-0 text-brand-2" aria-hidden="true" />
                <h3 className="text-xl font-medium text-ink">{title}</h3>
            </div>
            <p className="mt-2 pl-8 text-sm text-body-2">{description}</p>
        </div>
    );
}
