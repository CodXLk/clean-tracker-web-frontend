export interface ProjectCaseStudy {
    slug: string;
    title: string;
    suburb: string;
    summary: string;
    scopeOfWork: string[];
}

/**
 * Illustrative examples of the work Primeway does, grouped by sector and
 * suburb rather than named clients — no client names, quotes or figures are
 * invented. Replace with verified case studies (photos, real outcomes) as
 * they become available.
 */
export const PROJECTS: ProjectCaseStudy[] = [
    {
        slug: "corporate-office-cleaning-melbourne-cbd",
        title: "Corporate Office Facility Maintenance",
        suburb: "Melbourne CBD",
        summary:
            "Ongoing scheduled cleaning for a multi-tenant corporate office, covering breakrooms, amenities and shared common areas.",
        scopeOfWork: [
            "Hospital-grade sanitisation of high-traffic breakrooms, amenities and common areas",
            "Commercial carpet steam cleaning and high-touch workstation disinfection",
            "Internal glass partition polishing and streak-free window cleaning",
            "Commercial floor scrubbing, tile scrub-and-clean and protective sealing",
            "Eco-friendly, biodegradable cleaning chemicals with routine consumable restocking",
        ],
    },
    {
        slug: "multi-level-commercial-cleaning-docklands",
        title: "Multi-Level Commercial Cleaning",
        suburb: "Docklands",
        summary: "Scheduled cleaning across multiple floors of a commercial building, coordinated around tenant operating hours.",
        scopeOfWork: [
            "Daily servicing of lobbies, stairwells and shared facilities",
            "Regular commercial window and glass cleaning",
            "Rubbish removal and consumable restocking",
            "Periodic deep cleaning of common areas",
        ],
    },
    {
        slug: "logistics-warehousing-cleaning-dandenong",
        title: "Logistics & Warehousing Facility Cleaning",
        suburb: "Dandenong",
        summary: "Facility cleaning for a logistics and warehousing site, focused on amenities, offices and loading-adjacent areas.",
        scopeOfWork: [
            "Office and amenities cleaning on a scheduled basis",
            "Commercial floor cleaning across high-traffic zones",
            "Waste and recycling management",
        ],
    },
    {
        slug: "healthcare-medical-centre-sanitisation-geelong",
        title: "Healthcare & Medical Centre Sanitisation",
        suburb: "Geelong",
        summary: "Hospital-grade sanitisation for a medical facility, with an emphasis on infection control on high-touch surfaces.",
        scopeOfWork: [
            "Hospital-grade disinfection of consult rooms and shared equipment",
            "High-touch surface sanitisation (door handles, rails, reception)",
            "Compliant waste handling for clinical and general areas",
        ],
    },
    {
        slug: "educational-childcare-facility-cleaning-campbellfield",
        title: "Educational & Childcare Facility Cleaning",
        suburb: "Campbellfield",
        summary: "Cleaning for an education and childcare facility, prioritising child-safe products and hygiene standards.",
        scopeOfWork: [
            "Child-safe, eco-friendly cleaning products",
            "Classroom, amenities and play-area sanitisation",
            "Scheduled outside of operating hours where required",
        ],
    },
    {
        slug: "industrial-manufacturing-plant-cleaning-altona",
        title: "Industrial & Manufacturing Plant Cleaning",
        suburb: "Altona",
        summary: "Facility cleaning for an industrial and manufacturing plant, covering offices, amenities and common work areas.",
        scopeOfWork: [
            "Office and amenities cleaning on a scheduled basis",
            "Commercial floor scrubbing and protective sealing",
            "WHS-compliant cleaning practices for an industrial site",
        ],
    },
    {
        slug: "aged-care-retirement-facility-hygiene-frankston",
        title: "Aged Care & Retirement Facility Hygiene",
        suburb: "Frankston",
        summary: "Hygiene-focused cleaning for a retirement and aged care facility, with hospital-grade disinfection of shared spaces.",
        scopeOfWork: [
            "Hospital-grade disinfection of common and shared areas",
            "High-touch surface sanitisation",
            "Scheduled to minimise disruption to residents",
        ],
    },
];

export function getProjectBySlug(slug: string): ProjectCaseStudy | undefined {
    return PROJECTS.find((project) => project.slug === slug);
}
