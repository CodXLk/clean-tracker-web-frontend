"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Building2, Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface SiteOption {
  id: string;
  name: string;
}

interface SiteFilterSelectProps {
  sites: SiteOption[];
  value: string;
  onChange: (siteId: string) => void;
  loading?: boolean;
  /** "field" matches the SearchInput size/font; "compact" is the calendar toolbar pill. */
  variant?: "compact" | "field";
  className?: string;
}

/** Compact typeahead site picker for the workforce toolbar (wildcard name search). */
export function SiteFilterSelect({ sites, value, onChange, loading, variant = "compact", className }: SiteFilterSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = sites.find((s) => s.id === value) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sites;
    return sites.filter((s) => s.name.toLowerCase().includes(q));
  }, [sites, query]);

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
      requestAnimationFrame(() => searchRef.current?.focus());
    }
  }, [open]);

  const isField = variant === "field";

  return (
    <div className={cn("relative", isField && "w-full sm:max-w-xs", className)} ref={containerRef}>
      <button
        type="button"
        aria-label="Select site"
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={loading}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center gap-2 rounded-xl border bg-surface text-on-surface outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60",
          isField
            ? "px-3 py-2.5 text-sm shadow-sm border-grey-300"
            : "min-w-[10rem] max-w-[15rem] px-3 py-2 text-xs font-medium border-grey-200 hover:border-grey-300 hover:bg-grey-100",
        )}
      >
        <Building2 size={isField ? 16 : 14} className="shrink-0 text-grey-400" aria-hidden="true" />
        <span className={cn("flex-1 truncate text-left", selected ? "text-on-surface" : "text-grey-500")}>
          {loading ? "Loading…" : selected ? selected.name : sites.length === 0 ? "No sites" : "Select site"}
        </span>
        <ChevronDown size={isField ? 16 : 14} className="shrink-0 text-grey-500" aria-hidden="true" />
      </button>

      {open && (
        <div
          className={cn(
            "absolute z-50 mt-1 overflow-hidden rounded-xl border border-grey-300 bg-white shadow-lg",
            isField ? "inset-x-0" : "right-0 w-64",
          )}
        >
          <div className="flex items-center gap-2 border-b border-grey-200 px-3 py-2">
            <Search size={isField ? 16 : 14} className="shrink-0 text-grey-500" aria-hidden="true" />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search sites…"
              className={cn(
                "w-full text-on-surface outline-none placeholder:text-grey-500",
                isField ? "text-sm" : "text-xs",
              )}
            />
          </div>
          <ul role="listbox" className={cn("overflow-y-auto py-1", isField ? "max-h-64" : "max-h-56")}>
            {filtered.length === 0 ? (
              <li className={cn("px-3 py-2.5 text-grey-500", isField ? "text-sm" : "text-xs")}>
                No sites match your search.
              </li>
            ) : (
              filtered.map((s) => {
                const isSelected = s.id === value;
                return (
                  <li key={s.id} role="option" aria-selected={isSelected}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange(s.id);
                        setOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center justify-between gap-2 px-3 text-left transition-colors hover:bg-grey-100",
                        isField ? "py-2.5 text-sm" : "py-2 text-xs",
                        isSelected && "bg-primary/5",
                      )}
                    >
                      <span className="truncate text-on-surface">{s.name}</span>
                      {isSelected && <Check size={isField ? 16 : 14} className="shrink-0 text-ink" aria-hidden="true" />}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
