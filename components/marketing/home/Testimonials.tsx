import { SectionTag } from "../SectionTag";
import { ReviewCard } from "../ReviewCard";
import { REVIEW_ROLES } from "@/lib/constants/reviews";

const ROW_1 = REVIEW_ROLES.slice(0, 4);
const ROW_2 = REVIEW_ROLES.slice(4, 8);

/** Home page preview of the first 8 review roles — the full set has its own page at /reviews. */
export function Testimonials() {
  return (
    <section id="reviews" aria-labelledby="reviews-heading" className="bg-surface-muted py-20">
      <div className="mx-auto flex max-w-[1368px] flex-col items-center gap-4 px-5 text-center sm:px-8">
        <SectionTag>Client Feedback</SectionTag>
        {/* Figma reuses this exact H2 on the gallery section too; kept verbatim to match the source design. */}
        <h2 id="reviews-heading" className="text-3xl font-medium tracking-tight text-ink sm:text-4xl">
          Trusted Commercial Cleaning Across Australia
        </h2>
      </div>

      {/* Two rows, each overflowing past the viewport on either side; the gradient masks fade that cut edge into the section background, matching the Figma effect. */}
      <div className="relative mt-10">
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-surface-muted to-transparent sm:w-48" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-surface-muted to-transparent sm:w-48" />

        <div className="flex flex-col gap-4">
          <ul className="flex gap-4 overflow-x-auto px-5 pb-2 sm:px-8 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {ROW_1.map((role, i) => (
              <ReviewCard key={i} role={role} />
            ))}
          </ul>
          <ul className="flex gap-4 overflow-x-auto px-5 pb-2 sm:px-8 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {ROW_2.map((role, i) => (
              <ReviewCard key={i} role={role} />
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
