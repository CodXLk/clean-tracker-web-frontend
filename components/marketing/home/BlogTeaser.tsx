import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";
import { BLOG_POSTS } from "@/lib/constants/blog";
import { SectionTag } from "../SectionTag";
import { QuoteButton } from "../QuoteButton";

export function BlogTeaser() {
    return (
        <section aria-labelledby="blog-teaser-heading" className="bg-surface-muted">
            <div className="mx-auto max-w-[1368px] px-5 py-20 sm:px-8">
                <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
                    <div className="flex flex-col gap-2">
                        <SectionTag>Latest Insights</SectionTag>
                        <h2 id="blog-teaser-heading" className="max-w-md text-3xl font-medium tracking-tight text-ink sm:text-4xl">
                            Commercial Cleaning Guides &amp; Industry Insights
                        </h2>
                    </div>
                    <QuoteButton href="/blog" icon={ChevronRight}>
                        View All Articles
                    </QuoteButton>
                </div>

                <ul className="mt-10 grid gap-6 sm:grid-cols-2">
                    {BLOG_POSTS.map((post) => (
                        <li key={post.slug}>
                            <Link
                                href={`/blog/${post.slug}`}
                                className="group flex h-full overflow-hidden rounded-xl border border-line-2 bg-white"
                            >
                                <div className="relative aspect-square w-2/5 shrink-0 overflow-hidden sm:aspect-auto">
                                    <Image src={post.photo} alt={post.title} fill sizes="(min-width: 640px) 20vw, 40vw" className="object-cover" />
                                </div>
                                <div className="flex flex-1 flex-col justify-between gap-6 p-6">
                                    <div className="flex flex-col gap-3">
                                        <time dateTime={post.publishedAt} className="text-sm text-body-2">
                                            {new Date(post.publishedAt).toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" })}
                                        </time>
                                        <h3 className="text-xl font-medium text-ink">{post.title}</h3>
                                    </div>
                                    <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-line-2 px-4 py-2 text-sm text-body-2 transition-colors group-hover:border-brand-2 group-hover:text-brand-2">
                                        Read full blog
                                        <ArrowRight size={14} aria-hidden="true" />
                                    </span>
                                </div>
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}
