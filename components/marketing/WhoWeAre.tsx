"use client";

import Image from "next/image";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import { useMediaQuery } from "@/hooks/useMediaQuery";

/**
 * The card silhouette, traced from the exported Figma "Subtract" shape and
 * expressed in objectBoundingBox units so it scales with the element. The card
 * keeps its 1432x794 ratio wherever the notch is applied, so the separate x/y
 * radii reproduce the original circular arcs exactly.
 *
 * Corners are r=100; the notch drops to y=125 between two concave r=75 fillets
 * and two convex r=52 inner corners.
 */
const NOTCH_PATH = [
  "M 0.069832 0",
  "L 0.268855 0",
  "A 0.052374 0.094458 0 0 1 0.321221 0.092972",
  "A 0.036313 0.065491 0 0 0 0.357542 0.157431",
  "L 0.642458 0.157431",
  "A 0.036313 0.065491 0 0 0 0.678779 0.092972",
  "A 0.052374 0.094458 0 0 1 0.731145 0",
  "L 0.930168 0",
  "A 0.069832 0.125945 0 0 1 1 0.125945",
  "L 1 0.874055",
  "A 0.069832 0.125945 0 0 1 0.930168 1",
  "L 0.069832 1",
  "A 0.069832 0.125945 0 0 1 0 0.874055",
  "L 0 0.125945",
  "A 0.069832 0.125945 0 0 1 0.069832 0",
  "Z",
].join(" ");

export function WhoWeAre() {
  const sectionRef = useRef<HTMLElement>(null);
  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  useGSAP(
    () => {
      if (!sectionRef.current || reduceMotion) return;
      gsap.from(sectionRef.current.querySelectorAll("[data-reveal]"), {
        opacity: 0,
        y: 48,
        duration: 0.8,
        ease: "power2.out",
        stagger: 0.14,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 75%",
          once: true,
        },
      });
    },
    { scope: sectionRef, dependencies: [reduceMotion] },
  );

  return (
    <section
      id="who-we-are"
      ref={sectionRef}
      data-nav-theme="light"
      aria-labelledby="who-we-are-heading"
      // Figma seats the card 149px below the top of its 982px frame; the
      // shallower foot is what carries into the white Services scene. The floor
      // on that top padding is what keeps the title clear of the fixed navbar
      // on small screens, where 9.855vw is only a few dozen pixels.
      className="relative pt-[clamp(5.5rem,9.855vw,9.3125rem)] pb-[clamp(2.5rem,5vw,4.75rem)]"
    >
      <svg aria-hidden="true" className="absolute size-0" focusable="false">
        <clipPath id="who-we-are-notch" clipPathUnits="objectBoundingBox">
          <path d={NOTCH_PATH} />
        </clipPath>
      </svg>

      <div className="mx-auto w-full max-w-[1512px] px-[max(1.25rem,2.712vw)]">
        <div className="relative">
          {/* On large screens the title sits in the notch cut out of the card;
              below that it simply stacks above a plain rounded card. */}
          <div
            data-reveal
            className="mb-6 flex items-center justify-center lg:absolute lg:left-[33.87%] lg:top-[1.26%] lg:z-10 lg:mb-0 lg:h-[11.59%] lg:w-[32.12%]"
          >
            <h2
              id="who-we-are-heading"
              className="font-heading text-section font-bold leading-none whitespace-nowrap text-black"
            >
              Who <span className="text-accent">We Are?</span>
            </h2>
          </div>

          <div className="who-we-are-card relative overflow-hidden rounded-[clamp(1.5rem,4vw,3rem)] lg:aspect-[1432/794] lg:rounded-none">
            <Image
              src="/images/marketing/about/glass-dome.jpg"
              alt="Abseiling technicians cleaning the glass dome of a high-rise tower"
              fill
              sizes="(max-width: 1024px) 100vw, 95vw"
              className="object-cover object-bottom"
            />

            {/* From `lg` the copy sits in the empty sky at the top of the plate
                and needs no help. Stacked below that it crosses the dome itself,
                where white on pale glass is unreadable — so the photo is banked
                down behind a scrim at those sizes only. */}
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/35 to-black/15 lg:hidden"
            />

            {/* Below `lg` the two paragraphs flow; from `lg` this box stretches
                over the card so their Figma percentages resolve against it. */}
            <div className="relative grid gap-8 px-6 py-12 sm:px-10 sm:py-16 lg:absolute lg:inset-0 lg:block lg:p-0">
              <p
                data-reveal
                className="text-center font-body text-lead font-semibold leading-snug text-white lg:absolute lg:left-[0.84%] lg:top-[22.29%] lg:w-[31.63%]"
              >
                We are a Commercial Cleaning Company based in Victoria, Australia.
              </p>
              <p
                data-reveal
                className="text-center font-body text-quote font-semibold leading-snug text-white lg:absolute lg:left-[58.80%] lg:top-[47.61%] lg:w-[40.15%]"
              >
                &ldquo;Our company brings extensive experience in delivering commercial cleaning
                services across a diverse array of industries. We are committed to meeting the
                unique needs of our clients, with tailored and high-quality cleaning solutions.&rdquo;
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
