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

/**
 * Timeline position at which beat one has fully resolved into the Hero Scene —
 * the same position beat two is placed at below. Auto-advance travels exactly
 * this far and no further, so the page settles on the hero rather than carrying
 * on into the tower's growth.
 */
const HERO_SETTLED = 1.5;

/** How long the Loading Scene holds before the page advances itself, seconds. */
const AUTO_ADVANCE_HOLD = 1.6;
/** How long that automatic travel takes, seconds. */
const AUTO_ADVANCE_TRAVEL = 2.4;

/**
 * Input that means the visitor has taken the scroll into their own hands.
 * Deliberately not `scroll`: auto-advance scrolls the window itself, so a
 * scroll listener would cancel it on its own first frame.
 */
const TAKEOVER_EVENTS = ["wheel", "touchstart", "keydown", "mousedown"] as const;

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
      if (!sceneRef.current) return;

      // Reduced motion gates the auto-advance at the end of this effect, not
      // the scenes themselves. The choreography is scrubbed to the visitor's
      // own scrolling, so it only ever moves because they moved it; the page
      // scrolling itself is the part someone asking for stillness has not
      // agreed to, and that is what gets withheld.
      //
      // Read live rather than taken from `reduceMotion`: `useMediaQuery`
      // reports false on the first client render and only resolves in a
      // passive effect, long after this layout effect has run, and `useGSAP`
      // given a dependency array never reverts between dependency changes
      // (only on unmount) — so an auto-advance armed on that first pass would
      // outlive the correction and scroll the page anyway. `reduceMotion`
      // stays in the expression to keep the dependency honest: a preference
      // changed mid-session still re-runs this.
      const stillness =
        reduceMotion || window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
          // Three viewports of scroll suits a wide screen, where the scene has
          // room to read. On a phone the same distance is four screenfuls of
          // sky before the page begins, so the beats are given proportionally
          // less room. Resolved on refresh so rotating the device re-measures.
          end: () => (window.innerWidth < 1024 ? "+=170%" : "+=300%"),
          scrub: 1,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
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

      // ── Auto-advance out of the Loading Scene ────────────────────────────
      // The loading scene fills the screen and offers no visible sign that the
      // page continues, so visitors settle on it and wait. After a short hold
      // the page scrolls itself as far as the settled hero: the tower and
      // headline assemble on their own, and the fold below is revealed.
      //
      // This drives the real scroll position rather than the timeline. The pin,
      // the tower parallax in the sections below and the navbar's progress bar
      // are all scrubbed off the same scroll; advancing the timeline alone
      // would leave the page visually ahead of where the scrollbar says it is.
      let cancelled = false;
      let hold: gsap.core.Tween | null = null;
      let travel: gsap.core.Tween | null = null;

      const stopAutoAdvance = () => {
        cancelled = true;
        hold?.kill();
        travel?.kill();
        for (const type of TAKEOVER_EVENTS) window.removeEventListener(type, stopAutoAdvance);
      };

      const autoAdvance = () => {
        const st = tl.scrollTrigger;
        // Anyone who has already scrolled has answered the question this is
        // here to answer.
        if (cancelled || !st || st.end <= st.start || window.scrollY > 2) {
          stopAutoAdvance();
          return;
        }

        const scroller = { y: window.scrollY };
        travel = gsap.to(scroller, {
          y: st.start + (st.end - st.start) * (HERO_SETTLED / tl.duration()),
          duration: AUTO_ADVANCE_TRAVEL,
          ease: "power2.inOut",
          // `behavior: "instant"` because `html` carries `scroll-behavior:
          // smooth` for anchor links. Without the override each frame of this
          // tween would kick off its own smooth scroll and fight the next one.
          onUpdate: () => window.scrollTo({ top: scroller.y, behavior: "instant" }),
          onComplete: stopAutoAdvance,
        });
      };

      // Held until `load` so the hold is spent on a scene that has actually
      // finished painting, rather than on half-decoded hero images.
      const scheduleAutoAdvance = () => {
        if (cancelled) return;
        hold = gsap.delayedCall(AUTO_ADVANCE_HOLD, autoAdvance);
      };

      // Everything above runs for everyone; only the page moving on its own is
      // withheld from a visitor who asked for stillness. They still get the
      // whole hero — it just waits for them to scroll it.
      if (!stillness) {
        if (document.readyState === "complete") scheduleAutoAdvance();
        else window.addEventListener("load", scheduleAutoAdvance, { once: true });

        for (const type of TAKEOVER_EVENTS) {
          window.addEventListener(type, stopAutoAdvance, { passive: true });
        }
      }

      return () => {
        stopAutoAdvance();
        window.removeEventListener("load", scheduleAutoAdvance);
        window.removeEventListener("load", refresh);
        window.removeEventListener("pagehide", keepPlaceOut);
      };
    },
    // `revertOnUpdate` because `useGSAP` given a dependency array otherwise
    // reverts only on unmount: when `useMediaQuery` resolves and flips
    // `reduceMotion`, the callback re-runs and would lay a second timeline and
    // a second pin on top of the first — measurably, a document one whole pin
    // distance too long. Reverting first means each pass replaces the last.
    { scope: sceneRef, dependencies: [reduceMotion], revertOnUpdate: true },
  );

  return (
    <section
      id="top"
      ref={sceneRef}
      data-nav-theme="light"
      aria-label="Introduction"
      // `svh` rather than `vh`: on mobile the collapsing URL bar would otherwise
      // change the scene height mid-scroll and drag every pinned offset with it.
      className="relative h-[100svh] min-h-[30rem] w-full overflow-hidden bg-atmos-top"
    >
      {/* Sky plate — the source photo is already framed tight on the skyline,
          so it fills the scene directly with no extra crop offset. */}
      <div ref={skyRef} className="absolute inset-0 will-change-transform">
        <Image
          src="/images/marketing/hero/sky.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
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

      {/* Tower and headline.
          On the Figma canvas (from `lg`) the two are placed independently, the
          headline reading either side of the tower. Below that there is no
          "either side" — and positioning them independently meant that for any
          given viewport ratio they might or might not collide, which they did
          at 320x568, 768x1024, 1023x800 and others.
          So beneath `lg` they share a column: the tower takes whatever height is
          left over (`flex-1`, letterboxed inside it by `object-contain`) and the
          headline takes what it needs underneath. They cannot overlap at any
          ratio because they are no longer independent. From `lg` the wrapper is
          `display: contents` and both revert to their canvas coordinates. */}
      <div className="absolute inset-0 flex flex-col items-center justify-end gap-[3%] px-5 pb-[7%] pt-[13%] lg:contents">
        <div
          ref={buildingRef}
          className={
            "relative z-10 min-h-0 w-[64%] flex-1 origin-center will-change-transform " +
            "sm:w-[52%] " +
            "lg:absolute lg:left-[32.209%] lg:top-[26.782%] lg:h-[98.574%] lg:w-[35.714%] lg:flex-none"
          }
        >
          <Image
            src="/images/marketing/hero/building.webp"
            alt="A high-rise residential building serviced by Primeway, with one window open"
            fill
            priority
            sizes="(max-width: 640px) 64vw, (max-width: 1024px) 52vw, 36vw"
            className="object-contain object-bottom lg:object-top"
          />
        </div>

        {/* Split headline — 90px ExtraBold either side of the building. Each
            half sets on one line when stacked, wrapping to two only when the
            screen is too narrow even for that. */}
        <h1
          ref={headlineRef}
          className="pointer-events-none z-20 flex w-full flex-col items-center gap-[0.08em] text-center lg:contents"
        >
          <span
            data-headline-part
            className="font-heading text-[clamp(2rem,8vw,3.5rem)] font-extrabold leading-[1.08] tracking-tight text-accent will-change-transform lg:pointer-events-none lg:absolute lg:z-20 lg:text-hero lg:left-[3.902%] lg:top-[46.945%] lg:text-left"
          >
            YOUR <br className="hidden lg:inline" />
            SUCCESS
          </span>
          <span
            data-headline-part
            className="font-heading text-[clamp(2rem,8vw,3.5rem)] font-extrabold leading-[1.08] tracking-tight text-accent will-change-transform lg:pointer-events-none lg:absolute lg:z-20 lg:text-hero lg:right-[2.712%] lg:top-[46.945%] lg:text-right"
          >
            OUR <br className="hidden lg:inline" />
            BUSINESS
          </span>
        </h1>
      </div>
    </section>
  );
}
