"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MoreVertical, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface RowMenuItem {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  destructive?: boolean;
}

interface RowMenuProps {
  items: RowMenuItem[];
  label?: string;
}

/**
 * A three-dots action menu. The dropdown is portalled to <body> and flips above the
 * trigger when there isn't room below, so it's never clipped by the table's overflow
 * container nor cut off for rows near the bottom of the viewport.
 */
export function RowMenu({ items, label = "Row actions" }: RowMenuProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const MENU_WIDTH = 208;
  const GAP = 6;
  const VIEWPORT_MARGIN = 8;
  // Approximate item height (py-2.5 + text) + container padding, to decide flip direction.
  const estimatedHeight = items.length * 41 + 8;

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    // Flip above the trigger when the menu wouldn't fit below.
    const openUp = spaceBelow < estimatedHeight + GAP + VIEWPORT_MARGIN && rect.top > spaceBelow;
    const top = openUp ? rect.top - estimatedHeight - GAP : rect.bottom + GAP;
    const left = Math.min(
      Math.max(VIEWPORT_MARGIN, rect.right - MENU_WIDTH),
      window.innerWidth - MENU_WIDTH - VIEWPORT_MARGIN,
    );
    setCoords({ top: Math.max(VIEWPORT_MARGIN, top), left });
  }, [open, estimatedHeight]);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (
        menuRef.current?.contains(e.target as Node) ||
        triggerRef.current?.contains(e.target as Node)
      ) {
        return;
      }
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onScroll() {
      setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-grey-500 transition-colors hover:bg-grey-100 hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <MoreVertical size={16} aria-hidden="true" />
      </button>

      {open &&
        coords &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{ position: "fixed", top: coords.top, left: coords.left, width: MENU_WIDTH }}
            className="z-[100] max-h-[80vh] overflow-y-auto rounded-xl border border-grey-200 bg-surface py-1 shadow-lg"
          >
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setOpen(false);
                    item.onClick();
                  }}
                  className={cn(
                    "flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm transition-colors hover:bg-grey-100 focus-visible:outline-none focus-visible:bg-grey-100",
                    item.destructive ? "text-error hover:text-error" : "text-on-surface",
                  )}
                >
                  {Icon && <Icon size={15} aria-hidden="true" className="shrink-0" />}
                  {item.label}
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </>
  );
}

