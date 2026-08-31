/** Genuine FAQ used on /contact — do not add questions/answers that aren't real. */
export interface FaqItem {
    question: string;
    answer: string;
}

export const FAQ_ITEMS: FaqItem[] = [
    {
        question: "Are your cleaners background checked?",
        answer:
            "Yes. All cleaning staff undergo Police Checks and VEVO work-rights verification, and are covered by our insurance for your peace of mind.",
    },
    {
        question: "Can cleaning be performed outside of standard business hours?",
        answer:
            "Yes. Most commercial cleaning is scheduled before or after business hours, or overnight, so it doesn't disrupt your operations.",
    },
    {
        question: "Do you supply all commercial equipment and eco-friendly chemicals?",
        answer:
            "Yes. We supply professional-grade equipment and eco-friendly cleaning chemicals as part of every service.",
    },
    {
        question: "Will our facility have a dedicated cleaning crew and account manager?",
        answer:
            "Yes. We assign a consistent crew to your site and a single point of contact for scheduling and any service requests.",
    },
    {
        question: "What commercial contract terms and options do you provide?",
        answer:
            "We tailor contract terms — frequency, scope and length — to your facility's operational requirements. Get in touch for a quote based on your needs.",
    },
];

/** The Home page's own FAQ ("Commercial Cleaning FAQs") — a distinct, compliance-focused set from FAQ_ITEMS above. */
export const HOME_FAQ_ITEMS: FaqItem[] = [
    {
        question: "Are your cleaning staff background-checked and fully compliant?",
        answer:
            "Yes. Every team member undergoes thorough Police Checks, Working with Children Checks (WWCC), and VEVO work rights verification. Primeway Property Services holds a Victorian Labour Hire Licence, $20 million Public Liability insurance, and full WorkCover coverage.",
    },
    {
        question: "Which commercial sectors and facility types do you service?",
        answer:
            "We service offices, education, healthcare, retail, logistics, manufacturing, hospitality and aged care facilities across Australia — see Industries We Serve for the full list.",
    },
    {
        question: "Do you supply your own cleaning products and commercial equipment?",
        answer: "Yes. We supply professional-grade equipment and eco-friendly cleaning chemicals as part of every service.",
    },
    {
        question: "How do you ensure service consistency and quality control?",
        answer:
            "A consistent crew is assigned to your site, backed by regular supervisor audits, digital inspections, and a fast response to any client feedback.",
    },
    {
        question: "Can cleaning schedules be tailored to our operational requirements?",
        answer:
            "Yes. We design cleaning schedules around your operating hours — including before/after hours and overnight servicing — to minimise disruption.",
    },
];
