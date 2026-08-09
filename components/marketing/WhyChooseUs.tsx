"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, REVEAL_TOGGLE_ACTIONS } from "@/lib/gsap";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { SectionHeading } from "./SectionHeading";

/** The three selling points, with the phrases Figma sets in accent orange. */
const POINTS = [
  <>
    We are a <span className="text-accent">specialized</span> and{" "}
    <span className="text-accent">all rounder</span> cleaning company provides a range of cleaning
    and maintenance solutions to our customers to keep their worries away.
  </>,
  <>
    All of your cleaning requirements and concerns can be{" "}
    <span className="text-accent">sorted under one company</span> which saves you money and time.
  </>,
  <>
    Our <span className="text-accent">affordable</span> and{" "}
    <span className="text-accent">customizable</span> services will provide your workplace a
    personal touch through our expertise.
  </>,
];

export function WhyChooseUs() {
  const sectionRef = useRef<HTMLElement>(null);
  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  useGSAP(
    () => {
      if (!sectionRef.current || reduceMotion) return;

      gsap.from(sectionRef.current.querySelectorAll("[data-reveal]"), {
        opacity: 0,
        x: 56,
        duration: 0.8,
        ease: "power2.out",
        stagger: 0.14,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 68%",
          toggleActions: REVEAL_TOGGLE_ACTIONS,
        },
      });

    },
    { scope: sectionRef, dependencies: [reduceMotion] },
  );

  return (
    <section
      id="why-choose-us"
      ref={sectionRef}
      data-nav-theme="light"
      aria-labelledby="why-choose-us-heading"
      className="relative overflow-hidden"
    >
      {/* The tower and its stacked-layout scrim both live in `TowerBackdrop`,
          which spans this section and Industries as one element. This scene
          used to carry its own copy, anchored differently and scrolling rather
          than sticky, so across the handover the two were visible together and
          the building looked cut in half. */}
      <div className="relative mx-auto w-full max-w-[1512px] px-[max(1.25rem,2.712vw)]">
        {/* As in Industries: the full-viewport beat is `lg` pacing. Stacked, it
            padded three short points out to a screenful. */}
        <div className="flex min-h-0 flex-col justify-center py-20 sm:py-24 lg:aspect-[1512/982] lg:block lg:py-0">
          <SectionHeading
            id="why-choose-us-heading"
            lead="Why Choose"
            accent="Us?"
            className="lg:absolute lg:left-[50.98%] lg:top-[14.77%]"
            data-reveal
          />

          {/* Percentages resolve against the padded content box (1430 of the
              1512 canvas), so they are the Figma coordinates rebased onto it. */}
          <ul className="mt-8 flex flex-col gap-6 lg:absolute lg:left-[50.63%] lg:top-[30.14%] lg:mt-0 lg:w-[49.23%] lg:gap-[2.65vw]">
            {POINTS.map((point, i) => (
              <li
                key={i}
                data-reveal
                className="font-body text-quote font-medium leading-snug text-white"
              >
                <span aria-hidden="true" className="mr-2 text-[#404040]">
                  ✔
                </span>
                {point}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
