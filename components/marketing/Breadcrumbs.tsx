import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { BUSINESS } from "@/lib/constants/business";
import { JsonLd } from "./JsonLd";

export interface Crumb {
    label: string;
    href: string;
}

/** Visible breadcrumb trail + matching BreadcrumbList structured data. Omit on Home. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
    const trail: Crumb[] = [{ label: "Home", href: "/" }, ...items];

    return (
        <>
            <nav aria-label="Breadcrumb" className="text-sm text-body-2">
                <ol className="flex flex-wrap items-center gap-1.5">
                    {trail.map((crumb, i) => {
                        const isLast = i === trail.length - 1;
                        return (
                            <li key={crumb.href} className="flex items-center gap-1.5">
                                {i > 0 && <ChevronRight size={14} aria-hidden="true" className="text-line-2" />}
                                {isLast ? (
                                    <span aria-current="page" className="font-medium text-ink">
                                        {crumb.label}
                                    </span>
                                ) : (
                                    <Link href={crumb.href} className="hover:text-brand-2 hover:underline">
                                        {crumb.label}
                                    </Link>
                                )}
                            </li>
                        );
                    })}
                </ol>
            </nav>
            <JsonLd
                data={{
                    "@context": "https://schema.org",
                    "@type": "BreadcrumbList",
                    itemListElement: trail.map((crumb, i) => ({
                        "@type": "ListItem",
                        position: i + 1,
                        name: crumb.label,
                        item: `${BUSINESS.siteUrl}${crumb.href}`,
                    })),
                }}
            />
        </>
    );
}
