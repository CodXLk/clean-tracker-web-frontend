"use client";

import { cn } from "@/lib/utils/cn";

interface SegmentedTabsProps<T extends string> {
  options:  readonly T[];
  value:    T;
  onChange: (v: T) => void;
  className?: string;
  getLabel?: (v: T) => string;
}

/**
 * General segmented control: a single muted track holding the tabs in one row,
 * with the active tab shown as a fully-rounded, brand-coloured pill. No dividers
 * between tabs. The row sits on a full-width bottom border that attaches it to
 * the content below. Scrolls horizontally on narrow screens so labels never clip.
 */
export function SegmentedTabs<T extends string>({
  options,
  value,
  onChange,
  className,
  getLabel,
}: SegmentedTabsProps<T>) {
  return (
    <div className={cn("w-full border-b border-line", className)}>
      <div
        role="tablist"
        className="inline-flex max-w-full gap-1 overflow-x-auto rounded-t-xl bg-surface-muted p-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {options.map((option) => {
          const isActive = option === value;
          return (
            <button
              key={option}
              role="tab"
              type="button"
              aria-selected={isActive}
              onClick={() => onChange(option)}
              className={cn(
                "whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-2/40 sm:px-6",
                isActive
                  ? "bg-brand-2 text-white shadow-sm"
                  : "text-body-2 hover:bg-white/70 hover:text-ink",
              )}
            >
              {getLabel ? getLabel(option) : option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
