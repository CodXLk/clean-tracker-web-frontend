import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, MapPin } from "lucide-react";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { PageHero } from "@/components/marketing/PageHero";
import { PROJECTS, getProjectBySlug } from "@/lib/constants/projects";

interface Props {
    params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
    return PROJECTS.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const project = getProjectBySlug(slug);
    if (!project) return {};

    return {
        title: `${project.title} — ${project.suburb}`,
        description: project.summary,
        alternates: { canonical: `/projects/${project.slug}` },
    };
}

export default async function ProjectDetailPage({ params }: Props) {
    const { slug } = await params;
    const project = getProjectBySlug(slug);
    if (!project) notFound();

    return (
        <>
            <Navbar />
            <main>
                <PageHero
                    eyebrow="Our Projects"
                    title={project.title}
                    description={project.summary}
                    breadcrumbs={[
                        { label: "Our Projects", href: "/projects" },
                        { label: project.title, href: `/projects/${project.slug}` },
                    ]}
                />

                <section className="mx-auto max-w-[1368px] px-5 py-16 sm:px-8">
                    <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
                        <div>
                            <h2 className="text-2xl font-medium text-ink">Scope of Work</h2>
                            <ul className="mt-6 flex flex-col gap-3">
                                {project.scopeOfWork.map((item) => (
                                    <li key={item} className="flex items-start gap-2.5 text-body-2">
                                        <Check size={18} className="mt-0.5 shrink-0 text-brand-2" aria-hidden="true" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <aside className="flex flex-col gap-4 rounded-xl border border-line p-6">
                            <span className="flex items-center gap-1.5 text-sm text-body-2">
                                <MapPin size={16} aria-hidden="true" />
                                {project.suburb}, Victoria
                            </span>
                            <h2 className="text-lg font-medium text-ink">Have a similar facility?</h2>
                            <Link
                                href="/contact"
                                className="inline-flex items-center justify-center rounded-full bg-brand-2 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-2-dark"
                            >
                                Request a Quote
                            </Link>
                        </aside>
                    </div>
                </section>
            </main>
            <Footer />
        </>
    );
}
