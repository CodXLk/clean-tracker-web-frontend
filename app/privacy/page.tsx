import type { Metadata } from "next";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { PageHero } from "@/components/marketing/PageHero";
import { BUSINESS } from "@/lib/constants/business";

export const metadata: Metadata = {
    title: "Privacy Policy",
    description: `How ${BUSINESS.name} collects, uses and protects your information.`,
    alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
    return (
        <>
            <Navbar />
            <main>
                <PageHero title="Privacy Policy" breadcrumbs={[{ label: "Privacy Policy", href: "/privacy" }]} />
                <section className="mx-auto max-w-2xl px-5 py-16 text-body-2 sm:px-8">
                    <p>
                        This page will set out how {BUSINESS.name} collects, uses and protects personal
                        information submitted through this website (for example, via the contact form). Final
                        policy content is being prepared — for privacy questions in the meantime, contact us at{" "}
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
