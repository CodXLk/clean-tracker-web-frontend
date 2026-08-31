import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ChevronRight, Leaf, ShieldCheck, Settings2, Star } from "lucide-react";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { SectionTag } from "@/components/marketing/SectionTag";
import { QuoteButton } from "@/components/marketing/QuoteButton";
import { ProcessSteps } from "@/components/marketing/home/ProcessSteps";
import { Testimonials } from "@/components/marketing/home/Testimonials";
import { ComplianceCta } from "@/components/marketing/home/ComplianceCta";
import { BUSINESS } from "@/lib/constants/business";
import { PROJECTS } from "@/lib/constants/projects";

export const metadata: Metadata = {
    title: "About Us",
    description:
        "Primeway Property Services is a commercial cleaning company servicing businesses across Australia, established 2021. Learn about our team and approach.",
    alternates: { canonical: "/about" },
};

const INFO_BADGES = [
    { icon: ShieldCheck, label: "Police & VEVO Checked Staff" },
    { icon: Star, label: "Fully Insured ($20M Public Liability)" },
    { icon: Leaf, label: "Eco-Friendly Cleaning Solutions" },
] as const;

const SUPPORT_ITEMS = [
    "Scheduled commercial office and venue cleaning",
    "Hospital-grade disinfecting & infection control",
    "Educational, logistics, and manufacturing facility cleaning",
    "Carpet steam cleaning, window washing, and strip & seal floor care",
    "Biodegradable products, hygiene management & consumables supply",
] as const;

/** Real stock photography paired with role captions — never a fabricated personal name, see §22/§46 of the SEO guide. */
const TEAM_ROLES = [
    {
        photo: "/images/marketing/about/team-operations-lead.jpg",
        role: "Operations Lead",
        description: "Coordinates scheduling and day-to-day service delivery.",
    },
    {
        photo: "/images/marketing/about/team-senior-cleaning-specialist.jpg",
        role: "Senior Cleaning Specialist",
        description: "Delivers deep cleaning and hospital-grade disinfecting on-site.",
    },
    {
        photo: "/images/marketing/about/team-whs-safety-officer.jpg",
        role: "WHS & Safety Officer",
        description: "Oversees safe work procedures and site inductions.",
    },
    {
        photo: "/images/marketing/about/team-maintenance-equipment-lead.jpg",
        role: "Maintenance & Equipment Lead",
        description: "Keeps commercial-grade equipment serviced and ready.",
    },
    {
        photo: "/images/marketing/about/team-quality-control-supervisor.jpg",
        role: "Quality Control Supervisor",
        description: "Runs periodic audits and inspections.",
    },
    {
        photo: "/images/marketing/about/team-client-support-coordinator.jpg",
        role: "Client Support & Scheduling Coordinator",
        description: "Your point of contact for scheduling and requests.",
    },
] as const;

/** Large/small/small/large — matches the Figma masonry layout, in the same order as PROJECTS[0..3]. */
const FEATURED_PROJECTS = [
    { project: PROJECTS[0], photo: "/images/marketing/about/project-office-melbourne.jpg", size: "lg" },
    { project: PROJECTS[1], photo: "/images/marketing/about/project-apartment-docklands.jpg", size: "sm" },
    { project: PROJECTS[2], photo: "/images/marketing/about/project-window-dandenong.jpg", size: "sm" },
    { project: PROJECTS[3], photo: "/images/marketing/about/project-bathroom-geelong.jpg", size: "lg" },
] as const;

