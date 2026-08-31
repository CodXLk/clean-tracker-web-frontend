/**
 * Sample client reviews for the marketing site.
 * Shared between the Home page's Testimonials section and the dedicated /reviews page.
 * These are representative sample testimonials — swap individual entries for real,
 * attributed reviews as they come in (keep the same shape).
 */
export interface Review {
    name: string;
    role: string;
    serviceType: string;
    rating: number;
    quote: string;
    suburb: string;
    state: string;
    date: string;
}

export const REVIEWS: readonly Review[] = [
    {
        name: "Sarah Whitfield",
        role: "Facility Manager",
        serviceType: "Office Cleaning",
        rating: 5,
        quote: "The team has been spotless and reliable from day one. Our office has never looked better, and the reporting through the app means I always know exactly what was done.",
        suburb: "North Sydney",
        state: "NSW",
        date: "Aug 2026",
    },
    {
        name: "David Chen",
        role: "Property Owner",
        serviceType: "Strata Common Areas",
        rating: 5,
        quote: "Managing a large residential complex is a lot easier now. Communication is quick and the cleaners are thorough with the lobbies, lifts and car park every single week.",
        suburb: "Southbank",
        state: "VIC",
        date: "Aug 2026",
    },
    {
        name: "Emma Robertson",
        role: "Office Manager",
        serviceType: "Commercial Cleaning",
        rating: 5,
        quote: "Punctual, professional and genuinely easy to deal with. The staff notice the little details and our team regularly comments on how fresh the space feels.",
        suburb: "Fortitude Valley",
        state: "QLD",
        date: "Jul 2026",
    },
    {
        name: "Michael Nguyen",
        role: "Practice Manager",
        serviceType: "Medical Centre Cleaning",
        rating: 5,
        quote: "Hygiene standards in our clinic are non-negotiable and Primeway consistently meets them. Their attention to sanitising high-touch areas gives us real peace of mind.",
        suburb: "Adelaide CBD",
        state: "SA",
        date: "Jul 2026",
    },
    {
        name: "Jessica Taylor",
        role: "Retail Store Owner",
        serviceType: "Retail Cleaning",
        rating: 5,
        quote: "Our shopfront always looks presentable for opening. They work around our trading hours without any fuss and the results speak for themselves.",
        suburb: "Subiaco",
        state: "WA",
        date: "Jun 2026",
    },
    {
        name: "Andrew Peterson",
        role: "Strata Manager",
        serviceType: "Building Maintenance Cleaning",
        rating: 4,
        quote: "Great value and a very responsive team. Across the buildings we manage they've been consistent, and any request is handled promptly.",
        suburb: "Newcastle",
        state: "NSW",
        date: "Jun 2026",
    },
    {
        name: "Priya Sharma",
        role: "Warehouse Manager",
        serviceType: "Industrial Cleaning",
        rating: 5,
        quote: "Keeping a busy warehouse clean and safe is tough, but their crew handles the floors and amenities brilliantly. Safety compliance has noticeably improved.",
        suburb: "Dandenong",
        state: "VIC",
        date: "May 2026",
    },
    {
        name: "Rachel O'Connor",
        role: "Childcare Director",
        serviceType: "Childcare Cleaning",
        rating: 5,
        quote: "As a childcare centre we need everything sanitised to a high standard. The team is careful, trustworthy and always leaves the rooms ready for the kids each morning.",
        suburb: "Toowong",
        state: "QLD",
        date: "May 2026",
    },
    {
        name: "James Kowalski",
        role: "Operations Manager",
        serviceType: "Corporate Cleaning",
        rating: 5,
        quote: "We switched providers last year and it was the best decision we made. Reliable scheduling, consistent quality and clear invoicing — exactly what we needed.",
        suburb: "Perth CBD",
        state: "WA",
        date: "Apr 2026",
    },
    {
        name: "Laura Bennett",
        role: "School Business Manager",
        serviceType: "Education Facility Cleaning",
        rating: 5,
        quote: "Our classrooms and shared spaces are always ready before the day starts. The staff are respectful of the school environment and incredibly dependable.",
        suburb: "Glenelg",
        state: "SA",
        date: "Apr 2026",
    },
    {
        name: "Daniel Fitzgerald",
        role: "Hospitality Venue Manager",
        serviceType: "Hospitality Cleaning",
        rating: 4,
        quote: "Late-night turnarounds are never a problem for this crew. Our venue is guest-ready every morning and the team is flexible when our events run over.",
        suburb: "Surfers Paradise",
        state: "QLD",
        date: "Mar 2026",
    },
    {
        name: "Margaret Wilson",
        role: "Aged Care Facility Manager",
        serviceType: "Aged Care Cleaning",
        rating: 5,
        quote: "The residents and families have noticed the difference. Their infection-control focus and gentle, considerate approach around our residents has been outstanding.",
        suburb: "Ballarat",
        state: "VIC",
        date: "Mar 2026",
    },
];
