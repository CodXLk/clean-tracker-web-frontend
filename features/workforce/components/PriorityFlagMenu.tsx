"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Flag, Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type CriticalLevel = "LOW" | "MEDIUM" | "HIGH";

export const PRIORITY_META: Record<CriticalLevel, { label: string; text: string; fill: string; dot: string }> = {
  HIGH: { label: "High", text: "text-danger", fill: "#EF4444", dot: "bg-danger" },
  MEDIUM: { label: "Medium", text: "text-amber-500", fill: "#F59E0B", dot: "bg-amber-500" },
  LOW: { label: "Low", text: "text-grey-400", fill: "#9CA3AF", dot: "bg-grey-400" },
};

const PRIORITY_ORDER: CriticalLevel[] = ["HIGH", "MEDIUM", "LOW"];

interface PriorityFlagMenuProps {
  level: CriticalLevel;
  /** For the accessible label ("Priority for {name}"). */
  taskName: string;
  onChange: (level: CriticalLevel) => void;
  /** Show the level label beside the flag (e.g. in forms). */
  showLabel?: boolean;
}

/** A coloured flag showing a task's priority; clicking opens a dropdown to change it.
 *  The menu is portalled to the body so it isn't clipped by scroll containers or modals. */
export function PriorityFlagMenu({ level, taskName, onChange, showLabel = false }: PriorityFlagMenuProps) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const meta = PRIORITY_META[level];

  useEffect(() => {
    if (!open) return;
    function update() {
      const r = btnRef.current?.getBoundingClientRect();
      if (!r) return;
      const menuWidth = 168;
      const left = Math.max(8, Math.min(r.left, window.innerWidth - menuWidth - 8));
      setPos({ top: r.bottom + 6, left });
    }
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open]);

  return (
    <span className="relative inline-flex shrink-0">
      <button
        ref={btnRef}
        type="button"
        title={`Priority: ${meta.label} — click to change`}
        aria-label={`Priority for ${taskName}: ${meta.label}`}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className={cn(
          "flex items-center gap-1 rounded-md transition-colors hover:bg-grey-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          showLabel ? "border border-grey-300 px-2 py-1" : "h-6 w-6 justify-center",
          meta.text,
        )}
      >
        <Flag size={14} fill={meta.fill} strokeWidth={1.75} aria-hidden="true" />
        {showLabel && <span className="text-xs font-medium">{meta.label}</span>}
      </button>

      {open &&
        pos &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[100]"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
              }}
            />
            <div
              role="menu"
              style={{ top: pos.top, left: pos.left, width: 168 }}
              className="fixed z-[101] overflow-hidden rounded-xl border border-grey-200 bg-white p-1 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="px-3 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wide text-grey-400">
                Priority
              </p>
              {PRIORITY_ORDER.map((opt) => {
                const om = PRIORITY_META[opt];
                const active = opt === level;
                return (
                  <button
                    key={opt}
                    type="button"
                    role="menuitemradio"
                    aria-checked={active}
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpen(false);
                      if (opt !== level) onChange(opt);
                    }}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-grey-50",
                      active && "bg-grey-50",
                    )}
                  >
                    <Flag size={15} fill={om.fill} strokeWidth={1.75} className={om.text} aria-hidden="true" />
                    <span className={cn("flex-1 text-on-surface", active && "font-semibold")}>{om.label}</span>
                    {active && <Check size={14} className="text-primary" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
          </>,
          document.body,
        )}
    </span>
  );
}
