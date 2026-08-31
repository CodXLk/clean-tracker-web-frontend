import type { MetadataRoute } from "next";
import { BUSINESS } from "@/lib/constants/business";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            { userAgent: "*", allow: "/", disallow: ["/api/", "/dashboard", "/admin", "/login", "/register", "/forgot-password", "/setup-account"] },
        ],
        sitemap: `${BUSINESS.siteUrl}/sitemap.xml`,
    };
}
