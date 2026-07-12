"use client";

import { cn } from "@/lib/utils/cn";

interface FilterTabsProps<T extends string> {
  options:  T[];
  value:    T;
  onChange: (v: T) => void;
  className?: string;
}

export function FilterTabs<T extends string>({
  options,
  value,
  onChange,
  className,
}: FilterTabsProps<T>) {
  return (
    <div className={cn("flex gap-2 flex-wrap", className)} role="tablist">
      {options.map((option) => {
        const isActive = option === value;
        return (
          <button
            key={option}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(option)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm transition-colors",
              isActive
                ? "bg-primary text-white font-medium"
                : "border border-primary text-primary hover:bg-primary/10",
            )}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
