import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * The marketing type scale (`--text-hero` … `--text-body-lg` in globals.css)
 * adds font-size utilities tailwind-merge does not know about. Left
 * unregistered it reads `text-section` as a *colour* — the group `text-black`
 * belongs to — decides the two conflict, and drops whichever came first. That
 * silently rendered every section heading at the inherited 16px instead of the
 * 55px the design calls for.
 *
 * Registering the scale puts these classes in the `font-size` group, where they
 * only ever conflict with other sizes.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        { text: ["hero", "section", "lead", "subhead", "quote", "nav", "body-lg"] },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
