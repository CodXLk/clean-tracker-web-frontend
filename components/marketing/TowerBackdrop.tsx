"use client";

import Image from "next/image";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";

/**
 * The Aspire Tower render, shared by the Industries and Why Choose Us scenes.
 *
 * Both scenes used to mount a tower of their own. Because the Industries copy
 * is sticky and the Why Choose Us copy scrolled with its section, the two were
 * on screen together across the handover at different anchors — the building
 * appeared cut in half, one part sliding while the other stood still. One
 * element spanning both sections removes the seam by construction: there is
 * only ever one tower, so there is nothing to line up.
 *
 * Figma draws it at 3059x1708 on the 1512x982 canvas in both scenes, anchored
 * at (-773.5, -214) for the Industries tiles and (-1147, -486) for Why Choose
 * Us. Same size, so moving between them is a pure translation.
 */
const TOWER_FRAME = {
  left: "-51.16%",
  // Every measurement here is a share of the scene's *width*, so the tower
  // scales uniformly with it and the composition holds at any size.
  //
  // `marginTop` rather than `top` carries the vertical offset on purpose:
  // percentage margins resolve against the containing block's width, while a
  // percentage `top` would resolve against its height. Height is fixed at one
  // viewport, so a percentage `top` could not scale with the scene — and the
  // box would stop matching the image's 1.79 aspect, at which point
  // `object-contain` letterboxes and the tower drifts inside its own frame.
  // -214/1512 of the canvas, the same offset the design gives it.
  top: 0,
  marginTop: "-14.153%",
  width: "202.31%",
  aspectRatio: "3059 / 1708",
} as const;

/**
 * The earlier Industries beat, where the tower sits right of the copy — the
 * 2425x1354 at (-93, 31) framing, expressed as a transform off the layout
 * above so the scrub only ever touches compositor properties.
 */
const TOWER_TEXT_FRAMING = { scale: 0.7927, xPercent: 11.885, yPercent: 3.982 } as const;

/**
 * Why Choose Us, as a share of the 1512x982 scene box:
 * (-1147 - -773.5) / 1512 and (-486 - -214) / 982.
 *
 * Applied to the camera wrapper rather than the tower itself. The wrapper is
 * scene-sized, so these percentages resolve against the canvas exactly as
 * Figma's numbers do — and keeping the two moves on separate elements means
 * the Industries scrub and this one never write the same property.
 */
const TOWER_WHY_FRAMING = { xPercent: -24.702, yPercent: -27.698 } as const;

export function TowerBackdrop() {
  const rootRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<HTMLDivElement>(null);
  const towerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // The two scenes are addressed by id because this backdrop is mounted as
      // their sibling — it cannot hold refs into either of them.
      const industries = document.querySelector("#industries");
      const why = document.querySelector("#why-choose-us");

      if (industries && towerRef.current) {
        gsap.from(towerRef.current, {
          ...TOWER_TEXT_FRAMING,
          ease: "none",
          scrollTrigger: {
            trigger: industries,
            start: "top top",
            end: "bottom bottom",
            scrub: 1,
          },
        });
      }

      if (why && cameraRef.current) {
        // Picks up exactly where the Industries scrub finishes: that tween ends
        // with the section's bottom at the viewport bottom, which is the same
        // scroll position as this one's "top bottom". The camera then travels
        // for one viewport, so the tower has reached its Why Choose Us framing
        // by the time that scene fills the screen.
        gsap.to(cameraRef.current, {
          ...TOWER_WHY_FRAMING,
          ease: "none",
          scrollTrigger: {
            trigger: why,
            start: "top bottom",
            end: "top top",
            scrub: 1,
          },
        });
      }
    },
    { scope: rootRef },
  );

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      // Full-bleed. Capped at the 1512px design canvas, the scene left bars of
      // bare atmosphere down either side of the tower on wider displays — the
      // clip, not the image, was what stopped at 1512. Below that width this
      // changes nothing, since the cap never bound there.
      className="pointer-events-none absolute inset-0"
      // The scene ends where this element does, and the sticky viewport comes
      // to rest against that edge — so the tower used to be cut off by a hard
      // horizontal line straight through the building, with Get a Quote
      // starting below it as a separate slab. Dissolving the last stretch
      // hands the building over to the atmosphere instead.
      //
      // An alpha mask rather than a gradient in the atmosphere's own colour:
      // the page's backdrop is a fixed top-to-bottom gradient, so the shade
      // behind this edge depends on where it sits in the viewport, and any
      // fixed colour would match at one scroll position and band at every
      // other. Fading to transparent lets the real backdrop through, so it
      // agrees by construction.
      //
      // Measured from the bottom, so it only ever covers the resting sticky
      // viewport — the scenes above scroll past untouched.
      style={{
        WebkitMaskImage: "linear-gradient(to bottom, #000 calc(100% - 11rem), transparent 100%)",
        maskImage: "linear-gradient(to bottom, #000 calc(100% - 11rem), transparent 100%)",
      }}
    >
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        {/* The camera box carries the design canvas's own 1512:982 ratio rather
            than filling the scene, so the move below scales with the tower.
            `yPercent` is a share of this box: left at one viewport tall it
            would stay a flat 272px however large the tower grew, and the
            framing would lose the tower's base on wide displays. At 1512 the
            box is exactly one viewport, so nothing changes at the design size —
            and at every other width the whole scene is simply the same
            composition, scaled. */}
        <div
          ref={cameraRef}
          className="absolute inset-x-0 top-0 aspect-[1512/982] will-change-transform"
        >
          <div ref={towerRef} className="absolute will-change-transform" style={TOWER_FRAME}>
            <Image
              src="/images/marketing/industries/tower.webp"
              alt=""
              fill
              sizes="205vw"
              className="object-contain object-top"
            />
          </div>
        </div>

        {/* On the `lg` canvas both scenes keep their copy in clear sky beside
            the tower. Once the layout stacks there is no "beside" left and the
            text lands on the glass, so the tower is banked down behind a scrim
            at those sizes only. Outside the camera wrapper, so it stays put
            while the tower travels. */}
        <div className="absolute inset-0 bg-gradient-to-b from-atmos-top via-atmos-top/90 to-atmos-top/45 lg:hidden" />
      </div>
    </div>
  );
}
