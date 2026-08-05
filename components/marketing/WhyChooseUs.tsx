"use client";

import Image from "next/image";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
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
  const towerRef   = useRef<HTMLDivElement>(null);
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
        scrollTrigger: { trigger: sectionRef.current, start: "top 68%", once: true },
      });

      // Continues the drift the tower has through the Industries section, so the
      // two scenes read as one continuous camera move rather than a cut.
      if (towerRef.current) {
        gsap.fromTo(
          towerRef.current,
          { yPercent: -6 },
          {
            yPercent: 6,
            ease: "none",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top bottom",
              end: "bottom top",
              scrub: 1,
            },
          },
        );
      }
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
      {/* Tower, at the framing Figma gives it in the "Why Choose Us" frame:
          3059x1708 anchored to (-1147, -486) on the 1512x982 canvas. */}
      <div
        ref={towerRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 mx-auto max-w-[1512px] will-change-transform"
      >
        <div
          className="absolute"
          style={{ left: "-75.86%", top: "-49.49%", width: "202.31%", height: "173.93%" }}
        >
          <Image
            src="/images/marketing/industries/tower.webp"
            alt=""
            fill
            sizes="205vw"
            className="object-contain object-top"
          />
        </div>
      </div>

      <div className="relative mx-auto w-full max-w-[1512px] px-[max(1.25rem,2.712vw)]">
        <div className="flex min-h-[100svh] flex-col justify-center py-24 lg:aspect-[1512/982] lg:block lg:min-h-0 lg:py-0">
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
