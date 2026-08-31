import type { Metadata } from "next";
import { ArrowDownRight } from "lucide-react";
import { SectionTag } from "@/components/marketing/SectionTag";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { ServicesGrid } from "@/components/marketing/ServicesGrid";
import { ComplianceCta } from "@/components/marketing/home/ComplianceCta";
import { BUSINESS } from "@/lib/constants/business";

export const metadata: Metadata = {
    title: "Our Services",
    description:
        "Regular, deep, hospital-grade disinfecting, carpet steam and commercial window cleaning across Australia from Primeway Property Services.",
    alternates: { canonical: "/services" },
};

export default function ServicesPage() {
    return (
        <>
            <Navbar />
            <main>
                <section className="border-b border-line bg-surface-muted">
                    <div className="mx-auto max-w-[1368px] px-5 py-12 sm:px-8 sm:py-16">
                        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
                            <div className="flex flex-col gap-4 lg:max-w-4xl lg:flex-1">
                                <SectionTag>Our Services</SectionTag>
                                <h1 className="text-4xl font-medium tracking-tight text-ink sm:text-6xl">
                                    Commercial Cleaning Solutions Across {BUSINESS.serviceArea}
                                    <ArrowDownRight size={36} className="ml-2 hidden align-middle sm:inline" aria-hidden="true" />
                                </h1>
                            </div>
                            <p className="max-w-xs text-body-2 lg:mt-40">
                                From routine office care to specialised hospital-grade sanitisation, {BUSINESS.name} delivers
                                tailored commercial cleaning designed around your operational requirements.
                            </p>
                        </div>
                    </div>
                </section>

                <ServicesGrid />
                <ComplianceCta />
            </main>
            <Footer />
        </>
    );
}
