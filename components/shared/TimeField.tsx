"use client";

import { useEffect, useRef, useState } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface TimeFieldProps {
  label?: string;
  value?: string; // "HH:mm" (24h)
  onChange: (value: string) => void;
  error?: string;
  minuteStep?: number;
}

function to12(h24: number): number {
  return ((h24 + 11) % 12) + 1;
}

/** Compact time field: a button that opens a small popover with scrollable hour/minute lists. */
export function TimeField({ label, value, onChange, error, minuteStep = 5 }: TimeFieldProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const valid = !!value && /^\d{1,2}:\d{2}/.test(value);
  const [h24, m] = valid ? value!.split(":").map(Number) : [null, null];
  const period: "AM" | "PM" = h24 == null ? "AM" : h24 >= 12 ? "PM" : "AM";
  const hour12 = h24 == null ? null : to12(h24);

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes: number[] = [];
  for (let i = 0; i < 60; i += minuteStep) minutes.push(i);
  if (m != null && !minutes.includes(m)) {
    minutes.push(m);
    minutes.sort((a, b) => a - b);
  }

  const display = valid ? `${hour12}:${String(m).padStart(2, "0")} ${period}` : "Select time";

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const curH = hour12 ?? 9;
  const curM = m ?? 0;
  const curP = period;

  function set(nextH12: number, nextMin: number, nextPeriod: "AM" | "PM") {
    let h = nextH12 % 12;
    if (nextPeriod === "PM") h += 12;
    onChange(`${String(h).padStart(2, "0")}:${String(nextMin).padStart(2, "0")}`);
  }

  return (
    <div className="flex flex-col gap-1.5" ref={ref}>
      {label && <label className="text-sm font-medium text-on-surface">{label}</label>}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={cn(
            "flex h-10 w-full items-center gap-2 rounded-xl border bg-surface px-3 text-sm text-on-surface outline-none transition-colors hover:border-grey-400 focus-visible:ring-2 focus-visible:ring-primary",
            error ? "border-danger" : "border-grey-300",
          )}
        >
          <Clock size={16} className="shrink-0 text-grey-400" aria-hidden="true" />
          <span className={cn("flex-1 text-left font-medium", !valid && "font-normal text-grey-400")}>{display}</span>
        </button>

        {open && (
          <div className="absolute left-0 top-full z-50 mt-1 flex w-full min-w-[210px] gap-2 rounded-xl border border-grey-200 bg-surface p-2 shadow-lg">
            <ul className="max-h-44 flex-1 overflow-y-auto rounded-lg">
              {hours.map((hh) => (
                <li key={hh}>
                  <button
                    type="button"
                    onClick={() => set(hh, curM, curP)}
                    className={cn(
                      "w-full rounded-md px-2 py-1.5 text-center text-sm transition-colors",
                      hour12 === hh ? "bg-primary font-semibold text-white" : "text-on-surface hover:bg-grey-100",
                    )}
                  >
                    {hh}
                  </button>
                </li>
              ))}
            </ul>

            <ul className="max-h-44 flex-1 overflow-y-auto rounded-lg">
              {minutes.map((mm) => (
                <li key={mm}>
                  <button
                    type="button"
                    onClick={() => set(curH, mm, curP)}
                    className={cn(
                      "w-full rounded-md px-2 py-1.5 text-center text-sm transition-colors",
                      m === mm ? "bg-primary font-semibold text-white" : "text-on-surface hover:bg-grey-100",
                    )}
                  >
                    {String(mm).padStart(2, "0")}
                  </button>
                </li>
              ))}
            </ul>

            <div className="flex flex-col gap-1">
              {(["AM", "PM"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => set(curH, curM, p)}
                  className={cn(
                    "rounded-md px-2.5 py-1.5 text-sm font-semibold transition-colors",
                    period === p ? "bg-primary text-white" : "text-on-surface hover:bg-grey-100",
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
