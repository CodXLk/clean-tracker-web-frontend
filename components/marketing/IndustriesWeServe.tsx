"use client";

import Image from "next/image";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { SectionHeading } from "./SectionHeading";
import { IndustryCard } from "./IndustryCard";

/**
 * Tile centres as percentages of Figma's 1512x982 "Industries" canvas, taken
 * from the settled frame. `side` drives which way the tile flies in from — the
 * design parks the left cluster at x=-436 and the right cluster at x=1863
 * before they converge.
 *
 * NOTE: Figma labels the fifth and tenth tiles "Education" and "Retirement &
 * Agecare" respectively, but gives the fifth the same icon and label as the
 * fourth — i.e. "Education" appears twice. That duplication is reproduced here
 * because it is what the design specifies; the body copy lists "automotive" as
 * the tenth industry, so this is most likely a slip worth confirming with the
 * designer. Changing it is a one-line edit to this table.
 */
const INDUSTRIES = [
  { label: "Commercial",           icon: "commercial",    tone: "teal",   side: "left",  x: 10.51, y: 38.48 },
  { label: "Health Services",      icon: "health",        tone: "orange", side: "left",  x: 21.95, y: 29.12 },
  { label: "Pharmaceutical",       icon: "pharma",        tone: "orange", side: "left",  x: 21.95, y: 49.99 },
  { label: "Education",            icon: "education",     tone: "teal",   side: "left",  x: 10.51, y: 60.38 },
  { label: "Education",            icon: "education",     tone: "orange", side: "left",  x: 21.89, y: 70.87 },
  { label: "Manufacturing",        icon: "manufacturing", tone: "teal",   side: "right", x: 89.48, y: 38.48 },
  { label: "Logistics",            icon: "logistics",     tone: "orange", side: "right", x: 78.10, y: 29.12 },
  { label: "Hospitality",          icon: "hospitality",   tone: "orange", side: "right", x: 78.10, y: 49.99 },
  { label: "Retail",               icon: "retail",        tone: "teal",   side: "right", x: 89.48, y: 60.38 },
  { label: "Retirement & Agecare", icon: "retirement",    tone: "orange", side: "right", x: 78.04, y: 70.87 },
] as const;

/** How far off-canvas each cluster starts, as a share of the scene width. */
const ENTRY_SHIFT = { left: -33.27, right: 39.81 } as const;

/**
 * The tower is laid out at the framing the tile scene gives it (3059x1708 at
 * -773.5,-214 on the 1512x982 canvas). These are the same numbers for the
 * earlier text scene (2425x1354 at -93,31) re-expressed as a transform off that
 * layout, so the scroll-linked move stays on the compositor.
 */
const TOWER_TEXT_FRAMING = { scale: 0.7927, xPercent: 11.885, yPercent: 3.982 } as const;
const TOWER_TILE_FRAMING = {
  left: "-51.16%",
  top: "-21.79%",
  width: "202.31%",
  height: "173.93%",
} as const;

