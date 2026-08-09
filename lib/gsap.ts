import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * `toggleActions` for the landing page's reveal tweens, in ScrollTrigger's
 * order: onEnter, onLeave, onEnterBack, onLeaveBack.
 *
 * The reveal plays as its section scrolls in and rewinds when the section
 * leaves back off the top, so scrolling down to it a second time shows the
 * reveal again rather than a scene that is already settled. Do not swap this
 * for `once: true` — that kills the ScrollTrigger on the first enter, which
 * leaves the tween stuck at its finished state for the rest of the session.
 *
 * "play" rather than "restart" on the way in, so a reveal caught mid-rewind
 * resumes from where it is instead of snapping back to the start. Nothing
 * fires on leave/enter-back: past the section the tween is already settled,
 * and re-triggering it there would animate content the visitor can see.
 */
export const REVEAL_TOGGLE_ACTIONS = "play none none reverse";

export { gsap, ScrollTrigger };
