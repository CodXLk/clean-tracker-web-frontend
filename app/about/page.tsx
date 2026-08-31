import type { Metadata } from "next";
import Link from "next/link";
import { Leaf, ShieldCheck, Sparkles, Users } from "lucide-react";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { PageHero } from "@/components/marketing/PageHero";
import { SectionTag } from "@/components/marketing/SectionTag";
import { BUSINESS } from "@/lib/constants/business";
import { PROJECTS } from "@/lib/constants/projects";

export const metadata: Metadata = {
    title: "About Us",
    description:
        "Primeway Property Services is a commercial cleaning company servicing businesses across Australia, established 2021. Learn about our team and approach.",
    alternates: { canonical: "/about" },
};

const TRUST_BADGES = [
    { icon: ShieldCheck, label: "Police, WWCC & VEVO Checked Staff" },
    { icon: ShieldCheck, label: "Victorian Labour Hire Licence" },
    { icon: ShieldCheck, label: "$20 Million Public Liability & WorkCover" },
    { icon: Leaf, label: "Eco-Friendly Cleaning Solutions" },
] as const;

/** Role-based cards, not fabricated personal names — see §22/§46 of the SEO guide. */
const TEAM_ROLES = [
    { role: "Operations Lead", description: "Coordinates scheduling and day-to-day service delivery across all sites." },
    { role: "Senior Cleaning Specialists", description: "Deliver deep cleaning and hospital-grade disinfecting on-site." },
    { role: "Quality Control Supervisor", description: "Runs periodic audits and inspections to keep standards consistent." },
] as const;

export default function AboutPage() {
    const featuredProjects = PROJECTS.slice(0, 2);

    return (
        <>
            <Navbar />
            <main>
                <PageHero
                    eyebrow="About Us"
                    title={`About ${BUSINESS.name}`}
                    description={`Established in ${BUSINESS.foundedYear}, we provide commercial cleaning services across ${BUSINESS.serviceArea} for a wide range of industry sectors.`}
                    breadcrumbs={[{ label: "About Us", href: "/about" }]}
                />

                <section className="mx-auto max-w-[1368px] px-5 py-16 sm:px-8">
                    <div className="grid gap-10 lg:grid-cols-2">
                        <div className="flex flex-col gap-4">
                            <SectionTag>Who We Are</SectionTag>
                            <h2 className="text-3xl font-medium tracking-tight text-ink sm:text-4xl">
                                Reliable commercial cleaning, backed by strong operational support
                            </h2>
                            <p className="text-body-2">
                                {BUSINESS.name} delivers scheduled commercial office and venue cleaning, along with
                                specialised services for educational, logistics, healthcare and manufacturing
                                facilities across {BUSINESS.serviceArea}. We customise every cleaning program to suit
                                the client&rsquo;s operational requirements, schedules, and industry standards.
                            </p>
                            <p className="text-body-2">
                                Our team is a consistent, vetted crew backed by a dedicated account manager — so your
                                facility gets the same standard of service every visit.
                            </p>
                        </div>

                        <ul className="grid gap-4 sm:grid-cols-2">
                            {TRUST_BADGES.map(({ icon: Icon, label }) => (
                                <li key={label} className="flex items-center gap-3 rounded-xl border border-line p-5">
                                    <Icon size={22} className="shrink-0 text-brand-2" aria-hidden="true" />
                                    <span className="text-sm font-medium text-ink">{label}</span>
                                </li>
                            ))}
                            <li className="flex items-center gap-3 rounded-xl border border-line p-5">
                                <Sparkles size={22} className="shrink-0 text-brand-2" aria-hidden="true" />
                                <span className="text-sm font-medium text-ink">Est. {BUSINESS.foundedYear}</span>
                            </li>
                        </ul>
                    </div>
                </section>

                <section aria-labelledby="team-heading" className="bg-surface-muted">
                    <div className="mx-auto max-w-[1368px] px-5 py-16 sm:px-8">
                        <div className="flex flex-col items-center gap-4 text-center">
                            <SectionTag>Our Team</SectionTag>
                            <h2 id="team-heading" className="text-3xl font-medium tracking-tight text-ink sm:text-4xl">
                                A Consistent, Qualified Crew
                            </h2>
                        </div>
                        <ul className="mt-10 grid gap-6 sm:grid-cols-3">
                            {TEAM_ROLES.map((member) => (
                                <li key={member.role} className="rounded-xl border border-line-2 bg-white p-6 text-center">
                                    <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-brand-2/10 text-brand-2">
                                        <Users size={22} aria-hidden="true" />
                                    </span>
                                    <h3 className="mt-4 text-lg font-medium text-ink">{member.role}</h3>
                                    <p className="mt-2 text-sm text-body-2">{member.description}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>

                <section aria-labelledby="featured-work-heading" className="mx-auto max-w-[1368px] px-5 py-16 sm:px-8">
                    <div className="flex items-end justify-between gap-4">
                        <div className="flex flex-col gap-4">
                            <SectionTag>Recent Work</SectionTag>
                            <h2 id="featured-work-heading" className="text-3xl font-medium tracking-tight text-ink sm:text-4xl">
                                A Snapshot of Our Work
                            </h2>
                        </div>
                        <Link href="/projects" className="hidden text-sm font-medium text-brand-2 sm:inline-flex">
                            View all projects
                        </Link>
                    </div>

                    <ul className="mt-8 grid gap-6 sm:grid-cols-2">
                        {featuredProjects.map((project) => (
                            <li key={project.slug}>
                                <Link
                                    href={`/projects/${project.slug}`}
                                    className="block rounded-xl border border-line-2 p-6 transition-colors hover:border-brand-2"
                                >
                                    <h3 className="text-lg font-medium text-ink">
                                        {project.title} — {project.suburb}
                                    </h3>
                                    <p className="mt-2 text-sm text-body-2">{project.summary}</p>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </section>

                <section className="bg-ink">
                    <div className="mx-auto flex max-w-[1368px] flex-col items-center gap-4 px-5 py-16 text-center sm:px-8">
                        <h2 className="text-2xl font-medium text-white sm:text-3xl">Ready to talk about your facility?</h2>
                        <Link
                            href="/contact"
                            className="inline-flex items-center rounded-full bg-brand-2 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-2-dark"
                        >
                            Request a Quote
                        </Link>
                    </div>
                </section>
            </main>
            <Footer />
        </>
    );
}
