"use client";

import Image from "next/image";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useMediaQuery } from "@/hooks/useMediaQuery";

const CANVAS_W = 1512;
const CANVAS_H = 982;

const pct = (value: number, basis: number) => `${(value / basis) * 100}%`;

/**
 * Cloud cut-outs, positioned as Figma's "Hero Scene" frame lays them out on its
 * 1512x982 canvas — all five are the same 736px sprite, mirrored on the right.
 * `from` is the sprite's x in the Loading Scene frame, where every cloud starts
 * off-canvas and flies in horizontally.
 */
const CLOUDS = [
  { left: -26,  top: -63,  mirrored: false, from: -1610 },
  { left: 219,  top: -192, mirrored: false, from: -1855 },
  { left: 757,  top: 37,   mirrored: true,  from: 2509 },
  { left: 757,  top: 31,   mirrored: true,  from: 2509 },
  { left: 1038, top: -76,  mirrored: true,  from: 2509 },
] as const;

export function HeroScene() {
  const sceneRef    = useRef<HTMLElement>(null);
  const skyRef      = useRef<HTMLDivElement>(null);
  const cloudsRef   = useRef<HTMLDivElement>(null);
  const markRef     = useRef<HTMLDivElement>(null);
  const buildingRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);

  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  useGSAP(
    () => {
      // Without the timeline every layer already renders in its settled Hero
      // Scene position, so reduced motion simply skips the choreography — only
      // the loading mark, which is markup-hidden by default, stays hidden.
      if (!sceneRef.current || reduceMotion) return;

      const clouds = cloudsRef.current?.querySelectorAll<HTMLElement>("[data-cloud]") ?? [];
      const headlineParts =
        headlineRef.current?.querySelectorAll<HTMLElement>("[data-headline-part]") ?? [];

      gsap.set(markRef.current, { opacity: 1 });

      // Pinning the hero adds a spacer three viewports tall, which the document
      // does not have until this callback runs. A reload restores the previous
      // scroll offset *before* that — against a document 3 viewports shorter —
      // so the restored offset ends up pointing three viewports higher in the
      // finished page, dropping the visitor into the wrong section with the
      // timeline stuck mid-scrub. Only the top of the page means the same thing
      // before and after the spacer exists, so that is where a reload starts.
      //
      // Next's router owns this property and resets it to "auto" shortly after
      // mount, so setting it once here does not survive. It is only ever read
      // as the page is being unloaded, which is where we assert it instead.
      // The mode belongs to this history entry alone, so nothing leaks to the
      // pages the visitor moves on to.
      const keepPlaceOut = () => {
        if ("scrollRestoration" in history) history.scrollRestoration = "manual";
      };
      // `pagehide` rather than `beforeunload`: the latter would make the page
      // ineligible for the back/forward cache, which is too high a price.
      keepPlaceOut();
      window.addEventListener("pagehide", keepPlaceOut);

      // Late-arriving layout inputs — a web font swapping in, a hero image
      // decoding — shift every trigger measured before them. Re-measure once
      // they have settled rather than leaving the offsets stale.
      const refresh = () => ScrollTrigger.refresh();
      document.fonts?.ready.then(refresh).catch(() => {});
      window.addEventListener("load", refresh, { once: true });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sceneRef.current,
          start: "top top",
          end: "+=300%",
          scrub: 1,
          pin: true,
          anticipatePin: 1,
        },
      });

      // Beat 1 — the Loading Scene resolves into the Hero Scene: the centred
      // mark dissolves as the sky pulls back from its zoomed framing and the
      // clouds, building and split headline all travel in from off-canvas.
      tl.to(markRef.current, { opacity: 0, scale: 0.55, duration: 0.6, ease: "power2.in" }, 0);
      tl.fromTo(
        skyRef.current,
        { scale: 1.6, yPercent: 6 },
        { scale: 1, yPercent: 0, duration: 1.2, ease: "power2.out" },
        0,
      );
      clouds.forEach((cloud, i) => {
        tl.fromTo(
          cloud,
          { xPercent: Number(cloud.dataset.fromShift) },
          { xPercent: 0, duration: 1.2, ease: "power2.out" },
          0.1 + i * 0.06,
        );
      });
      tl.fromTo(
        buildingRef.current,
        { yPercent: 89 },
        { yPercent: 0, duration: 1.2, ease: "power2.out" },
        0.15,
      );
      tl.fromTo(
        headlineParts,
        { yPercent: 443, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: 1.1, ease: "power2.out", stagger: 0.08 },
        0.35,
      );

      // Beat 2 — the "Building scale scene": the tower grows to 2.24x and
      // settles downward while the clouds drift past and the headline clears.
      tl.to(
        buildingRef.current,
        { scale: 2.239, yPercent: 34, duration: 1.4, ease: "power1.inOut" },
        1.5,
      );
      tl.to(clouds, { yPercent: -18, opacity: 0, duration: 1, stagger: 0.04 }, 1.5);
      tl.to(headlineParts, { opacity: 0, yPercent: -18, duration: 0.7, stagger: 0.06 }, 1.6);

      // Beat 3 — the tower grows past the frame and dissolves while the sky
      // plate crossfades to the flat atmosphere the next section sits on.
      tl.to(buildingRef.current, { scale: 5.2, opacity: 0, duration: 1.1, ease: "power1.in" }, 2.5);
      tl.to(skyRef.current, { opacity: 0, duration: 0.9, ease: "power1.in" }, 2.6);

      return () => {
        window.removeEventListener("load", refresh);
        window.removeEventListener("pagehide", keepPlaceOut);
      };
    },
    { scope: sceneRef, dependencies: [reduceMotion] },
  );

  return (
    <section
      id="top"
      ref={sceneRef}
      data-nav-theme="light"
      aria-label="Introduction"
      className="relative h-screen min-h-[36rem] w-full overflow-hidden bg-atmos-top"
    >
      {/* Sky plate — Figma places the skyline photo at 2767x1557, offset to
          (-805, -267) on the 1512x982 canvas. */}
      <div ref={skyRef} className="absolute inset-0 will-change-transform">
        <div
          aria-hidden="true"
          className="absolute"
          style={{
            left:   pct(-805, CANVAS_W),
            top:    pct(-267, CANVAS_H),
            width:  pct(2767.059, CANVAS_W),
            height: pct(1557, CANVAS_H),
          }}
        >
          <Image
            src="/images/marketing/hero/sky.jpg"
            alt=""
            fill
            priority
            sizes="200vw"
            className="object-cover"
          />
        </div>
      </div>

      <div ref={cloudsRef} aria-hidden="true" className="absolute inset-0 overflow-hidden">
        {CLOUDS.map((cloud, i) => (
          <div
            key={i}
            data-cloud
            data-from-shift={((cloud.from - cloud.left) / 736) * 100}
            className="absolute aspect-square will-change-transform"
            style={{
              left:  pct(cloud.left, CANVAS_W),
              top:   pct(cloud.top, CANVAS_H),
              width: pct(736, CANVAS_W),
            }}
          >
            {/* The mirror lives on an inner element so the outer box stays free
                for GSAP's own transform. */}
            <div className={cloud.mirrored ? "relative size-full -scale-x-100" : "relative size-full"}>
              <Image
                src="/images/marketing/hero/cloud.webp"
                alt=""
                fill
                sizes="49vw"
                priority={i < 3}
                className="object-contain"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Loading Scene mark — 460x450, centred. Hidden unless the timeline runs.
          Centring sits on the outer box and the timeline drives the inner one.
          Tailwind centres with the `translate` property, which GSAP has to fold
          into its own matrix and then clear the moment it takes the element
          over; if it reads that property before the stylesheet has applied
          there is nothing to fold, and the centring is lost for good. Keeping
          the two on separate elements means GSAP never has to consume it. */}
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2"
        style={{ width: pct(460, CANVAS_W) }}
      >
        <div ref={markRef} className="opacity-0 will-change-transform">
          <Image
            src="/images/marketing/brand/logomark.png"
            alt=""
            width={920}
            height={900}
            priority
            className="h-auto w-full"
          />
        </div>
      </div>

      {/* Hero building — 540x968 at (487, 263). */}
      <div
        ref={buildingRef}
        className="absolute z-10 origin-center will-change-transform"
        style={{
          left:   pct(487, CANVAS_W),
          top:    pct(263, CANVAS_H),
          width:  pct(540, CANVAS_W),
          height: pct(968, CANVAS_H),
        }}
      >
        <Image
          src="/images/marketing/hero/building.webp"
          alt="A high-rise residential building serviced by Primeway, with one window open"
          fill
          priority
          sizes="36vw"
          className="object-contain object-top"
        />
      </div>

      {/* Split headline — 90px ExtraBold either side of the building. `contents`
          keeps it one accessible heading while each half is placed on canvas. */}
      <h1 ref={headlineRef} className="contents">
        <span
          data-headline-part
          className="pointer-events-none absolute z-20 font-heading text-hero font-extrabold leading-[1.08] tracking-tight text-accent will-change-transform"
          style={{ left: pct(59, CANVAS_W), top: pct(461, CANVAS_H) }}
        >
          YOUR
          <br />
          SUCCESS
        </span>
        <span
          data-headline-part
          className="pointer-events-none absolute z-20 text-right font-heading text-hero font-extrabold leading-[1.08] tracking-tight text-accent will-change-transform"
          style={{ right: pct(41, CANVAS_W), top: pct(461, CANVAS_H) }}
        >
          OUR
          <br />
          BUSINESS
        </span>
      </h1>
    </section>
  );
}
