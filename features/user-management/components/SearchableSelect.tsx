"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface SearchableSelectProps {
  label: string;
  options: SelectOption[];
  value: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  required?: boolean;
  disabled?: boolean;
  loading?: boolean;
  error?: string;
  emptyMessage?: string;
  hint?: string;
}

export function SearchableSelect({
  label,
  options,
  value,
  onChange,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  required,
  disabled,
  loading,
  error,
  emptyMessage = "No results found",
  hint,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.value === value) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.sublabel ? o.sublabel.toLowerCase().includes(q) : false),
    );
  }, [options, query]);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  useEffect(() => {
    if (open) {
      setQuery("");
      // Focus the search field once the panel is rendered.
      requestAnimationFrame(() => searchRef.current?.focus());
    }
  }, [open]);

  const isDisabled = disabled || loading;

  return (
    <div className="flex flex-col gap-1.5" ref={containerRef}>
      <label className="text-sm font-medium text-on-surface">
        {label}
        {required && <span className="ml-0.5 text-error">*</span>}
      </label>

      <div className="relative">
        <button
          type="button"
          disabled={isDisabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "flex h-11 w-full items-center justify-between gap-2 rounded-xl border bg-white px-3.5 text-left text-sm outline-none transition-colors",
            "focus:border-primary focus:ring-2 focus:ring-primary/20",
            error ? "border-error" : "border-grey-300",
            isDisabled && "cursor-not-allowed bg-grey-100 opacity-70",
          )}
        >
          <span className={cn("truncate", selected ? "text-on-surface" : "text-grey-500/70")}>
            {loading ? "Loading…" : selected ? selected.label : placeholder}
          </span>
          <ChevronDown size={16} className="shrink-0 text-grey-500" aria-hidden="true" />
        </button>

        {open && !isDisabled && (
          <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-grey-300 bg-white shadow-lg">
            <div className="flex items-center gap-2 border-b border-grey-200 px-3 py-2">
              <Search size={15} className="shrink-0 text-grey-500" aria-hidden="true" />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full text-sm text-on-surface outline-none placeholder:text-grey-500/70"
              />
            </div>
            <ul role="listbox" className="max-h-56 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <li className="px-3.5 py-3 text-sm text-grey-500">{emptyMessage}</li>
              ) : (
                filtered.map((option) => {
                  const isSelected = option.value === value;
                  return (
                    <li key={option.value} role="option" aria-selected={isSelected}>
                      <button
                        type="button"
                        onClick={() => {
                          onChange(option.value);
                          setOpen(false);
                        }}
                        className={cn(
                          "flex w-full items-center justify-between gap-2 px-3.5 py-2 text-left text-sm transition-colors hover:bg-grey-100",
                          isSelected && "bg-primary/5",
                        )}
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-on-surface">{option.label}</span>
                          {option.sublabel && (
                            <span className="block truncate text-xs text-grey-500">{option.sublabel}</span>
                          )}
                        </span>
                        {isSelected && <Check size={16} className="shrink-0 text-primary" aria-hidden="true" />}
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        )}
      </div>

      {hint && !error && <p className="text-xs text-grey-500">{hint}</p>}
      {error && <p className="text-xs font-medium text-error">{error}</p>}
    </div>
  );
}
