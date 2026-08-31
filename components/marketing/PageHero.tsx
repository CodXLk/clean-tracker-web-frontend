import type { Crumb } from "./Breadcrumbs";
import { Breadcrumbs } from "./Breadcrumbs";

interface PageHeroProps {
    eyebrow?: string;
    title: string;
    description?: string;
    breadcrumbs: Crumb[];
}

/** Shared H1 header for every inner page (About, Services, Industries, Projects, Blog, Contact). */
export function PageHero({ eyebrow, title, description, breadcrumbs }: PageHeroProps) {
    return (
        <section className="border-b border-line bg-surface-muted">
            <div className="mx-auto flex max-w-[1368px] flex-col gap-4 px-5 py-12 sm:px-8 sm:py-16">
                <Breadcrumbs items={breadcrumbs} />
                {eyebrow && <p className="text-sm font-medium text-brand-2">{eyebrow}</p>}
                <h1 className="max-w-3xl text-4xl font-medium tracking-tight text-ink sm:text-5xl">{title}</h1>
                {description && <p className="max-w-2xl text-lg text-body-2">{description}</p>}
            </div>
        </section>
    );
}
