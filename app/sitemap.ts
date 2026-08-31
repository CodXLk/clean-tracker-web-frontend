import type { MetadataRoute } from "next";
import { BUSINESS } from "@/lib/constants/business";
import { SERVICES } from "@/lib/constants/marketing-services";
import { BLOG_POSTS } from "@/lib/constants/blog";
import { PROJECTS } from "@/lib/constants/projects";

/** Public, indexable marketing routes only — (auth), (protected) and /api are intentionally excluded. */
export default function sitemap(): MetadataRoute.Sitemap {
    const base = BUSINESS.siteUrl;
    const staticRoutes = ["/", "/about", "/services", "/industries", "/projects", "/blog", "/contact", "/privacy", "/terms", "/cookies"];

    return [
        ...staticRoutes.map((route) => ({ url: `${base}${route}` })),
        ...SERVICES.map((service) => ({ url: `${base}/services/${service.slug}` })),
        ...PROJECTS.map((project) => ({ url: `${base}/projects/${project.slug}` })),
        ...BLOG_POSTS.map((post) => ({ url: `${base}/blog/${post.slug}`, lastModified: post.publishedAt })),
    ];
}
