"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

interface ImageLightboxProps {
  /** Image URL (blob: preview or a served photo). Null hides the lightbox. */
  src: string | null;
  alt?: string;
  onClose: () => void;
}

/** Full-screen preview shown when a small photo thumbnail is clicked. */
export function ImageLightbox({ src, alt = "Photo preview", onClose }: ImageLightboxProps) {
  useEffect(() => {
    if (!src) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [src, onClose]);

  if (!src) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Photo preview"
      onClick={onClose}
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 p-4"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close preview"
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25"
      >
        <X size={22} />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] max-w-[94vw] rounded-lg object-contain shadow-2xl"
      />
    </div>
  );
}
