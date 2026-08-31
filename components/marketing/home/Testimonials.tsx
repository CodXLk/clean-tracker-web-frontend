import { MapPin, Star, User } from "lucide-react";
import { SectionTag } from "../SectionTag";

/**
 * id="reviews" — matches the Figma card layout (avatar, rating, quote,
 * location, date) but with clearly-labelled placeholder content: no real
 * testimonials have been supplied yet, and the Figma demo data was fake (UK
 * cities, invented ratings, quotes naming a different template brand).
 * Replace every bracketed value with a real, attributed review as they come in.
 */
const ROW_1 = [
  { role: "Facility Manager" },
  { role: "Property Owner" },
  { role: "Office Manager" },
  { role: "Practice Manager" },
] as const;

const ROW_2 = [
  { role: "Retail Store Owner" },
  { role: "Strata Manager" },
  { role: "Warehouse Manager" },
  { role: "Childcare Director" },
] as const;

function ReviewCard({ role }: { role: string }) {
  return (
    <li className="flex w-[320px] shrink-0 flex-col gap-8 rounded-xl border border-line bg-white p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-full border border-line bg-surface-muted text-body-2">
            <User size={22} aria-hidden="true" />
          </span>
          <div>
            <p className="text-lg text-ink">[Client name]</p>
            <p className="text-sm text-body-2">{role} — [service type]</p>
          </div>
        </div>
        <span className="flex shrink-0 items-center gap-1 text-sm text-body-2">
          <Star size={16} className="fill-brand-2 text-brand-2" aria-hidden="true" />
        </span>
      </div>

      <p className="flex-1 text-sm text-body-2">&ldquo;[Client testimonial to be added]&rdquo;</p>

      <div className="flex flex-col gap-4 border-t border-line pt-4">
        <div className="flex items-center justify-between text-sm text-body-2">
          <span className="flex items-center gap-1">
            <MapPin size={16} aria-hidden="true" />
            [Suburb], VIC
          </span>
          <span>[Date]</span>
        </div>
      </div>
    </li>
  );
}

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
            {ROW_1.map((review, i) => (
              <ReviewCard key={i} role={review.role} />
            ))}
          </ul>
          <ul className="flex gap-4 overflow-x-auto px-5 pb-2 sm:px-8 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {ROW_2.map((review, i) => (
              <ReviewCard key={i} role={review.role} />
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
