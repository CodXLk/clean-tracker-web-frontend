"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { PillButtonVariant } from "@/components/shared/PillButton";

export type SlideButtonVariant = Exclude<PillButtonVariant, "success"> | "checkout";

const THUMB_SIZE    = 48; // matches h-12 w-12
const TRACK_PADDING = 4;  // matches p-1
const COMPLETE_PCT  = 0.85;

const TRACK_CLASSES: Record<SlideButtonVariant | "success", string> = {
  orange:   "bg-status-pending",
  teal:     "bg-primary",
  checkout: "bg-danger",
  success:  "bg-success",
};

interface SlideButtonProps {
  label:            string;
  onComplete:       () => void;
  variant?:         SlideButtonVariant;
  completedLabel?:  string;
  disabled?:        boolean;
  className?:       string;
}

export function SlideButton({
  label,
  onComplete,
  variant = "teal",
  completedLabel = "Completed",
  disabled = false,
  className,
}: SlideButtonProps) {
  const [thumbX, setThumbX]         = useState(0);
  const [isCompleted, setCompleted] = useState(false);
  const [isDragging, setDragging]   = useState(false);

  const trackRef   = useRef<HTMLDivElement>(null);
  const startXRef  = useRef(0);
  const thumbXRef  = useRef(0); // keeps latest thumbX in sync for event handlers

  const getMaxX = useCallback(() => {
    if (!trackRef.current) return 0;
    return trackRef.current.offsetWidth - THUMB_SIZE - TRACK_PADDING * 2;
  }, []);

  const triggerComplete = useCallback(() => {
    const maxX = getMaxX();
    setThumbX(maxX);
    setTimeout(() => {
      setCompleted(true);
      setThumbX(0);
      onComplete();
    }, 200);
  }, [getMaxX, onComplete]);

  const onDragStart = useCallback(
    (clientX: number) => {
      if (disabled || isCompleted) return;
      setDragging(true);
      startXRef.current = clientX;
    },
    [disabled, isCompleted],
  );

  const onDragMove = useCallback(
    (clientX: number) => {
      if (!isDragging) return;
      const maxX = getMaxX();
      const next = Math.max(0, Math.min(clientX - startXRef.current, maxX));
      thumbXRef.current = next;
      setThumbX(next);
    },
    [isDragging, getMaxX],
  );

  const onDragEnd = useCallback(() => {
    if (!isDragging) return;
    setDragging(false);
    const maxX = getMaxX();
    if (thumbXRef.current >= maxX * COMPLETE_PCT) {
      triggerComplete();
    } else {
      setThumbX(0);
    }
  }, [isDragging, getMaxX, triggerComplete]);

  /* Attach window-level move/up listeners only while dragging */
  useEffect(() => {
    if (!isDragging) return;

    const onMouseMove  = (e: MouseEvent)  => onDragMove(e.clientX);
    const onTouchMove  = (e: TouchEvent)  => onDragMove(e.touches[0].clientX);

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup",   onDragEnd);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend",  onDragEnd);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup",   onDragEnd);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend",  onDragEnd);
    };
  }, [isDragging, onDragMove, onDragEnd]);

  const trackVariant: SlideButtonVariant | "success" = isCompleted ? "success" : variant;

  return (
    <div
      ref={trackRef}
      role="button"
      aria-label={isCompleted ? completedLabel : label}
      className={cn(
        "relative flex h-14 w-full select-none items-center rounded-full p-1 transition-colors duration-300",
        TRACK_CLASSES[trackVariant],
        disabled && !isCompleted && "opacity-50",
        className,
      )}
    >
      {/* Thumb — the draggable circle */}
      <div
        onMouseDown={(e) => { e.preventDefault(); onDragStart(e.clientX); }}
        onTouchStart={(e) => onDragStart(e.touches[0].clientX)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); triggerComplete(); }
        }}
        tabIndex={disabled || isCompleted ? -1 : 0}
        aria-hidden="true"
        style={{
          transform:  `translateX(${thumbX}px)`,
          transition: isDragging ? "none" : "transform 300ms ease-out",
        }}
        className={cn(
          "relative z-10 flex h-12 w-12 shrink-0 cursor-grab items-center justify-center rounded-full bg-black/20 active:cursor-grabbing",
          isCompleted && "cursor-default",
        )}
      >
        {isCompleted ? (
          <Check size={20} className="text-white" strokeWidth={2.5} />
        ) : (
          <ArrowRight size={20} className="text-white" strokeWidth={2.5} />
        )}
      </div>

      {/* Label — always centered over the full track */}
      <span
        className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm font-semibold text-white"
      >
        {isCompleted ? completedLabel : label}
      </span>
    </div>
  );
}
