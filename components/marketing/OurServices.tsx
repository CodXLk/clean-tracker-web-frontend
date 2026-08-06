"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { SectionHeading } from "./SectionHeading";
import { ServiceCard, type ServiceKey } from "./ServiceCard";

/**
 * Card placement on Figma's 1512x982 Services canvas, as percentages of the
 * scene. `settled` is the "Services / after loading" frame; `start` is where the
 * same card sits in the "Services / loading scene" frame — all four begin
 * stacked near the middle and fan outward as the section scrolls in.
 */
const SERVICES: {
  service: ServiceKey;
  label: string;
  image: string;
  rotate: number;
  settled: { x: number; y: number };
  start:   { x: number; y: number };
}[] = [
  {
    service: "regular",
    label: "Regular Cleaning",
    image: "/images/marketing/services/regular-cleaning.jpg",
    rotate: -20,
    settled: { x: 14.12, y: 35.95 },
    start:   { x: 50.03, y: 63.95 },
  },
  {
    service: "periodical",
    label: "Periodical Cleaning",
    image: "/images/marketing/services/periodical-cleaning.jpg",
    rotate: -20,
    settled: { x: 29.80, y: 74.75 },
    start:   { x: 50.03, y: 63.95 },
  },
  {
    service: "specialist",
    label: "Specialist Cleaning",
    image: "/images/marketing/services/specialist-cleaning.jpg",
    rotate: 20,
    settled: { x: 70.07, y: 74.75 },
    start:   { x: 58.96, y: 55.30 },
  },
  {
    service: "deep",
    label: "Deep Cleaning",
    image: "/images/marketing/services/deep-cleaning.jpg",
    rotate: 21,
    settled: { x: 85.85, y: 35.95 },
    start:   { x: 59.46, y: 55.30 },
  },
];

