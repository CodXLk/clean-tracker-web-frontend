import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * `toggleActions` for the landing page's reveal tweens, in ScrollTrigger's
 * order: onEnter, onLeave, onEnterBack, onLeaveBack.
 *
 * All four slots act, so a section animates whenever it enters the viewport
 * and rewinds whenever it leaves — by either edge, travelling either way.
 *
 * The two "back" slots are the ones that make scrolling up work. A reveal is
 * anchored to its section's *top* crossing ~70% of the viewport: going down
 * that is the section arriving, so the animation is played out in front of
 * you, but going up it is the section almost gone off the bottom. With
 * nothing on `onEnterBack`, a section scrolled back into view from the top
 * arrived already finished and simply sat there — measurably pinned at
 * opacity 1 for the whole time it was on screen — and the only rewind
 * happened once it had all but left. Firing on `onLeave`/`onEnterBack` (at
 * `end`, where the section is off the top and nothing is visible to disturb)
 * resets it out of sight, so it plays again as it comes back down the screen.
 *
 * Do not swap this for `once: true` — that kills the ScrollTrigger on the
 * first enter, leaving the tween stuck at its finished state for the session.
 */
export const REVEAL_TOGGLE_ACTIONS = "play reverse play reverse";

export { gsap, ScrollTrigger };
