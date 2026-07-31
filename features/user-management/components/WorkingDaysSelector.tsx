"use client";

import { cn } from "@/lib/utils/cn";
import type { DayOfWeek } from "@/features/user-management/schemas/site.schema";

/** Sunday-first display order, matching the workforce calendar. */
const DISPLAY_ORDER: Array<{ value: DayOfWeek; short: string; label: string }> = [
  { value: "SUNDAY", short: "S", label: "Sunday" },
  { value: "MONDAY", short: "M", label: "Monday" },
  { value: "TUESDAY", short: "T", label: "Tuesday" },
  { value: "WEDNESDAY", short: "W", label: "Wednesday" },
  { value: "THURSDAY", short: "T", label: "Thursday" },
  { value: "FRIDAY", short: "F", label: "Friday" },
  { value: "SATURDAY", short: "S", label: "Saturday" },
];

interface WorkingDaysSelectorProps {
  value: DayOfWeek[];
  onChange?: (next: DayOfWeek[]) => void;
  /** Render as a non-interactive display (e.g. table rows, assignment modal). */
  readOnly?: boolean;
  size?: "sm" | "md";
  error?: string;
  className?: string;
}

/**
 * Seven day-of-week circles (S M T W T F S). Interactive by default; pass
 * `readOnly` for a compact display-only variant.
 */
export function WorkingDaysSelector({
  value,
  onChange,
  readOnly = false,
  size = "md",
  error,
  className,
}: WorkingDaysSelectorProps) {
  const circle = size === "sm" ? "h-6 w-6 text-[10px]" : "h-9 w-9 text-xs";

  function toggle(day: DayOfWeek) {
    if (readOnly || !onChange) return;
    onChange(value.includes(day) ? value.filter((d) => d !== day) : [...value, day]);
  }

  return (
    <div className={className}>
      <div className={cn("flex items-center", size === "sm" ? "gap-1" : "gap-2")}>
        {DISPLAY_ORDER.map((day) => {
          const selected = value.includes(day.value);
          const shared = cn(
            "flex items-center justify-center rounded-full font-semibold transition-colors",
            circle,
            selected ? "bg-primary text-white" : "bg-grey-100 text-grey-500",
          );
          if (readOnly) {
            return (
              <span key={day.value} className={shared} title={day.label} aria-hidden="true">
                {day.short}
              </span>
            );
          }
          return (
            <button
              key={day.value}
              type="button"
              aria-label={day.label}
              aria-pressed={selected}
              onClick={() => toggle(day.value)}
              className={cn(
                shared,
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
                !selected && "hover:bg-grey-200",
              )}
            >
              {day.short}
            </button>
          );
        })}
      </div>
      {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
    </div>
  );
}
