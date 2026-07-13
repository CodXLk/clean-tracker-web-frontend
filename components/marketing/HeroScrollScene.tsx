"use client";

import { useRef } from "react";
import Image from "next/image";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";

const COLLAGE_TILES = [
  { top: "5%",  left: "8%",  rotate: -18, size: 160 },
  { top: "10%", left: "78%", rotate: 22,  size: 140 },
  { top: "60%", left: "85%", rotate: -12, size: 170 },
  { top: "70%", left: "4%",  rotate: 16,  size: 150 },
  { top: "2%",  left: "42%", rotate: 8,   size: 130 },
  { top: "78%", left: "40%", rotate: -20, size: 140 },
  { top: "35%", left: "2%",  rotate: 24,  size: 150 },
  { top: "38%", left: "88%", rotate: -8,  size: 160 },
] as const;

export function HeroScrollScene() {
  const pinRef       = useRef<HTMLElement>(null);
  const tilesRef      = useRef<HTMLDivElement>(null);
  const logoRef       = useRef<HTMLDivElement>(null);
  const buildingWrapRef = useRef<HTMLDivElement>(null);
  const buildingImgRef  = useRef<HTMLDivElement>(null);
  const introTextRef  = useRef<HTMLDivElement>(null);
  const splitTextRef  = useRef<HTMLDivElement>(null);
  const bgRef         = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!pinRef.current) return;

      const tiles = tilesRef.current?.querySelectorAll<HTMLElement>("[data-tile]") ?? [];

      // Figma's own scene sequence — Loading Scene -> Hero Scene -> Building scale scene -> Open
      // Who Are We scene — is: (1) scattered loading tiles + centered logo, (2) tiles clear and the
      // building photo + headline settle in, (3) the building photo scales up dramatically, well past
      // full-viewport size, (4) it fades out entirely as the white "Who We Are" section is revealed
      // underneath. This timeline reproduces those four beats instead of a single scale/fade.
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: pinRef.current,
          start: "top top",
          end: "+=280%",
          scrub: 1,
          pin: true,
          anticipatePin: 1,
        },
      });

      // Beat 1 (0 -> 1): scattered tiles clear away, loading logo fades
      tl.to(tiles, {
        scale: 0.5,
        opacity: 0,
        duration: 1,
        stagger: 0.05,
        ease: "power1.in",
      }, 0);
      tl.to(logoRef.current, { opacity: 0, scale: 0.7, duration: 0.8 }, 0.3);

      // Beat 2 (0.6 -> 1.8): building photo settles in and the intro headline appears
      tl.fromTo(
        buildingWrapRef.current,
        { opacity: 0, scale: 0.55, y: 60 },
        { opacity: 1, scale: 1, y: 0, duration: 1.1, ease: "power2.out" },
        0.6,
      );
      tl.fromTo(
        introTextRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6 },
        1.3,
      );

      // Beat 3 (2.0 -> 3.2): dramatic zoom-in on the building (matches Figma's "Building scale
      // scene", where the photo grows to well beyond frame size) while the intro headline clears
      // and the split "YOUR SUCCESS / OUR BUSINESS" headline takes over
      tl.to(introTextRef.current, { opacity: 0, y: -20, duration: 0.4 }, 2.0);
      tl.to(
        buildingImgRef.current,
        { scale: 2.4, duration: 2.2, ease: "power1.inOut" },
        2.0,
      );
      tl.fromTo(
        splitTextRef.current?.querySelectorAll("[data-split]") ?? [],
        { opacity: 0, x: (i: number) => (i === 0 ? -80 : 80) },
        { opacity: 1, x: 0, duration: 0.8, stagger: 0.1 },
        2.3,
      );

      // Beat 4 (3.2 -> 4.0): the building photo dissolves away, revealing the section beneath as
      // the pin releases — the scattered sky background also fades so the handoff into the teal
      // "Who We Are" section reads as a clean crossfade rather than a hard cut
      tl.to(buildingWrapRef.current, { opacity: 0, duration: 0.8, ease: "power1.in" }, 3.2);
      tl.to(splitTextRef.current, { opacity: 0, duration: 0.6 }, 3.4);
      tl.to(bgRef.current, { opacity: 0, duration: 0.8 }, 3.2);
    },
    { scope: pinRef, dependencies: [] },
  );

  return (
    <section
      id="top"
      ref={pinRef}
      className="relative flex h-screen min-h-[640px] w-full items-center justify-center overflow-hidden bg-primary"
    >
      <div
        ref={bgRef}
        className="absolute inset-0 bg-gradient-to-b from-[#7ba7bd] via-[#a9c2ce] to-[#e9e2d3]"
      />

      {/* Scattered loading collage tiles */}
      <div ref={tilesRef} aria-hidden="true" className="pointer-events-none absolute inset-0">
        {COLLAGE_TILES.map((tile, i) => (
          <div
            key={i}
            data-tile
            className="absolute overflow-hidden rounded-[28px] opacity-70"
            style={{
              top: tile.top,
              left: tile.left,
              width: tile.size,
              height: tile.size,
              transform: `rotate(${tile.rotate}deg)`,
            }}
          >
            <Image
              src="/images/marketing/hero/loading-collage-tile.png"
              alt=""
              fill
              sizes="170px"
              className="object-contain"
            />
          </div>
        ))}
      </div>

      {/* Centered logo (loading state) */}
      <div ref={logoRef} className="absolute z-10">
        <Image
          src="/images/marketing/brand/logo-full.png"
          alt="Primeway Property Services"
          width={220}
          height={98}
          priority
          className="h-auto w-[160px] sm:w-[220px]"
        />
      </div>

      {/* Hero building photo — outer wrapper fades/settles in, inner element does the dramatic zoom */}
      <div ref={buildingWrapRef} className="relative z-0 h-[85%] w-auto opacity-0">
        <div ref={buildingImgRef} className="h-full w-auto">
          <Image
            src="/images/marketing/hero/hero-building.png"
            alt="Primeway-serviced building facade"
            width={572}
            height={1024}
            priority
            className="h-full w-auto object-contain drop-shadow-2xl"
          />
        </div>
      </div>

      {/* Intro headline */}
      <div
        ref={introTextRef}
        className="pointer-events-none absolute inset-x-0 bottom-[14%] z-20 px-6 text-center opacity-0"
      >
        <h1 className="font-heading text-3xl font-extrabold text-white drop-shadow-lg sm:text-5xl lg:text-6xl">
          Your Clean, Our Care.
        </h1>
      </div>

      {/* Split "Your Success / Our Business" headline */}
      <div
        ref={splitTextRef}
        className="pointer-events-none absolute inset-0 z-20 hidden items-center justify-between px-6 sm:flex sm:px-10 lg:px-20"
      >
        <p
          data-split
          className="font-heading text-4xl font-extrabold leading-[1.05] text-[#ED5F25] opacity-0 drop-shadow-lg lg:text-6xl"
        >
          YOUR
          <br />
          SUCCESS
        </p>
        <p
          data-split
          className="font-heading text-right text-4xl font-extrabold leading-[1.05] text-[#ED5F25] opacity-0 drop-shadow-lg lg:text-6xl"
        >
          OUR
          <br />
          BUSINESS
        </p>
      </div>

      {/* Scroll cue */}
      <div className="absolute bottom-6 left-1/2 z-20 -translate-x-1/2 animate-bounce text-xs font-medium text-white/80">
        Scroll
      </div>
    </section>
  );
}
