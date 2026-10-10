"use client";

import { cn } from "@/lib/utils/cn";

interface FilterSelectProps<T extends string> {
  options: T[];
  value: T;
  onChange: (v: T) => void;
  getLabel?: (v: T) => string;
  /** Leading label shown before the dropdown. Defaults to "Status". */
  label?: string;
  className?: string;
}

/** A compact labelled dropdown for filtering a list by a single value (e.g. status). */
export function FilterSelect<T extends string>({
  options,
  value,
  onChange,
  getLabel,
  label = "Status",
  className,
}: FilterSelectProps<T>) {
  return (
    <label className={cn("inline-flex items-center gap-2 text-sm", className)}>
      {label && <span className="text-xs font-medium text-grey-500">{label}</span>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="h-10 rounded-xl border border-grey-300 bg-white px-3 text-sm text-on-surface outline-none focus:border-primary"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {getLabel ? getLabel(option) : option}
          </option>
        ))}
      </select>
    </label>
  );
}
