"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * Renders its children into <body> via a portal. Use for fixed-position overlays so an ancestor
 * with a transform, filter or backdrop-filter (which becomes the containing block for fixed
 * descendants) can't shrink the overlay to that ancestor's box — a common mobile layout bug.
 */
export function ModalPortal({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted || typeof document === "undefined") return null;
  return createPortal(children, document.body);
}
