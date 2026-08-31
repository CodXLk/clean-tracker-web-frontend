import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowDownRight, ChevronRight } from "lucide-react";
import { SectionTag } from "@/components/marketing/SectionTag";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { ComplianceCta } from "@/components/marketing/home/ComplianceCta";
import { INDUSTRIES, type Industry } from "@/lib/constants/industries";
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
                <section className="border-b border-line bg-surface-muted">
                    <div className="mx-auto max-w-[1368px] px-5 py-12 sm:px-8 sm:py-16">
                        <div className="flex flex-col gap-4">
                            <SectionTag>Industries We Serve</SectionTag>
                            <h1 className="text-4xl font-medium tracking-tight text-ink sm:text-6xl">
                                Cleaning Expertise Across Industry Sectors
                                <ArrowDownRight size={36} className="ml-2 hidden align-middle sm:inline" aria-hidden="true" />
                            </h1>
                        </div>

                        <p className="mt-10 max-w-xl text-2xl tracking-tight text-body-2">
                            Since {BUSINESS.foundedYear}, we&rsquo;ve grown to serve a wide range of industry sectors across{" "}
                            {BUSINESS.serviceArea}, with cleaning programs tailored to each sector&rsquo;s standards.
                        </p>
                    </div>
                </section>

                <section aria-label="Industries we serve" className="mx-auto max-w-[1368px] px-5 py-16 sm:px-8">
                    <div className="flex flex-col gap-6">
                        {[0, 1, 2, 3, 4].map((rowIndex) => (
                            <div key={rowIndex} className="flex flex-col gap-6 sm:flex-row">
                                <IndustryCard industry={INDUSTRIES[rowIndex * 2]} />
                                <IndustryCard industry={INDUSTRIES[rowIndex * 2 + 1]} />
                            </div>
                        ))}
                    </div>
                </section>

                <ComplianceCta />
            </main>
            <Footer />
        </>
    );
}

function IndustryCard({ industry }: { industry: Industry }) {
    const Icon = industry.icon;

    return (
        <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-line sm:flex-row sm:h-[340px]">
            <div className="relative h-[220px] w-full shrink-0 sm:h-full sm:w-[280px]">
                <Image src={industry.photo} alt={industry.name} fill sizes="(min-width: 640px) 280px, 100vw" className="object-cover" />
            </div>
            <div className="flex flex-1 flex-col justify-between gap-6 p-6">
                <div className="flex flex-col gap-3">
                    <span className="flex size-10 items-center justify-center rounded-lg bg-brand-2/10 text-brand-2">
                        <Icon size={20} aria-hidden="true" />
                    </span>
                    <h2 className="text-2xl tracking-tight text-ink">{industry.name}</h2>
                </div>
                <Link
                    href="/contact"
                    className="inline-flex w-fit items-center gap-1.5 rounded-full border border-line px-4 py-2 text-sm text-body-2 transition-colors hover:border-brand-2 hover:text-brand-2"
                >
                    Request a quote
                    <ChevronRight size={16} aria-hidden="true" />
                </Link>
            </div>
        </div>
    );
}