export default function AboutPage() {
    const yearsInOperation = new Date().getFullYear() - BUSINESS.foundedYear;

    return (
        <>
            <Navbar />
            <main>
                <section className="border-b border-line bg-surface-muted">
                    <div className="mx-auto max-w-[1368px] px-5 py-12 sm:px-8 sm:py-16">
                        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
                            <div className="flex flex-col gap-4">
                                <SectionTag>About Us</SectionTag>
                                <h1 className="max-w-3xl text-4xl font-medium tracking-tight text-ink sm:text-5xl lg:text-6xl">
                                    {BUSINESS.name}, Commercial Cleaners in {BUSINESS.serviceArea}
                                </h1>
                            </div>

                            <ul className="flex shrink-0 flex-col gap-3">
                                {INFO_BADGES.map(({ icon: Icon, label }) => (
                                    <li key={label} className="flex items-center gap-2 text-sm text-body-2">
                                        <Icon size={18} className="shrink-0 text-brand-2" aria-hidden="true" />
                                        {label}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="mt-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
                            <div className="flex flex-col gap-8 lg:w-[300px] lg:shrink-0">
                                <p className="text-body-2">
                                    Leading provider of commercial cleaning and property maintenance solutions across{" "}
                                    {BUSINESS.serviceArea}, delivering reliable, efficient, and hospital-grade cleaning services.
                                </p>
                                <QuoteButton href="/contact" className="w-fit">
                                    Request a Free Quote
                                </QuoteButton>
                            </div>

                            <div className="relative h-[280px] w-full overflow-hidden rounded-xl sm:h-[360px] lg:h-[420px] lg:flex-1">
                                <Image
                                    src="/images/marketing/about/hero-cleaning.jpg"
                                    alt="Primeway Property Services cleaner wiping down a surface"
                                    fill
                                    sizes="(min-width: 1024px) 60vw, 100vw"
                                    className="object-cover"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                <section aria-labelledby="experience-heading" className="mx-auto max-w-[1368px] px-5 py-16 sm:px-8">
                    <div className="grid gap-8 lg:grid-cols-[220px_1fr] lg:gap-16">
                        <SectionTag className="h-fit">Our Experience</SectionTag>
                        <div className="flex flex-col gap-8">
                            <p id="experience-heading" className="max-w-3xl text-2xl tracking-tight text-ink">
                                Since our establishment in {BUSINESS.foundedYear}, {BUSINESS.name} has rapidly grown to deliver
                                tailored commercial cleaning across {BUSINESS.serviceArea}.{" "}
                                <span className="text-body-2">
                                    Our trained cleaning teams fine-tune their processes to meet the strict safety, hygiene, and
                                    operational demands of commercial, healthcare, industrial, and educational facilities.
                                </span>
                            </p>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="relative h-[280px] overflow-hidden rounded-lg">
                                    <Image
                                        src="/images/marketing/about/experience-window-cleaning.jpg"
                                        alt="Cleaner wiping down a window"
                                        fill
                                        sizes="(min-width: 640px) 30vw, 90vw"
                                        className="object-cover"
                                    />
                                </div>
                                <div className="relative h-[280px] overflow-hidden rounded-lg">
                                    <Image
                                        src="/images/marketing/about/experience-floor-cleaning.jpg"
                                        alt="Cleaner scrubbing a hard floor"
                                        fill
                                        sizes="(min-width: 640px) 30vw, 90vw"
                                        className="object-cover"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section aria-labelledby="mission-heading" className="bg-surface-muted">
                    <div className="mx-auto max-w-[1368px] px-5 py-16 sm:px-8">
                        <div className="grid gap-8 lg:grid-cols-[220px_1fr] lg:gap-16">
                            <SectionTag className="h-fit">Our Mission &amp; Vision</SectionTag>
                            <div className="flex flex-col gap-8">
                                <p id="mission-heading" className="max-w-3xl text-2xl tracking-tight text-ink">
                                    Our mission is to redefine excellence in the cleaning industry by prioritising safety,
                                    delivering exceptional customer satisfaction, and building long-term partnerships.{" "}
                                    <span className="text-body-2">
                                        Our vision is to be {BUSINESS.serviceArea}&rsquo;s trusted industry leader recognised for
                                        quality service delivery, strict WHS compliance, and professional standards.
                                    </span>
                                </p>

                                <div className="flex flex-col gap-8 sm:flex-row sm:items-center">
                                    <QuoteButton href="/services" icon={Settings2} className="w-fit shrink-0">
                                        Explore Our Services
                                    </QuoteButton>

                                    <div className="flex flex-col gap-4">
                                        <h2 className="text-2xl font-medium tracking-tight text-ink">How We Support Your Facility</h2>
                                        <ul className="flex flex-col gap-3">
                                            {SUPPORT_ITEMS.map((item) => (
                                                <li key={item} className="flex items-start gap-2 text-body-2">
                                                    <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-full bg-brand-2" />
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section aria-labelledby="projects-heading" className="mx-auto max-w-[1368px] px-5 py-16 sm:px-8">
                    <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
                        <div className="flex flex-col gap-4">
                            <SectionTag>Recent Commercial Projects</SectionTag>
                            <h2 id="projects-heading" className="text-3xl font-medium tracking-tight text-ink sm:text-4xl">
                                Recent Commercial Projects Across {BUSINESS.serviceArea}
                            </h2>
                        </div>
                        <QuoteButton href="/projects" icon={ChevronRight} className="w-fit shrink-0">
                            View all Projects
                        </QuoteButton>
                    </div>

                    <div className="mt-10 flex flex-col gap-6">
                        <div className="flex flex-col gap-6 sm:flex-row">
                            <ProjectCard {...FEATURED_PROJECTS[0]} className="sm:flex-[1.4]" />
                            <ProjectCard {...FEATURED_PROJECTS[1]} className="sm:flex-1" />
                        </div>
                        <div className="flex flex-col gap-6 sm:flex-row">
                            <ProjectCard {...FEATURED_PROJECTS[2]} className="sm:flex-1" />
                            <ProjectCard {...FEATURED_PROJECTS[3]} className="sm:flex-[1.4]" />
                        </div>
                    </div>
                </section>

                <section aria-labelledby="team-heading" className="border-y border-line bg-surface-muted">
                    <div className="mx-auto max-w-[1368px] px-5 py-16 sm:px-8">
                        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
                            <div className="flex flex-col gap-4 lg:max-w-xs lg:shrink-0">
                                <SectionTag>Our Leadership &amp; Operations Team</SectionTag>
                                <h2 id="team-heading" className="text-3xl font-medium tracking-tight text-ink sm:text-4xl">
                                    The Team Delivering Commercial Excellence Across {BUSINESS.serviceArea}
                                </h2>
                            </div>

                            <ul className="grid gap-4 sm:grid-cols-3 lg:w-[70%]">
                                {TEAM_ROLES.slice(0, 3).map((member) => (
                                    <TeamCard key={member.role} {...member} />
                                ))}
                            </ul>
                        </div>

                        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <li className="flex h-[300px] flex-col items-center justify-center gap-1 rounded-lg border border-line-2 bg-white p-6 text-center sm:h-[360px]">
                                <p className="text-6xl font-medium tracking-tight text-ink sm:text-7xl">{yearsInOperation}+</p>
                                <p className="max-w-[200px] text-lg text-body-2">Years Serving Commercial Clients</p>
                            </li>
                            {TEAM_ROLES.slice(3, 6).map((member) => (
                                <TeamCard key={member.role} {...member} />
                            ))}
                        </ul>
                    </div>
                </section>

                <ProcessSteps />
                <Testimonials />
                <ComplianceCta />
            </main>
            <Footer />
        </>
    );
}

function TeamCard({ photo, role, description }: { photo: string; role: string; description: string }) {
    return (
        <li className="flex flex-col gap-4">
            <div className="relative h-[300px] w-full overflow-hidden rounded-lg sm:h-[360px]">
                <Image src={photo} alt={role} fill sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 90vw" className="object-cover" />
            </div>
            <div>
                <h3 className="text-lg font-medium text-ink">{role}</h3>
                <p className="text-sm text-body-2">{description}</p>
            </div>
        </li>
    );
}

function ProjectCard({
    project,
    photo,
    size,
    className = "",
}: {
    project: (typeof PROJECTS)[number];
    photo: string;
    size: "lg" | "sm";
    className?: string;
}) {
    return (
        <Link href={`/projects/${project.slug}`} className={`group flex flex-col gap-3 ${className}`}>
            <div className={`relative w-full overflow-hidden rounded-xl ${size === "lg" ? "h-[420px]" : "h-[300px] sm:h-[420px]"}`}>
                <Image
                    src={photo}
                    alt={`${project.title} — ${project.suburb}`}
                    fill
                    sizes="(min-width: 640px) 45vw, 100vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
            </div>
            <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg text-ink sm:text-xl">
                    {project.title} &ndash; {project.suburb}
                </h3>
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-line-2 text-ink transition-colors group-hover:border-brand-2 group-hover:text-brand-2">
                    <ArrowUpRight size={14} aria-hidden="true" />
                </span>
            </div>
        </Link>
    );
}
