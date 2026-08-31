import type { LucideIcon } from "lucide-react";
import { Building2, Droplets, ShieldCheck, Sparkles, AppWindow, SprayCan, Layers, Wind } from "lucide-react";

export interface ServiceDefinition {
    slug: string;
    name: string;
    /** Card/teaser copy — one sentence, matches the Figma Home showcase caption where shown. */
    shortDescription: string;
    /** Service page intro paragraph. */
    description: string;
    /** Unique per-page <meta name="description">. */
    metaDescription: string;
    icon: LucideIcon;
    /** Path under /public — only the 7 services featured in the Figma Home showcase have one. */
    photo?: string;
    /** "What's included" bullets for the service detail page. */
    included: string[];
}

/** The 8 services Primeway offers (Home showcase + footer) — single source of truth for nav, footer, home grid and /services/[slug]. */
export const SERVICES: ServiceDefinition[] = [
    {
        slug: "regular-commercial-cleaning",
        name: "Regular Commercial Cleaning",
        shortDescription: "Scheduled cleaning programs designed for offices, education, retail, and commercial facilities across Australia.",
        description:
            "Our regular commercial cleaning service covers the day-to-day upkeep of offices, retail spaces and facilities across Australia — set to a schedule that fits your operating hours and budget.",
        metaDescription:
            "Regular commercial cleaning across Australia from Primeway Property Services. Scheduled office and facility cleaning tailored to your operating hours.",
        icon: Building2,
        photo: "/images/marketing/home/service-regular-cleaning.jpg",
        included: [
            "Daily, weekly or custom-frequency visits",
            "Desks, common areas, kitchens and amenities",
            "Rubbish removal and consumable restocking",
            "Consistent crew assigned to your site",
        ],
    },
    {
        slug: "deep-cleaning",
        name: "Deep Cleaning Services",
        shortDescription:
            "Comprehensive deep cleaning solutions tailored to maintain high standards of hygiene across commercial and industrial spaces.",
        description:
            "Deep cleaning targets the build-up regular cleaning doesn't reach — skirting, vents, hard-to-access surfaces and high-traffic zones — on a periodic schedule that suits your facility.",
        metaDescription:
            "Deep cleaning services for commercial facilities in Australia. Periodic, intensive cleaning from Primeway Property Services.",
        icon: Sparkles,
        photo: "/images/marketing/home/service-deep-cleaning.jpg",
        included: [
            "Detailed clean of surfaces regular visits don't cover",
            "High-traffic zone and touch-point focus",
            "Scheduled periodically alongside regular cleaning",
            "Suitable for offices, retail and industrial sites",
        ],
    },
    {
        slug: "hospital-grade-disinfecting",
        name: "Hospital-Grade Disinfecting",
        shortDescription: "Infection control and sanitisation using hospital-grade disinfectants for medical, healthcare, and high-risk environments.",
        description:
            "Our hospital-grade disinfecting service is built for healthcare, aged care and other facilities where infection control matters — using hospital-grade products on high-touch surfaces and shared amenities.",
        metaDescription:
            "Hospital-grade disinfecting and sanitisation for healthcare, aged care and commercial facilities in Australia.",
        icon: ShieldCheck,
        photo: "/images/marketing/home/service-disinfecting.jpg",
        included: [
            "Hospital-grade disinfectant on high-touch surfaces",
            "Amenities, breakrooms and shared-equipment sanitisation",
            "Suited to healthcare, aged care and childcare facilities",
            "Compliant with workplace health and safety requirements",
        ],
    },
    {
        slug: "carpet-steam-cleaning",
        name: "Carpet Steam Cleaning",
        shortDescription: "Commercial-grade carpet steam cleaning to remove heavy dirt and bacteria while extending carpet life.",
        description:
            "Commercial carpet steam cleaning removes embedded dirt, stains and odours from carpeted offices and common areas, helping extend the life of your flooring between replacements.",
        metaDescription:
            "Commercial carpet steam cleaning for offices and facilities across Australia from Primeway Property Services.",
        icon: Droplets,
        photo: "/images/marketing/home/service-carpet.jpg",
        included: [
            "Hot water extraction (steam) cleaning",
            "Stain and high-traffic wear treatment",
            "Fast-drying process to limit facility downtime",
            "Available as a one-off or periodic service",
        ],
    },
    {
        slug: "floor-scrubbing-strip-and-seal",
        name: "Floor Scrubbing, Strip & Seal",
        shortDescription: "Professional hard floor care, stripping, sealing, and machine scrubbing to restore and protect commercial flooring.",
        description:
            "We restore and protect hard commercial flooring with machine scrubbing, stripping and sealing — extending the life of your floors and keeping them presentable between full restorations.",
        metaDescription: "Commercial floor scrubbing, stripping and sealing across Australia from Primeway Property Services.",
        icon: Layers,
        photo: "/images/marketing/home/service-floor-scrub.jpg",
        included: [
            "Machine floor scrubbing",
            "Strip and reseal for hard flooring",
            "Protective sealing to extend floor life",
            "Suitable for retail, office and industrial floors",
        ],
    },
    {
        slug: "commercial-window-cleaning",
        name: "Commercial Window Cleaning",
        shortDescription: "Internal and external window cleaning solutions, including high-access cleaning for commercial properties.",
        description:
            "Our commercial window cleaning service keeps internal glass partitions and external windows streak-free, improving natural light and first impressions for staff and visitors.",
        metaDescription:
            "Commercial window and glass cleaning for offices and facilities across Australia from Primeway Property Services.",
        icon: AppWindow,
        photo: "/images/marketing/home/service-window.jpg",
        included: [
            "Internal glass partition polishing",
            "External and high-access window cleaning",
            "Streak-free, professional-grade equipment",
            "Bundled with regular or deep cleaning visits",
        ],
    },
    {
        slug: "hygiene-services-and-consumables",
        name: "Hygiene Services & Consumables",
        shortDescription: "Complete hygiene management, washroom solutions, and ongoing supply of eco-friendly consumables for your facility.",
        description:
            "We manage washroom hygiene and keep your facility stocked with eco-friendly consumables — soap, paper products and sanitiser — as an ongoing service alongside your regular clean.",
        metaDescription: "Washroom hygiene services and eco-friendly consumable supply for commercial facilities in Australia.",
        icon: SprayCan,
        photo: "/images/marketing/home/service-hygiene.jpg",
        included: [
            "Washroom hygiene management",
            "Ongoing eco-friendly consumable supply",
            "Sanitiser and paper product restocking",
            "Scheduled alongside your regular clean",
        ],
    },
    {
        slug: "pressure-cleaning-and-building-soft-washes",
        name: "Pressure Cleaning & Building Soft Washes",
        shortDescription: "Exterior pressure cleaning and soft washing to keep building facades, walkways and car parks presentable.",
        description:
            "Our pressure cleaning and soft wash service covers exterior facades, walkways, car parks and signage — restoring first impressions without damaging surfaces.",
        metaDescription: "Exterior pressure cleaning and building soft washing for commercial properties in Australia.",
        icon: Wind,
        included: [
            "Building facade soft washing",
            "Walkway and car park pressure cleaning",
            "Signage and entryway cleaning",
            "Low-pressure technique for sensitive surfaces",
        ],
    },
];

export function getServiceBySlug(slug: string): ServiceDefinition | undefined {
    return SERVICES.find((service) => service.slug === slug);
}
