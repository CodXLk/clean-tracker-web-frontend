"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
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
}

/** Compact typeahead site picker for the workforce toolbar (wildcard name search). */
export function SiteFilterSelect({ sites, value, onChange, loading }: SiteFilterSelectProps) {
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

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        aria-label="Select site"
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={loading}
        onClick={() => setOpen((v) => !v)}
        className="flex min-w-[9rem] max-w-[14rem] items-center justify-between gap-2 rounded-lg border border-grey-200 bg-surface px-2.5 py-1.5 text-xs font-medium text-on-surface outline-none transition-colors hover:bg-grey-100 focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60"
      >
        <span className={cn("truncate", selected ? "text-on-surface" : "text-grey-500")}>
          {loading ? "Loading…" : selected ? selected.name : sites.length === 0 ? "No sites" : "Select site"}
        </span>
        <ChevronDown size={14} className="shrink-0 text-grey-500" aria-hidden="true" />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-1 w-64 overflow-hidden rounded-xl border border-grey-300 bg-white shadow-lg">
          <div className="flex items-center gap-2 border-b border-grey-200 px-3 py-2">
            <Search size={14} className="shrink-0 text-grey-500" aria-hidden="true" />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search sites…"
              className="w-full text-xs text-on-surface outline-none placeholder:text-grey-500"
            />
          </div>
          <ul role="listbox" className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2.5 text-xs text-grey-500">No sites match your search.</li>
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
                        "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-grey-100",
                        isSelected && "bg-primary/5",
                      )}
                    >
                      <span className="truncate text-on-surface">{s.name}</span>
                      {isSelected && <Check size={14} className="shrink-0 text-primary" aria-hidden="true" />}
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
