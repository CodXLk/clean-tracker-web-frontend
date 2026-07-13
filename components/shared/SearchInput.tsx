"use client";

import { Search } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface SearchInputProps {
  value:       string;
  onChange:    (value: string) => void;
  placeholder: string;
  className?:  string;
}

export function SearchInput({ value, onChange, placeholder, className }: SearchInputProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-xl border border-grey-300 bg-surface px-3 py-2.5 shadow-sm",
        className,
      )}
    >
      <Search size={16} className="shrink-0 text-grey-500" aria-hidden="true" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full text-sm text-on-surface outline-none placeholder:text-grey-500"
      />
    </div>
  );
}
