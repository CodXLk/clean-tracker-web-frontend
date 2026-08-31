import type { Metadata } from "next";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { PageHero } from "@/components/marketing/PageHero";
import { BUSINESS } from "@/lib/constants/business";

export const metadata: Metadata = {
    title: "Cookies Policy",
    description: `How ${BUSINESS.name} uses cookies on this website.`,
    alternates: { canonical: "/cookies" },
};

export default function CookiesPage() {
    return (
        <>
            <Navbar />
            <main>
                <PageHero title="Cookies Policy" breadcrumbs={[{ label: "Cookies Policy", href: "/cookies" }]} />
                <section className="mx-auto max-w-2xl px-5 py-16 text-body-2 sm:px-8">
                    <p>
                        This page will explain how {BUSINESS.name} uses cookies on this website. Final policy
                        content is being prepared — for questions in the meantime, contact us at{" "}
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
