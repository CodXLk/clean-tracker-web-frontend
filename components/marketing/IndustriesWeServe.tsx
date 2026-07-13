"use client";

import { useRef } from "react";
import Image from "next/image";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import { IndustryCard } from "./IndustryCard";

const INDUSTRIES = [
  { icon: "/images/marketing/industries/icon-commercial.png",  label: "Commercial",           color: "teal"   },
  { icon: "/images/marketing/industries/icon-health.png",      label: "Health Services",      color: "orange" },
  { icon: "/images/marketing/industries/icon-pharma.png",      label: "Pharmaceutical",       color: "orange" },
  { icon: "/images/marketing/industries/icon-education.png",   label: "Education",            color: "teal"   },
  { icon: "/images/marketing/industries/icon-manufacturing.png", label: "Manufacturing",       color: "teal"   },
  { icon: "/images/marketing/industries/icon-logistics.png",   label: "Logistics",            color: "orange" },
  { icon: "/images/marketing/industries/icon-hospitality.png", label: "Hospitality",          color: "orange" },
  { icon: "/images/marketing/industries/icon-retail.png",      label: "Retail",               color: "teal"   },
  { icon: "/images/marketing/industries/icon-retirement.png",  label: "Retirement & Agecare",  color: "orange" },
] as const;

const COLUMN_OFFSETS = ["mt-0", "mt-16", "mt-0"] as const;

// In Figma, the left group of cards sits off-canvas to the left (negative x) and the right group
// sits off-canvas to the right (beyond the frame width) before converging into the settled grid —
// confirmed by comparing card x-positions across the "Industries loading" keyframes. Reproduce that
// per-column direction instead of a generic center pop-in.
const COLUMN_ENTRY: Record<number, { x: number; y: number }> = {
  0: { x: -220, y: 0 },
  1: { x: 0, y: -140 },
  2: { x: 220, y: 0 },
};

export function IndustriesWeServe() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (!sectionRef.current) return;

      gsap.fromTo(
        sectionRef.current.querySelectorAll("[data-reveal]"),
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: "power2.out",
          stagger: 0.12,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 70%",
            toggleActions: "play none none reverse",
          },
        },
      );

      // Paragraph slides in from the left, matching its Figma entrance (x: -920 -> 483)
      gsap.fromTo(
        sectionRef.current.querySelector("[data-paragraph]"),
        { opacity: 0, x: -80 },
        {
          opacity: 1,
          x: 0,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 70%",
            toggleActions: "play none none reverse",
          },
        },
      );

      const columns = sectionRef.current.querySelectorAll<HTMLElement>("[data-industry-col]");
      columns.forEach((col, colIndex) => {
        const cards = col.querySelectorAll("[data-industry-card]");
        const entry = COLUMN_ENTRY[colIndex] ?? { x: 0, y: 0 };
        gsap.fromTo(
          cards,
          { opacity: 0, scale: 0.6, rotate: 0, x: entry.x, y: entry.y },
          {
            opacity: 1,
            scale: 1,
            rotate: 45,
            x: 0,
            y: 0,
            duration: 0.8,
            ease: "power2.out",
            stagger: 0.1,
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 65%",
              toggleActions: "play none none reverse",
            },
          },
        );
      });
    },
    { scope: sectionRef, dependencies: [] },
  );

  const columns = [INDUSTRIES.slice(0, 3), INDUSTRIES.slice(3, 6), INDUSTRIES.slice(6, 9)];

  return (
    <section id="industries" ref={sectionRef} className="relative overflow-hidden bg-black py-24">
      <Image
        src="/images/marketing/industries/architectural-bg.jpg"
        alt=""
        fill
        sizes="100vw"
        className="object-cover opacity-40"
        priority={false}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/80" />

      <div className="relative mx-auto flex max-w-[1300px] flex-col items-center gap-14 px-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex max-w-lg flex-col gap-5 text-center lg:text-left">
          <h2 data-reveal className="font-heading text-4xl font-bold sm:text-5xl">
            <span className="text-white">Industries</span> <span className="text-[#ED5F25]">We Serve</span>
          </h2>
          <p data-paragraph className="text-base leading-relaxed text-white sm:text-lg">
            Established in 2021, our company has rapidly grown to offer a wide range of cleaning
            services across various industry sectors in Victoria, Australia. Our industries
            expertise include{" "}
            <span className="text-[#ED5F25]">
              commercial, education, health services, pharmaceutical, logistics, hospitality,
              manufacturing, automotive, retail, retirement &amp; age care.
            </span>{" "}
            This expansion highlights our proven expertise and ability to tackle diverse cleaning
            challenges with excellence.
          </p>
        </div>

        <div className="flex items-center gap-6 sm:gap-8">
          {columns.map((col, colIndex) => (
            <div
              key={colIndex}
              data-industry-col
              className={`flex flex-col gap-8 sm:gap-10 ${COLUMN_OFFSETS[colIndex]}`}
            >
              {col.map((industry) => (
                <IndustryCard
                  key={industry.label}
                  icon={industry.icon}
                  label={industry.label}
                  color={industry.color}
                  className="size-[90px] sm:size-[110px]"
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
