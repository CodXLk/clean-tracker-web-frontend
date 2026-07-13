"use client";

import { useRef } from "react";
import Image from "next/image";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";

export function WhyChooseUs() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (!sectionRef.current) return;
      gsap.fromTo(
        sectionRef.current.querySelectorAll("[data-reveal]"),
        { opacity: 0, x: 40 },
        {
          opacity: 1,
          x: 0,
          duration: 0.7,
          ease: "power2.out",
          stagger: 0.15,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 70%",
            toggleActions: "play none none reverse",
          },
        },
      );
      gsap.fromTo(
        sectionRef.current.querySelector("[data-image]"),
        { opacity: 0, x: -40 },
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
    },
    { scope: sectionRef, dependencies: [] },
  );

  return (
    <section id="why-choose-us" ref={sectionRef} className="bg-white py-24">
      <div className="mx-auto grid max-w-[1300px] grid-cols-1 items-center gap-12 px-6 lg:grid-cols-2 lg:gap-16">
        <div data-image className="relative h-[340px] w-full overflow-hidden rounded-[32px] sm:h-[440px]">
          <Image
            src="/images/marketing/industries/architectural-bg.jpg"
            alt="Modern glass skyscraper"
            fill
            sizes="(min-width: 1024px) 600px, 100vw"
            className="object-cover"
          />
        </div>

        <div className="flex flex-col gap-8">
          <h2 data-reveal className="font-heading text-4xl font-bold sm:text-5xl">
            <span className="text-black">Why Choose </span>
            <span className="text-[#ED5F25]">Us?</span>
          </h2>

          <p data-reveal className="text-lg leading-relaxed text-on-surface sm:text-xl">
            ✔ We are a <span className="text-[#ED5F25]">specialized</span> and{" "}
            <span className="text-[#ED5F25]">all rounder</span> cleaning company provides a range
            of cleaning and maintenance solutions to our customers to keep their worries away.
          </p>
          <p data-reveal className="text-lg leading-relaxed text-on-surface sm:text-xl">
            ✔ All of your cleaning requirements and concerns can be{" "}
            <span className="text-[#ED5F25]">sorted under one company</span> which saves you money
            and time.
          </p>
          <p data-reveal className="text-lg leading-relaxed text-on-surface sm:text-xl">
            ✔ Our <span className="text-[#ED5F25]">affordable</span> and{" "}
            <span className="text-[#ED5F25]">customizable</span> services will provide your
            workplace a personal touch through our expertise.
          </p>
        </div>
      </div>
    </section>
  );
}
