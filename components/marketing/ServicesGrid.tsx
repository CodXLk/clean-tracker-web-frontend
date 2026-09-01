import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SERVICES, type ServiceDefinition } from "@/lib/constants/marketing-services";

/** Real photography per service, matching the Figma gallery — see the service-detail `photo` field for the (different) hero crop. */
const GALLERY_PHOTOS: Record<string, string> = {
    "regular-commercial-cleaning": "/images/marketing/services/gallery-regular-commercial-cleaning.jpg",
    "deep-cleaning": "/images/marketing/services/gallery-deep-cleaning.jpg",
    "hospital-grade-disinfecting": "/images/marketing/services/gallery-hospital-grade-disinfecting.jpg",
    "carpet-steam-cleaning": "/images/marketing/services/gallery-carpet-steam-cleaning.jpg",
    "floor-scrubbing-strip-and-seal": "/images/marketing/services/gallery-floor-scrubbing-strip-and-seal.jpg",
    "commercial-window-cleaning": "/images/marketing/services/gallery-commercial-window-cleaning.jpg",
    "hygiene-services-and-consumables": "/images/marketing/services/gallery-hygiene-services-and-consumables.jpg",
    "pressure-cleaning-and-building-soft-washes": "/images/marketing/services/gallery-pressure-cleaning-and-building-soft-washes.jpg",
};

const ROWS = Array.from({ length: Math.ceil(SERVICES.length / 2) }, (_, i) => SERVICES.slice(i * 2, i * 2 + 2));

/** Large/small zig-zag masonry gallery, matching the Figma Projects/Services gallery layout. */
export function ServicesGrid() {
    return (
        <section aria-label="Our services" className="mx-auto max-w-[1368px] px-5 py-16 sm:px-8">
            <div className="flex flex-col gap-6">
                {ROWS.map((pair, rowIndex) => (
                    <div key={pair[0].slug} className="flex flex-col gap-6 sm:flex-row">
                        {pair.map((service, colIndex) => {
                            const isLarge = rowIndex % 2 === 0 ? colIndex === 0 : colIndex === 1;
                            return <GalleryCard key={service.slug} service={service} large={isLarge} />;
                        })}
                    </div>
                ))}
            </div>
        </section>
    );
}

function GalleryCard({ service, large }: { service: ServiceDefinition; large: boolean }) {
    return (
        <Link href={`/services/${service.slug}`} className={`group flex flex-col gap-3 ${large ? "sm:flex-[1.4]" : "sm:flex-1"}`}>
            <div className={`relative w-full overflow-hidden rounded-xl ${large ? "h-[420px]" : "h-[300px] sm:h-[420px]"}`}>
                <Image
                    src={GALLERY_PHOTOS[service.slug]}
                    alt={service.name}
                    fill
                    sizes="(min-width: 640px) 45vw, 100vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
            </div>
            <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg text-ink sm:text-xl">{service.name}</h3>
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-line-2 text-ink transition-colors group-hover:border-brand-2 group-hover:text-brand-2">
                    <ArrowUpRight size={14} aria-hidden="true" />
                </span>
            </div>
        </Link>
    );
}