export function IndustriesWeServe() {
  const sectionRef = useRef<HTMLElement>(null);
  const towerRef   = useRef<HTMLDivElement>(null);
  const diamondsRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  useGSAP(
    () => {
      if (!sectionRef.current || reduceMotion) return;

      gsap.from(sectionRef.current.querySelectorAll("[data-reveal]"), {
        opacity: 0,
        x: -64,
        duration: 0.85,
        ease: "power2.out",
        stagger: 0.15,
        scrollTrigger: { trigger: sectionRef.current, start: "top 65%", once: true },
      });

      // The tower travels between the two framings Figma gives it: right of the
      // copy while the text reads, then recentred and larger behind the tiles.
      // The element is laid out at the *second* framing and the first is
      // expressed as a transform off it, so the scrub only ever touches
      // compositor properties instead of re-laying-out a 200%-wide image.
      if (towerRef.current) {
        gsap.from(towerRef.current, {
          scale: TOWER_TEXT_FRAMING.scale,
          xPercent: TOWER_TEXT_FRAMING.xPercent,
          yPercent: TOWER_TEXT_FRAMING.yPercent,
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: "bottom bottom",
            scrub: 1,
          },
        });
      }

      const scene = diamondsRef.current;
      const diamonds = scene?.querySelectorAll<HTMLElement>("[data-diamond]") ?? [];
      diamonds.forEach((diamond, i) => {
        // The shift is a share of the scene, not of the 130px tile, so it has to
        // be resolved against the measured scene width rather than `xPercent`.
        const shift = Number(diamond.dataset.shift);
        gsap.from(diamond, {
          x: () => ((scene?.clientWidth ?? 0) * shift) / 100,
          opacity: 0,
          scale: 0.55,
          duration: 0.85,
          ease: "power2.out",
          delay: (i % 5) * 0.08,
          scrollTrigger: {
            trigger: scene,
            start: "top 72%",
            once: true,
            invalidateOnRefresh: true,
          },
        });
      });
    },
    { scope: sectionRef, dependencies: [reduceMotion] },
  );

  return (
    <section
      id="industries"
      ref={sectionRef}
      data-nav-theme="light"
      aria-labelledby="industries-heading"
      className="relative"
    >
      {/* The Aspire Tower render is a single sticky backdrop that both beats of
          the section scroll past, matching how Figma keeps one tower node
          moving between frames rather than cutting between images. */}
      {/* Capped to the 1512px design canvas so the tower keeps its scale
          relationship with the tiles instead of outgrowing them on wide displays. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 mx-auto max-w-[1512px]">
        <div className="sticky top-0 h-[100svh] overflow-hidden">
          <div ref={towerRef} className="absolute will-change-transform" style={TOWER_TILE_FRAMING}>
            <Image
              src="/images/marketing/industries/tower.webp"
              alt=""
              fill
              sizes="205vw"
              className="object-contain object-top"
            />
          </div>
          {/* On the `lg` canvas the copy sits in clear sky to the left of the
              tower. Once the layout stacks there is no "beside" left and the
              paragraph lands straight on the glass, where white text and orange
              highlights both disappear. A scrim under the text — and only at
              those sizes — restores the contrast without touching the scene. */}
          <div className="absolute inset-0 bg-gradient-to-b from-atmos-top via-atmos-top/90 to-atmos-top/45 lg:hidden" />
        </div>
      </div>

      <div className="relative mx-auto w-full max-w-[1512px]">
        {/* Beat one — heading and body copy, tower to the right. Full-viewport
            beats are what give the `lg` scene its cinematic pacing; stacked,
            the same rule padded a short paragraph out to a screenful and left
            large empty bands between sections. */}
        <div className="flex min-h-0 flex-col justify-center px-[max(1.25rem,2.183vw)] py-20 sm:py-24 lg:min-h-[100svh] lg:py-0">
          <SectionHeading
            id="industries-heading"
            lead="Industries"
            accent="We Serve"
            className="lg:w-[36.45%]"
            data-reveal
          />
          <p
            data-reveal
            className="mt-6 max-w-[43.85rem] font-body text-quote font-medium leading-snug text-white lg:mt-[2.5vw] lg:w-[45.85%] lg:max-w-none"
          >
            Established in 2021, our company has rapidly grown to offer a wide range of cleaning
            services across various industry sectors in Victoria, Australia. Our industries
            expertise include{" "}
            <span className="text-accent">
              commercial, education, health services, pharmaceutical, logistics, hospitality,
              manufacturing, automotive, retail, retirement &amp; age care.
            </span>{" "}
            This expansion highlights our proven expertise and ability to tackle diverse cleaning
            challenges with excellence.
          </p>
        </div>

        {/* Beat two — the tiles converge around the recentred tower. This scene
            is deliberately full-bleed: its tile coordinates are percentages of
            the whole 1512 canvas, not of a padded content box. */}
        <div
          ref={diamondsRef}
          className="relative flex min-h-0 items-center px-[max(1.25rem,2.183vw)] pb-20 sm:pb-24 lg:aspect-[1512/982] lg:block lg:px-0 lg:py-0"
        >
          <h3 className="sr-only">Industries Primeway serves</h3>
          <ul className="grid w-full grid-cols-2 justify-items-center gap-x-6 gap-y-10 sm:grid-cols-3 lg:contents">
            {INDUSTRIES.map((industry, i) => (
              <li
                key={`${industry.label}-${i}`}
                className="lg:absolute lg:flex lg:size-0 lg:items-center lg:justify-center"
                style={{ left: `${industry.x}%`, top: `${industry.y}%` }}
              >
                <div data-diamond data-shift={ENTRY_SHIFT[industry.side]}>
                  <IndustryCard
                    icon={`/images/marketing/industries/icon-${industry.icon}.png`}
                    label={industry.label}
                    tone={industry.tone}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
