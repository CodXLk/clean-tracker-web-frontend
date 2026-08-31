export interface BlogPost {
    slug: string;
    title: string;
    excerpt: string;
    category: string;
    /** ISO date string — matches the date shown next to each post in the Figma Home/Blog frames. */
    publishedAt: string;
    /** Path under /public — all 4 featured posts have one. */
    photo: string;
}

/**
 * The 4 posts featured on Home, titles/dates taken verbatim from the Figma
 * "Home page" and "Blog details page" frames. Excerpts are short and
 * genuine in scope; full article bodies are placeholders until real
 * long-form content is supplied — do not present them as published articles
 * until they are.
 */
export const BLOG_POSTS: BlogPost[] = [
    {
        slug: "hospital-grade-infection-control-sanitisation-standards",
        title: "Hospital-Grade Infection Control: Sanitisation Standards in Healthcare Facilities",
        excerpt: "What hospital-grade disinfection actually involves, and why it matters for healthcare and aged care facilities.",
        category: "Compliance",
        publishedAt: "2025-10-16",
        photo: "/images/marketing/home/blog-infection-control.jpg",
    },
    {
        slug: "sustainable-workplaces-eco-friendly-cleaning-practices",
        title: "Sustainable Workplaces: Implementing Eco-Friendly Cleaning Practices",
        excerpt: "How commercial facilities can reduce their environmental footprint through cleaning product and process choices.",
        category: "Sustainability",
        publishedAt: "2025-09-22",
        photo: "/images/marketing/home/blog-sustainable-workplaces.jpg",
    },
    {
        slug: "hard-floor-care-strip-and-seal-maintenance",
        title: "Hard Floor Care: Strip & Seal Maintenance for Commercial Properties",
        excerpt: "Why scheduled stripping and sealing extends the life of commercial hard flooring between full restorations.",
        category: "Facility Management",
        publishedAt: "2025-10-04",
        photo: "/images/marketing/home/blog-hard-floor-care.jpg",
    },
    {
        slug: "commercial-window-cleaning-safe-access-whs-compliance",
        title: "Commercial Window Cleaning: Safe Access & WHS Compliance Standards",
        excerpt: "What WHS-compliant, high-access window cleaning involves for multi-storey commercial buildings.",
        category: "Compliance",
        publishedAt: "2025-09-28",
        photo: "/images/marketing/home/blog-window-cleaning-whs.jpg",
    },
];

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
    return BLOG_POSTS.find((post) => post.slug === slug);
}
