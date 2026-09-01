import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { PageHero } from "@/components/marketing/PageHero";
import { PROJECTS } from "@/lib/constants/projects";

export const metadata: Metadata = {
    title: "Our Projects",
    description:
        "Commercial cleaning solutions across key sectors in Australia — a snapshot of the facilities Primeway Property Services works with.",
    alternates: { canonical: "/projects" },
};

export default function ProjectsPage() {
    return (
        <>
            <Navbar />
            <main>
                <PageHero
                    eyebrow="Our Projects"
                    title="Commercial Cleaning Solutions Across Key Sectors in Australia"
                    description="From routine office care to specialised sanitisation, here's a snapshot of the work we do across Australia."
                    breadcrumbs={[{ label: "Our Projects", href: "/projects" }]}
                />

                <section className="mx-auto max-w-[1368px] px-5 py-16 sm:px-8">
                    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {PROJECTS.map((project) => (
                            <li key={project.slug}>
                                <Link
                                    href={`/projects/${project.slug}`}
                                    className="group flex h-full flex-col gap-3 rounded-xl border border-line-2 p-6 transition-colors hover:border-brand-2"
                                >
                                    <span className="flex items-center gap-1.5 text-sm text-body-2">
                                        <MapPin size={15} aria-hidden="true" />
                                        {project.suburb}
                                    </span>
                                    <h2 className="text-lg font-medium text-ink">{project.title}</h2>
                                    <p className="flex-1 text-sm text-body-2">{project.summary}</p>
                                    <span className="inline-flex items-center gap-1 text-sm font-medium text-brand-2">
                                        View project
                                        <ArrowRight size={16} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" />
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </section>
            </main>
            <Footer />
        </>
    );
}
