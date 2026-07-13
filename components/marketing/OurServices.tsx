"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import { ServiceCard } from "./ServiceCard";

// Directions and relative magnitudes derived from comparing card coordinates across Figma's
// "Services loading" and "Services after loading" keyframes (each card's real delta, converted to
// a proportion of the 1512px reference canvas): Regular travels up-left, Periodical left-down,
// Deep right-up, Specialist right-down — reproduced here at a scale that reads clearly at card size.
const SERVICES = [
  { image: "/images/marketing/services/regular-cleaning.jpg",    label: "Regular Cleaning",    ribbonColor: "#756E5B", rotationDeg: -8,  from: { x: -180, y: -130, rotate: -40 } },
  { image: "/images/marketing/services/periodical-cleaning.jpg", label: "Periodical Cleaning", ribbonColor: "#A4A5A0", rotationDeg: -6,  from: { x: -220, y: 140,  rotate: 35 } },
  { image: "/images/marketing/services/deep-cleaning.jpg",       label: "Deep Cleaning",       ribbonColor: "#1B5468", rotationDeg: 9,   from: { x: 220,  y: -140, rotate: 40 } },
  { image: "/images/marketing/services/specialist-cleaning.jpg", label: "Specialist Cleaning", ribbonColor: "#908281", rotationDeg: 7,   from: { x: 180,  y: 140,  rotate: -35 } },
] as const;

export function OurServices() {
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
          stagger: 0.1,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 75%",
            toggleActions: "play none none reverse",
          },
        },
      );

      const cards = sectionRef.current.querySelectorAll<HTMLElement>("[data-service-card]");
      cards.forEach((card, i) => {
        const { from, rotationDeg } = SERVICES[i]!;
        gsap.fromTo(
          card,
          { x: from.x, y: from.y, rotate: from.rotate, opacity: 0, scale: 0.7 },
          {
            x: 0,
            y: 0,
            rotate: rotationDeg,
            opacity: 1,
            scale: 1,
            duration: 0.9,
            ease: "back.out(1.4)",
            delay: i * 0.1,
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 70%",
              toggleActions: "play none none reverse",
            },
          },
        );
      });
    },
    { scope: sectionRef, dependencies: [] },
  );

  return (
    <section id="services" ref={sectionRef} className="bg-white py-24">
      <div className="mx-auto flex max-w-[1300px] flex-col items-center gap-16 px-6 lg:flex-row lg:items-center lg:gap-12">
        <div className="grid shrink-0 grid-cols-2 gap-4 sm:gap-6">
          {SERVICES.map((service, i) => (
            <div key={service.label} className={i % 2 === 1 ? "mt-8 sm:mt-12" : ""}>
              <ServiceCard
                image={service.image}
                label={service.label}
                ribbonColor={service.ribbonColor}
                rotationDeg={service.rotationDeg}
              />
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center gap-6 text-center lg:items-start lg:text-left">
          <h2 data-reveal className="font-heading text-4xl font-bold sm:text-5xl">
            <span className="text-black">Our</span> <span className="text-[#ED5F25]">Services</span>
          </h2>
          <p data-reveal className="max-w-xl text-2xl font-medium text-black sm:text-3xl">
            We are willing to take bold action to achieve the extraordinary.
          </p>
          <p data-reveal className="max-w-lg text-base text-grey-700 sm:text-lg">
            We, Primeway Property Services, provide a range of cleaning services, including regular
            cleaning, periodic cleaning, disinfecting cleaning, deep cleaning etc. for a diverse
            range of industries.
          </p>
        </div>
      </div>
    </section>
  );
}