export function OurServices() {
  const sectionRef = useRef<HTMLElement>(null);
  const sceneRef   = useRef<HTMLDivElement>(null);
  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  useGSAP(
    () => {
      if (!sectionRef.current || reduceMotion) return;

      gsap.from(sectionRef.current.querySelectorAll("[data-reveal]"), {
        opacity: 0,
        y: 32,
        duration: 0.7,
        ease: "power2.out",
        stagger: 0.12,
        scrollTrigger: { trigger: sectionRef.current, start: "top 70%", once: true },
      });

      const scene = sceneRef.current;
      const cards = scene?.querySelectorAll<HTMLElement>("[data-service-card]") ?? [];
      if (!scene || cards.length === 0) return;

      // The fan-out is choreography for the scattered `lg` canvas: in the
      // stacked grid its deltas are shares of a scene box that no longer
      // exists, and would throw each card in from well off-screen.
      //
      // `matchMedia` rather than a React media-query hook. The hook would make
      // the breakpoint a dependency of the whole effect, so the first paint
      // would build one set of tweens and the resolved query would immediately
      // revert and rebuild them — taking the reveal above down with it.
      const mm = gsap.matchMedia();

      mm.add("(min-width: 64rem)", () => {
        // Deltas are a share of the scene box, so they stay correct at any
        // width; `invalidateOnRefresh` re-measures on viewport change.
        cards.forEach((card, i) => {
          const spec = SERVICES[i]!;
          gsap.from(card, {
            x: () => (scene.clientWidth * (spec.start.x - spec.settled.x)) / 100,
            y: () => (scene.clientHeight * (spec.start.y - spec.settled.y)) / 100,
            scale: 0.78,
            opacity: 0,
            duration: 1,
            ease: "power3.out",
            delay: i * 0.08,
            scrollTrigger: {
              trigger: scene,
              start: "top 68%",
              once: true,
              invalidateOnRefresh: true,
            },
          });
        });
      });

      mm.add("(max-width: 63.999rem)", () => {
        // Stacked: the cards simply rise into place with the rest of the copy.
        gsap.from(cards, {
          opacity: 0,
          y: 48,
          scale: 0.94,
          duration: 0.7,
          ease: "power2.out",
          stagger: 0.1,
          scrollTrigger: { trigger: scene, start: "top 85%", once: true },
        });
      });
    },
    { scope: sectionRef, dependencies: [reduceMotion] },
  );

  return (
    <section
      id="services"
      ref={sectionRef}
      data-nav-theme="dark"
      aria-labelledby="services-heading"
      className="relative bg-white"
    >
      <div className="mx-auto w-full max-w-[1512px]">
        {/* Figma composes this scene as a single 1512x982 canvas with the cards
            scattered around the centred copy. Below `lg` that becomes a stacked
            column with the cards in a grid underneath. */}
        <div
          ref={sceneRef}
          // `lg:overflow-hidden` reproduces the frame clip in Figma, where the
          // two lower cards run off the bottom edge of the scene.
          className="relative flex flex-col items-center gap-8 px-6 py-20 lg:aspect-[1512/982] lg:block lg:overflow-hidden lg:px-0 lg:py-0"
        >
          <SectionHeading
            id="services-heading"
            lead="Our"
            accent="Services"
            className="text-center lg:absolute lg:left-1/2 lg:top-[19.65%] lg:-translate-x-1/2 lg:whitespace-nowrap"
            data-reveal
          />

          <p
            data-reveal
            className="max-w-[43rem] text-center font-body text-subhead font-medium leading-snug text-black lg:absolute lg:left-1/2 lg:top-[30.86%] lg:w-[43.056%] lg:max-w-none lg:-translate-x-1/2"
          >
            We are willing to take bold action to achieve the extraordinary.
          </p>

          <p
            data-reveal
            className="max-w-[32rem] text-center font-body text-body-lg leading-normal text-black lg:absolute lg:left-1/2 lg:top-[45.21%] lg:w-[31.35%] lg:max-w-none lg:-translate-x-1/2"
          >
            We, Primeway Property Services, provide a range of cleaning services, including regular
            cleaning, periodic cleaning, disinfecting cleaning, deep cleaning etc. for a diverse
            range of industries.
          </p>

          {/* Two columns from the smallest screen up. One column left each card
              at its floor width, marooned in the middle of a very tall list;
              paired, they fill the row and the section reads at a third of the
              length. */}
          <ul className="mt-4 grid w-full max-w-[34rem] grid-cols-2 justify-items-center gap-x-4 gap-y-8 sm:gap-x-8 sm:gap-y-10 lg:contents">
            {SERVICES.map((service) => (
              <li
                key={service.service}
                // On `lg` each item collapses to a zero-size anchor at its Figma
                // coordinate and centres the card on that point — the same trick
                // the design uses, and it keeps `left`/`top` free of transforms.
                // `max-lg:` for the stacked widths rather than an `lg:` reset:
                // `lg:w-auto` and `lg:size-0` carry the same specificity, so
                // which one won came down to stylesheet order.
                className="max-lg:w-full lg:absolute lg:flex lg:size-0 lg:items-center lg:justify-center"
                style={{ left: `${service.settled.x}%`, top: `${service.settled.y}%` }}
              >
                {/* Outer box is GSAP's (translate/scale/fade), inner box holds
                    the static tilt so the fly-in path is never skewed by it.
                    The tilt is a canvas flourish — in the grid it would only
                    knock the rows out of alignment, so it starts at `lg`. */}
                <div data-service-card className="max-lg:w-full">
                  <div
                    className="rotate-0 lg:rotate-[var(--card-rotate)]"
                    style={{ ["--card-rotate" as string]: `${service.rotate}deg` }}
                  >
                    <ServiceCard
                      image={service.image}
                      label={service.label}
                      service={service.service}
                      className="max-lg:w-full max-lg:max-w-[13rem] transition-transform duration-300 hover:scale-[1.04] motion-reduce:transition-none motion-reduce:hover:scale-100"
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
