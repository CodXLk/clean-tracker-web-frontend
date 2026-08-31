import type { Metadata } from "next";
import { BadgeCheck, ClipboardCheck, FileCheck2, HardHat, Landmark, Leaf, ShieldCheck, UserCheck } from "lucide-react";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { PageHero } from "@/components/marketing/PageHero";
import { SectionTag } from "@/components/marketing/SectionTag";
import { QuoteButton } from "@/components/marketing/QuoteButton";
import { FaqAccordion } from "@/components/marketing/FaqAccordion";
import { BUSINESS } from "@/lib/constants/business";
import { HOME_FAQ_ITEMS } from "@/lib/constants/faq";

export const metadata: Metadata = {
    title: "Compliance & Safety",
    description:
        "Primeway Property Services holds a Victorian Labour Hire Licence, $20 million Public Liability insurance and full WorkCover coverage, with police-checked, WWCC and VEVO-verified staff.",
    alternates: { canonical: "/compliance" },
};

const CREDENTIALS = [
    { icon: ShieldCheck, label: "Police-Checked Staff" },
    { icon: UserCheck, label: "Working With Children Checks (WWCC)" },
    { icon: FileCheck2, label: "VEVO Work Rights Verification" },
    { icon: Landmark, label: "Victorian Labour Hire Licence" },
    { icon: BadgeCheck, label: "$20 Million Public Liability Insurance" },
    { icon: HardHat, label: "Full WorkCover Coverage" },
    { icon: Leaf, label: "Eco-Friendly Cleaning Chemicals" },
    { icon: ClipboardCheck, label: "Regular Quality Audits & Inspections" },
] as const;

const REASONS = [
    {
        icon: ShieldCheck,
        title: "Vetted, Verified Staff",
        description: "Every team member passes Police Checks, WWCC and VEVO work rights verification before they're placed on-site.",
    },
    {
        icon: Landmark,
        title: "Licensed & Insured Operations",
        description:
            "We operate under a Victorian Labour Hire Licence, backed by $20 million Public Liability insurance and full WorkCover coverage.",
    },
    {
        icon: HardHat,
        title: "WHS-Compliant Practices",
        description: "Safety inductions and safe work procedures are followed on every site, for every visit.",
    },
    {
        icon: ClipboardCheck,
        title: "Continuous Quality Assurance",
        description: "Periodic supervisor audits and digital inspections confirm standards are met and maintained.",
    },
] as const;

export default function CompliancePage() {
    return (
        <>
            <Navbar />
            <main>
                <PageHero
                    eyebrow="Compliance & Safety"
                    title="Compliance & Safety You Can Rely On"
                    description={`${BUSINESS.name} holds the licensing, insurance and staff vetting needed to work safely and compliantly across ${BUSINESS.serviceArea}.`}
                    breadcrumbs={[{ label: "Compliance & Safety", href: "/compliance" }]}
                />

                <section aria-labelledby="credentials-heading" className="mx-auto max-w-[1368px] px-5 py-16 sm:px-8">
                    <div className="flex flex-col items-start gap-4">
                        <SectionTag>Our Credentials</SectionTag>
                        <h2 id="credentials-heading" className="text-3xl font-medium tracking-tight text-ink sm:text-4xl">
                            Licensed, Insured & Independently Verified
                        </h2>
                    </div>

                    <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {CREDENTIALS.map(({ icon: Icon, label }) => (
                            <li key={label} className="flex items-center gap-3 rounded-xl border border-line p-5">
                                <Icon size={22} className="shrink-0 text-brand-2" aria-hidden="true" />
                                <span className="text-sm font-medium text-ink">{label}</span>
                            </li>
                        ))}
                    </ul>
                </section>

                <section aria-labelledby="how-we-comply-heading" className="bg-surface-muted">
                    <div className="mx-auto max-w-[1368px] px-5 py-16 sm:px-8">
                        <div className="flex flex-col items-start gap-4">
                            <SectionTag>How We Stay Compliant</SectionTag>
                            <h2 id="how-we-comply-heading" className="text-3xl font-medium tracking-tight text-ink sm:text-4xl">
                                Compliance Built Into Every Visit
                            </h2>
                        </div>

                        <ul className="mt-10 grid gap-4 sm:grid-cols-2">
                            {REASONS.map(({ icon: Icon, title, description }) => (
                                <li key={title} className="rounded-xl border border-line bg-white p-6">
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
                </section>

                <section aria-labelledby="compliance-faq-heading" className="mx-auto max-w-[1368px] px-5 py-16 sm:px-8">
                    <div className="flex flex-col items-start gap-4">
                        <SectionTag>FAQ</SectionTag>
                        <h2 id="compliance-faq-heading" className="text-3xl font-medium tracking-tight text-ink sm:text-4xl">
                            Compliance Questions, Answered
                        </h2>
                    </div>
                    <div className="mt-8 max-w-3xl">
                        <FaqAccordion items={HOME_FAQ_ITEMS} />
                    </div>
                </section>

                <section className="bg-ink">
                    <div className="mx-auto flex max-w-[1368px] flex-col items-center gap-4 px-5 py-16 text-center sm:px-8">
                        <h2 className="text-2xl font-medium text-white sm:text-3xl">Need proof of compliance for a tender?</h2>
                        <p className="max-w-xl text-white/75">
                            Get in touch and we&rsquo;ll provide licensing and insurance documentation for your records.
                        </p>
                        <QuoteButton href="/contact" className="w-fit">
                            Request a Free Quote
                        </QuoteButton>
                    </div>
                </section>
            </main>
            <Footer />
        </>
    );
}
