"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { CertificateBadgeRow, type CertBadge } from "@/features/users/components/CertificateBadge";

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
  /** When true the option is shown but cannot be selected (view only). */
  disabled?: boolean;
  /** Reason shown when a disabled option is present (e.g. "Missing required certificates"). */
  disabledReason?: string;
  /** Compact certificate badges rendered next to the option label. */
  badges?: CertBadge[];
}

interface SearchableSelectProps {
  label?: string;
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
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  // Fixed-position placement so the menu escapes any scrollable/overflow-clipped modal body
  // and flips above the trigger when there's more room there.
  const [placement, setPlacement] = useState<{
    left: number;
    width: number;
    top?: number;
    bottom?: number;
    maxHeight: number;
  } | null>(null);

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

  const computePlacement = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const margin = 8;
    const gap = 4;
    const spaceBelow = window.innerHeight - rect.bottom - margin;
    const spaceAbove = rect.top - margin;
    const openUp = spaceBelow < 220 && spaceAbove > spaceBelow;
    const available = Math.max(160, openUp ? spaceAbove : spaceBelow);
    setPlacement({
      left: rect.left,
      width: rect.width,
      maxHeight: Math.min(available, 460),
      ...(openUp
        ? { bottom: window.innerHeight - rect.top + gap }
        : { top: rect.bottom + gap }),
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        (containerRef.current && containerRef.current.contains(target)) ||
        (dropdownRef.current && dropdownRef.current.contains(target))
      ) {
        return;
      }
      setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  // Keep the menu pinned to the trigger while open, even as the modal body scrolls or resizes.
  useEffect(() => {
    if (!open) return;
    computePlacement();
    const onChange = () => computePlacement();
    window.addEventListener("resize", onChange);
    window.addEventListener("scroll", onChange, true);
    return () => {
      window.removeEventListener("resize", onChange);
      window.removeEventListener("scroll", onChange, true);
    };
  }, [open, computePlacement]);

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
      {label && (
        <label className="text-sm font-medium text-on-surface">
          {label}
          {required && <span className="ml-0.5 text-error">*</span>}
        </label>
      )}

      <div className="relative">
        <button
          type="button"
          ref={triggerRef}
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

        {open && !isDisabled && placement &&
          createPortal(
            <div
              ref={dropdownRef}
              style={{
                position: "fixed",
                left: placement.left,
                width: placement.width,
                top: placement.top,
                bottom: placement.bottom,
                maxHeight: placement.maxHeight,
              }}
              className="z-[70] flex flex-col overflow-hidden rounded-xl border border-grey-300 bg-white shadow-lg"
            >
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
              <ul role="listbox" className="flex-1 overflow-y-auto py-1">
                {filtered.length === 0 ? (
                  <li className="px-3.5 py-3 text-sm text-grey-500">{emptyMessage}</li>
                ) : (
                  filtered.map((option) => {
                    const isSelected = option.value === value;
                    const isOptionDisabled = !!option.disabled;
                    return (
                      <li key={option.value} role="option" aria-selected={isSelected} aria-disabled={isOptionDisabled}>
                        <button
                          type="button"
                          disabled={isOptionDisabled}
                          title={isOptionDisabled ? option.disabledReason : undefined}
                          onClick={() => {
                            if (isOptionDisabled) return;
                            onChange(option.value);
                            setOpen(false);
                          }}
                          className={cn(
                            "flex w-full items-center justify-between gap-2 px-3.5 py-2 text-left text-sm transition-colors",
                            isOptionDisabled
                              ? "cursor-not-allowed opacity-60"
                              : "hover:bg-grey-100",
                            isSelected && "bg-primary/5",
                          )}
                        >
                          <span className="min-w-0 flex-1">
                            <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                              <span className="truncate text-on-surface">{option.label}</span>
                              {option.badges && option.badges.length > 0 && (
                                <CertificateBadgeRow badges={option.badges} />
                              )}
                            </span>
                            {option.sublabel && (
                              <span className="block truncate text-xs text-grey-500">{option.sublabel}</span>
                            )}
                            {isOptionDisabled && option.disabledReason && (
                              <span className="block truncate text-xs font-medium text-error">
                                {option.disabledReason}
                              </span>
                            )}
                          </span>
                          {isSelected && <Check size={16} className="shrink-0 text-ink" aria-hidden="true" />}
                        </button>
                      </li>
                    );
                  })
                )}
              </ul>
            </div>,
            document.body,
          )}
      </div>

      {hint && !error && <p className="text-xs text-grey-500">{hint}</p>}
      {error && <p className="text-xs font-medium text-error">{error}</p>}
    </div>
  );
}
