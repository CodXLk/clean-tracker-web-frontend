/**
 * Anchor navigation for the landing page's nav bar and footer.
 *
 * `scrollIntoView` on its own leaves focus behind: the viewport travels but the
 * keyboard's position does not, so the next Tab continues from the link that was
 * just clicked rather than from the section it pointed at. These helpers move
 * both, and honour the visitor's motion preference while doing it.
 */
function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Scrolls to an in-page anchor (`"#services"`), or does nothing if it is absent. */
export function scrollToAnchor(hash: string) {
  const target = document.querySelector(hash);
  if (!(target instanceof HTMLElement)) return;

  target.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth" });

  // Anchor clicks are handled with `preventDefault`, so the hash never lands in
  // the URL and focus never moves on its own. `-1` makes the section focusable
  // without adding it to the tab order.
  target.setAttribute("tabindex", "-1");
  target.focus({ preventScroll: true });
}

/** Returns to the top of the document. */
export function scrollToTop() {
  window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
}
