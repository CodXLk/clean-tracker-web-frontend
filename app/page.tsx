import type { Metadata } from "next";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { JsonLd } from "@/components/marketing/JsonLd";
import { Hero } from "@/components/marketing/home/Hero";
import { WhyChooseUs } from "@/components/marketing/home/WhyChooseUs";
import { BeforeAfterGallery } from "@/components/marketing/home/BeforeAfterGallery";
import { ProcessSteps } from "@/components/marketing/home/ProcessSteps";
import { ServicesShowcase } from "@/components/marketing/home/ServicesShowcase";
import { Testimonials } from "@/components/marketing/home/Testimonials";
import { BlogTeaser } from "@/components/marketing/home/BlogTeaser";
import { HomeFaq } from "@/components/marketing/home/HomeFaq";
import { ComplianceCta } from "@/components/marketing/home/ComplianceCta";
import { BUSINESS } from "@/lib/constants/business";

export const metadata: Metadata = {
    title: "Commercial Cleaning Services in Australia",
    description:
        "Primeway Property Services provides regular, deep, disinfecting, carpet and window commercial cleaning across Australia. Request a free quote today.",
    alternates: { canonical: "/" },
};

export default function HomePage() {
    return (
        <>
            <JsonLd
                data={{
                    "@context": "https://schema.org",
                    "@type": "LocalBusiness",
                    name: BUSINESS.name,
                    telephone: BUSINESS.phone,
                    email: BUSINESS.email,
                    url: BUSINESS.siteUrl,
                    address: {
                        "@type": "PostalAddress",
                        streetAddress: BUSINESS.streetAddress,
                        addressLocality: BUSINESS.addressLocality,
                        addressRegion: BUSINESS.addressRegion,
                        postalCode: BUSINESS.postalCode,
                        addressCountry: BUSINESS.addressCountry,
                    },
                    areaServed: BUSINESS.serviceArea,
                    foundingDate: String(BUSINESS.foundedYear),
                }}
            />
            <Navbar />
            <main>
                <Hero />
                <WhyChooseUs />
                <BeforeAfterGallery />
                <ProcessSteps />
                <ServicesShowcase />
                <Testimonials />
                <BlogTeaser />
                <HomeFaq />
                <ComplianceCta />
            </main>
            <Footer />
        </>
    );
}
