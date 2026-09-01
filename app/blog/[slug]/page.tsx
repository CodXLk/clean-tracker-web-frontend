import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { PageHero } from "@/components/marketing/PageHero";
import { JsonLd } from "@/components/marketing/JsonLd";
import { BLOG_POSTS, getBlogPostBySlug } from "@/lib/constants/blog";
import { BUSINESS } from "@/lib/constants/business";

interface Props {
    params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
    return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const post = getBlogPostBySlug(slug);
    if (!post) return {};

    return {
        title: post.title,
        description: post.excerpt,
        alternates: { canonical: `/blog/${post.slug}` },
    };
}

export default async function BlogDetailPage({ params }: Props) {
    const { slug } = await params;
    const post = getBlogPostBySlug(slug);
    if (!post) notFound();

    const related = BLOG_POSTS.filter((p) => p.slug !== post.slug).slice(0, 2);

    return (
        <>
            <JsonLd
                data={{
                    "@context": "https://schema.org",
                    "@type": "BlogPosting",
                    headline: post.title,
                    description: post.excerpt,
                    datePublished: post.publishedAt,
                    author: { "@type": "Organization", name: BUSINESS.name },
                }}
            />
            <Navbar />
            <main>
                <PageHero
                    eyebrow={post.category}
                    title={post.title}
                    description={post.excerpt}
                    breadcrumbs={[
                        { label: "Latest Insights", href: "/blog" },
                        { label: post.title, href: `/blog/${post.slug}` },
                    ]}
                />

                <article className="mx-auto max-w-2xl px-5 py-16 sm:px-8">
                    <div className="relative mb-8 aspect-[16/9] overflow-hidden rounded-xl">
                        <Image src={post.photo} alt={post.title} fill sizes="(min-width: 768px) 42rem, 100vw" className="object-cover" priority />
                    </div>
                    <p className="text-sm text-body-2">
                        Published{" "}
                        <time dateTime={post.publishedAt}>
                            {new Date(post.publishedAt).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}
                        </time>
                    </p>
                    <p className="mt-6 rounded-xl border border-dashed border-line-2 bg-surface-muted p-6 text-body-2">
                        Full article content for this post is coming soon. In the meantime, get in touch with our
                        team if you have questions about {post.category.toLowerCase()}.
                    </p>

                    <div className="mt-10 flex flex-wrap gap-3">
                        {related.map((r) => (
                            <Link
                                key={r.slug}
                                href={`/blog/${r.slug}`}
                                className="rounded-full border border-line-2 px-4 py-2 text-sm text-ink hover:border-brand-2 hover:text-brand-2"
                            >
                                {r.title}
                            </Link>
                        ))}
                    </div>
                </article>
            </main>
            <Footer />
        </>
    );
}
