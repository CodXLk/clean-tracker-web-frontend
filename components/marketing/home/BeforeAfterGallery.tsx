import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { SectionTag } from "../SectionTag";

const GALLERY = [
    {
        title: "Hospital-Grade Deep Cleaning",
        before: "/images/marketing/home/deep-cleaning-before.jpg",
        after: "/images/marketing/home/deep-cleaning-after.jpg",
    },
    {
        title: "Tile & Grout Cleaning",
        before: "/images/marketing/home/tile-grout-before.jpg",
        after: "/images/marketing/home/tile-grout-after.jpg",
    },
    {
        title: "Commercial Window Cleaning",
        before: "/images/marketing/home/window-cleaning-before.jpg",
        after: "/images/marketing/home/window-cleaning-after.jpg",
    },
    {
        title: "Floor Scrubbing, Strip & Seal",
        before: "/images/marketing/home/floor-scrub-before.jpg",
        after: "/images/marketing/home/floor-scrub-after.jpg",
    },
    {
        title: "Periodical Maintenance Cleaning",
        before: "/images/marketing/home/periodical-cleaning-before.jpg",
        after: "/images/marketing/home/periodical-cleaning-after.jpg",
    },
    {
        title: "Carpet Steam Cleaning",
        before: "/images/marketing/home/carpet-cleaning-before.jpg",
        after: "/images/marketing/home/carpet-cleaning-after.jpg",
    },
] as const;

/** A seamless split image (no gap) with a static drag-handle icon on the seam — visible and indexable without slider JS. */
export function BeforeAfterGallery() {
    return (
        <section aria-labelledby="gallery-heading" className="bg-surface-muted">
            <div className="mx-auto max-w-[1368px] px-5 py-20 sm:px-8">
                <div className="flex flex-col items-start gap-4 text-left">
                    <SectionTag>Specialised Cleaning Projects</SectionTag>
                    <h2 id="gallery-heading" className="text-3xl font-medium tracking-tight text-ink sm:text-4xl">
                        Trusted Commercial Cleaning Across Australia
                    </h2>
                </div>

                <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {GALLERY.map((item) => (
                        <li key={item.title} className="flex flex-col gap-3">
                            <div className="relative flex aspect-[89/104] overflow-hidden rounded-xl border border-line-2 bg-white">
                                <div className="relative h-full w-1/2">
                                    <Image src={item.before} alt={`${item.title} — before`} fill sizes="(min-width: 1024px) 15vw, (min-width: 640px) 22vw, 37vw" className="object-cover" />
                                </div>
                                <div className="relative h-full w-1/2">
                                    <Image src={item.after} alt={`${item.title} — after`} fill sizes="(min-width: 1024px) 15vw, (min-width: 640px) 22vw, 37vw" className="object-cover" />
                                </div>

                                <span className="absolute left-2.5 top-2.5 rounded-md bg-ink px-3 py-1 text-sm text-white">Before</span>
                                <span className="absolute right-2.5 top-2.5 rounded-md bg-ink px-3 py-1 text-sm text-white">After</span>

                                <div aria-hidden="true" className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-white" />
                                <div
                                    aria-hidden="true"
                                    className="absolute left-1/2 top-1/2 flex size-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-0.5 rounded-full border border-line-2 bg-white shadow-md"
                                >
                                    <ChevronLeft size={14} className="text-ink" />
                                    <ChevronRight size={14} className="text-ink" />
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <p className="text-lg text-ink">{item.title}</p>
                                <span className="flex items-center gap-1 text-sm text-body-2">
                                    <MapPin size={16} aria-hidden="true" />
                                    Australia
                                </span>
                            </div>
                        </li>
                    ))}
                </ul>

                <div className="mt-10 flex justify-center">
                    <Link
                        href="/contact"
                        className="inline-flex items-center rounded-full bg-brand-2 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-2-dark"
                    >
                        Request a Consultation
                    </Link>
                </div>
            </div>
        </section>
    );
}
