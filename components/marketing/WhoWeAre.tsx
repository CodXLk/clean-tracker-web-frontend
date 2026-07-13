"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";

export function WhoWeAre() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (!sectionRef.current) return;
      gsap.fromTo(
        sectionRef.current.querySelectorAll("[data-reveal]"),
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
          stagger: 0.15,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 75%",
            toggleActions: "play none none reverse",
          },
        },
      );
    },
    { scope: sectionRef, dependencies: [] },
  );

  return (
    <section
      id="who-we-are"
      ref={sectionRef}
      className="relative overflow-hidden bg-gradient-to-br from-primary to-primary-variant py-24 text-white"
    >
      <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-10 px-6 text-center">
        <span
          data-reveal
          className="rounded-[40px] bg-white/10 px-6 py-3 font-heading text-2xl font-bold text-[#ED5F25] sm:text-3xl"
        >
          Who We Are?
        </span>
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-16">
          <p data-reveal className="text-2xl font-semibold leading-snug sm:text-[28px]">
            We are a Commercial Cleaning Company based in Victoria, Australia.
          </p>
          <p data-reveal className="text-lg font-semibold italic leading-relaxed text-white/90 sm:text-xl">
            &ldquo;Our company brings extensive experience in delivering commercial cleaning services
            across a diverse array of industries. We are committed to meeting the unique needs of
            our clients, with tailored and high-quality cleaning solutions.&rdquo;
          </p>
        </div>
      </div>
    </section>
  );
}
