import type { Metadata } from "next";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { PageHero } from "@/components/marketing/PageHero";
import { BUSINESS } from "@/lib/constants/business";

export const metadata: Metadata = {
    title: "Terms & Conditions",
    description: `The terms and conditions for using ${BUSINESS.name}'s website and services.`,
    alternates: { canonical: "/terms" },
};

export default function TermsPage() {
    return (
        <>
            <Navbar />
            <main>
                <PageHero title="Terms &amp; Conditions" breadcrumbs={[{ label: "Terms & Conditions", href: "/terms" }]} />
                <section className="mx-auto max-w-2xl px-5 py-16 text-body-2 sm:px-8">
                    <p>
                        This page will set out the terms and conditions for using this website and engaging{" "}
                        {BUSINESS.legalName} (trading as {BUSINESS.tradingAs}) for commercial cleaning services.
                        Final terms are being prepared — for questions in the meantime, contact us at{" "}
                        <a href={BUSINESS.emailHref} className="font-medium text-brand-2 hover:underline">
                            {BUSINESS.email}
                        </a>
                        .
                    </p>
                </section>
            </main>
            <Footer />
        </>
    );
}
