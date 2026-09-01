import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { PageHero } from "@/components/marketing/PageHero";
import { BLOG_POSTS } from "@/lib/constants/blog";

export const metadata: Metadata = {
    title: "Latest Insights",
    description: "Cleaning industry insights, compliance guidance and sustainability practices from Primeway Property Services.",
    alternates: { canonical: "/blog" },
};

export default function BlogPage() {
    return (
        <>
            <Navbar />
            <main>
                <PageHero
                    eyebrow="Latest Insights"
                    title="Cleaning Industry Insights"
                    description="Practical guidance on compliance, sustainability and facility hygiene from the Primeway team."
                    breadcrumbs={[{ label: "Latest Insights", href: "/blog" }]}
                />

                <section className="mx-auto max-w-[1368px] px-5 py-16 sm:px-8">
                    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {BLOG_POSTS.map((post) => (
                            <li key={post.slug}>
                                <Link
                                    href={`/blog/${post.slug}`}
                                    className="group flex h-full flex-col gap-3 overflow-hidden rounded-xl border border-line-2 p-3 transition-colors hover:border-brand-2"
                                >
                                    <div className="relative aspect-[16/10] overflow-hidden rounded-lg">
                                        <Image
                                            src={post.photo}
                                            alt={post.title}
                                            fill
                                            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                                        />
                                    </div>
                                    <div className="flex flex-1 flex-col gap-2 px-1 pb-1">
                                        <span className="text-xs font-medium text-brand-2">{post.category}</span>
                                        <h2 className="text-lg font-medium text-ink">{post.title}</h2>
                                        <p className="flex-1 text-sm text-body-2">{post.excerpt}</p>
                                        <span className="inline-flex items-center gap-1 text-sm font-medium text-brand-2">
                                            Read full blog
                                            <ArrowRight size={16} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" />
                                        </span>
                                    </div>
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
