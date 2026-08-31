import type { Metadata } from "next";
import { Star } from "lucide-react";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { PageHero } from "@/components/marketing/PageHero";
import { SectionTag } from "@/components/marketing/SectionTag";
import { QuoteButton } from "@/components/marketing/QuoteButton";
import { ReviewCard } from "@/components/marketing/ReviewCard";
import { REVIEW_ROLES } from "@/lib/constants/reviews";

export const metadata: Metadata = {
    title: "Reviews",
    description: "See what commercial cleaning clients across Australia say about Primeway Property Services.",
    alternates: { canonical: "/reviews" },
};

export default function ReviewsPage() {
    return (
        <>
            <Navbar />
            <main>
                <PageHero
                    eyebrow="Reviews"
                    title="What Our Clients Say"
                    description="Feedback from the facility managers, business owners and operators we work with across Australia."
                    breadcrumbs={[{ label: "Reviews", href: "/reviews" }]}
                />

                <section aria-labelledby="all-reviews-heading" className="mx-auto max-w-[1368px] px-5 py-16 sm:px-8">
                    <div className="flex flex-col items-start gap-4">
                        <SectionTag>Client Feedback</SectionTag>
                        <h2 id="all-reviews-heading" className="text-3xl font-medium tracking-tight text-ink sm:text-4xl">
                            Trusted by Facilities Across Every Industry
                        </h2>
                    </div>

                    <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {REVIEW_ROLES.map((role, i) => (
                            <ReviewCard key={i} role={role} className="w-full" />
                        ))}
                    </ul>
                </section>

                <section className="bg-ink">
                    <div className="mx-auto flex max-w-[1368px] flex-col items-center gap-4 px-5 py-16 text-center sm:px-8">
                        <span className="flex" aria-hidden="true">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <Star key={i} size={18} className="fill-brand-2 text-brand-2" />
                            ))}
                        </span>
                        <h2 className="text-2xl font-medium text-white sm:text-3xl">Ready to experience it yourself?</h2>
                        <p className="max-w-xl text-white/75">
                            Request a free quote and see why facilities across Australia trust us with their cleaning.
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
