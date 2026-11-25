"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type FocusEvent,
  type InputHTMLAttributes,
  type KeyboardEvent,
} from "react";
import { CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { displayToIsoDate } from "@/lib/utils/format";

export interface DateInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "defaultValue" | "onChange"> {
  /** `yyyy-MM-dd` (the API / storage format). Omit for uncontrolled use (e.g. react-hook-form `register`). */
  value?: string | null;
  defaultValue?: string;
  /** Fires like a native date input's change: `e.target.value` is `yyyy-MM-dd` ("" when cleared). */
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  /** Convenience callback with the `yyyy-MM-dd` value. */
  onValueChange?: (iso: string) => void;
  /** Layout classes for the outer wrapper (e.g. width); `className` styles the field box. */
  wrapperClassName?: string;
}

type Part = "d" | "m" | "y";
interface Parts { d: string; m: string; y: string }

const EMPTY: Parts = { d: "", m: "", y: "" };
const ORDER: Part[] = ["d", "m", "y"];
const MAX_LEN: Record<Part, number> = { d: 2, m: 2, y: 4 };
const LIMIT: Record<Part, [number, number]> = { d: [1, 31], m: [1, 12], y: [1900, 2100] };
const SEPARATORS = ["/", ".", "-", " "];

const NATIVE_VALUE = Object.getOwnPropertyDescriptor(
  typeof HTMLInputElement === "undefined" ? Object : HTMLInputElement.prototype,
  "value",
);

function partsOf(iso: string | null | undefined): Parts {
  const m = iso ? /^(\d{4})-(\d{2})-(\d{2})/.exec(iso) : null;
  return m ? { d: m[3]!, m: m[2]!, y: m[1]! } : EMPTY;
}

const pad = (s: string) => (s.length === 1 ? `0${s}` : s);

/** A typed or pasted full date (dd/mm/yyyy in any separator, or yyyy-mm-dd) → parts. */
function parsePasted(text: string): Parts | null {
  const t = text.trim();
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(t);
  const value = iso ? `${iso[3]}/${iso[2]}/${iso[1]}` : t;
  const ok = displayToIsoDate(value) ?? (/^\d{8}$/.test(t) ? displayToIsoDate(`${t.slice(0, 2)}/${t.slice(2, 4)}/${t.slice(4)}`) : null);
  return ok ? partsOf(ok) : null;
}

/**
 * A date field shown and entered as separate DD / MM / YYYY boxes on every browser (native date inputs
 * follow the OS locale). Typing fills day → month → year on its own: a day of 4–9 or a month of 2–9 is
 * completed straight away, two digits move to the next box, Backspace on an empty box steps back, and a
 * full pasted date fills all three. The calendar button opens the browser's picker. The value stays
 * `yyyy-MM-dd`, so it's a drop-in replacement for `<input type="date">` — controlled (`value` +
 * `onChange`) or via react-hook-form `register`.
 */
export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(function DateInput(
  {
    value,
    defaultValue,
    onChange,
    onValueChange,
    onBlur,
    min,
    max,
    name,
    id,
    className,
    wrapperClassName,
    disabled,
    readOnly,
    required,
    "aria-label": ariaLabel,
    "aria-invalid": ariaInvalid,
    "aria-describedby": ariaDescribedBy,
    title,
    autoFocus,
  },
  ref,
) {
  const controlled = value !== undefined;
  const hiddenRef = useRef<HTMLInputElement | null>(null);
  const boxRef = useRef<HTMLSpanElement | null>(null);
  const refs = { d: useRef<HTMLInputElement>(null), m: useRef<HTMLInputElement>(null), y: useRef<HTMLInputElement>(null) };
  const [parts, setPartsState] = useState<Parts>(() => partsOf(controlled ? value : defaultValue));
  // Latest parts for handlers: focusing the next box fires the previous one's blur before React re-renders.
  const partsRef = useRef(parts);
  const setParts = useCallback((p: Parts) => {
    partsRef.current = p;
    setPartsState(p);
  }, []);
  const [invalid, setInvalid] = useState(false);

  useImperativeHandle(ref, () => hiddenRef.current as HTMLInputElement);

  // Controlled: follow the parent's value.
  useEffect(() => {
    if (controlled) {
      setParts(partsOf(value));
      setInvalid(false);
    }
  }, [controlled, value, setParts]);

  // Uncontrolled: mirror programmatic writes (react-hook-form defaults / reset) into the boxes.
  const attachHidden = useCallback(
    (el: HTMLInputElement | null) => {
      hiddenRef.current = el;
      if (!el || controlled || !NATIVE_VALUE?.get || !NATIVE_VALUE.set) return;
      const own = Object.getOwnPropertyDescriptor(el, "value");
      const get = own?.get ?? NATIVE_VALUE.get;
      const set = own?.set ?? NATIVE_VALUE.set;
      Object.defineProperty(el, "value", {
        configurable: true,
        get() {
          return get.call(el);
        },
        set(v: string) {
          set.call(el, v);
          setParts(partsOf(v));
        },
      });
      setParts(partsOf(get.call(el)));
    },
    [controlled, setParts],
  );

  /** Writes the hidden native input so React (and form libraries) see a real change event. */
  function commit(iso: string) {
    const el = hiddenRef.current;
    if (!el || !NATIVE_VALUE?.set || el.value === iso) return;
    NATIVE_VALUE.set.call(el, iso);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }

  const inRange = (iso: string) => (!min || iso >= String(min)) && (!max || iso <= String(max));

  /** The value the boxes spell out: an ISO date, "" when all empty, or null while incomplete/invalid. */
  function resolve(p: Parts): string | null {
    if (!p.d && !p.m && !p.y) return "";
    if (p.d.length !== 2 || p.m.length !== 2 || p.y.length !== 4) return null;
    const iso = displayToIsoDate(`${p.d}/${p.m}/${p.y}`);
    return iso && inRange(iso) ? iso : null;
  }

  function update(next: Parts) {
    setParts(next);
    const iso = resolve(next);
    if (iso !== null) {
      setInvalid(false);
      commit(iso);
    }
  }

  /** Focus a box: "select" (typing replaces it — onFocus selects), or put the caret at its start/end. */
  function focusPart(part: Part, mode: "select" | "start" | "end" = "end") {
    const el = refs[part].current;
    if (!el) return;
    el.focus();
    // Synchronous so fast typing can't land before the caret/selection is set.
    if (mode !== "select") {
      const pos = mode === "start" ? 0 : el.value.length;
      el.setSelectionRange(pos, pos);
    }
  }

  const nextOf = (part: Part) => ORDER[ORDER.indexOf(part) + 1];
  const prevOf = (part: Part) => ORDER[ORDER.indexOf(part) - 1];

  /**
   * Digits entered into one box. A day of 4–9 / month of 2–9 can't take a second digit, so it's completed;
   * a full box moves on; digits beyond a full box flow into the next one.
   */
  function enter(p: Parts, part: Part, raw: string): { parts: Parts; focus: Part; overflowed: boolean } {
    const all = raw.replace(/\D/g, "");
    const maxLen = MAX_LEN[part];
    let digits = all.slice(0, maxLen);
    const overflow = all.slice(maxLen);
    const n = Number(digits);
    const done = digits.length === maxLen
      || (part === "d" && digits.length === 1 && n > 3)
      || (part === "m" && digits.length === 1 && n > 1);
    if (done && part !== "y" && digits.length === 1) digits = pad(digits);
    const next = { ...p, [part]: digits };
    const after = nextOf(part);
    if (overflow && after) return { ...enter(next, after, overflow), overflowed: true };
    return { parts: next, focus: done && after ? after : part, overflowed: false };
  }

  function handleChange(part: Part, raw: string) {
    // A whole date typed, pasted or autofilled into one box.
    if (/\D/.test(raw) || raw.length > MAX_LEN[part] + 1) {
      const pasted = parsePasted(raw);
      if (pasted) {
        update(pasted);
        focusPart("y", "end");
        return;
      }
    }
    const r = enter(partsRef.current, part, raw);
    update(r.parts);
    if (r.focus !== part) focusPart(r.focus, r.overflowed ? "end" : "select");
  }

  function step(part: Part, delta: number) {
    const parts = partsRef.current;
    const [lo, hi] = LIMIT[part];
    const current = Number(parts[part]);
    let n = parts[part] ? current + delta : part === "y" ? new Date().getFullYear() : lo;
    if (n > hi) n = lo;
    if (n < lo) n = hi;
    update({ ...parts, [part]: part === "y" ? String(n) : pad(String(n)) });
  }

  function handleKeyDown(part: Part, e: KeyboardEvent<HTMLInputElement>) {
    const parts = partsRef.current;
    const el = e.currentTarget;
    const atStart = el.selectionStart === 0 && el.selectionEnd === 0;
    const atEnd = el.selectionStart === el.value.length;
    if (SEPARATORS.includes(e.key)) {
      e.preventDefault();
      const after = nextOf(part);
      if (parts[part] && after) {
        if (part !== "y") update({ ...parts, [part]: pad(parts[part]) });
        focusPart(after, "select");
      }
    } else if (e.key === "Backspace" && el.value === "") {
      const before = prevOf(part);
      if (before) {
        e.preventDefault();
        focusPart(before);
      }
    } else if (e.key === "ArrowLeft" && atStart) {
      const before = prevOf(part);
      if (before) {
        e.preventDefault();
        focusPart(before);
      }
    } else if (e.key === "ArrowRight" && atEnd) {
      const after = nextOf(part);
      if (after) {
        e.preventDefault();
        focusPart(after, "start");
      }
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      step(part, e.key === "ArrowUp" ? 1 : -1);
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    const pasted = parsePasted(e.clipboardData.getData("text"));
    if (pasted) {
      e.preventDefault();
      update(pasted);
      focusPart("y");
    }
  }

  /**
   * Leaving a box completes a single-digit day/month (5 → 05) and a two-digit year (27 → 2027). Leaving the
   * whole field commits the date, or flags and reverts an incomplete/invalid one.
   */
  function handleBlur(part: Part, e: FocusEvent<HTMLInputElement>) {
    const parts = partsRef.current;
    let p = parts;
    if (part !== "y" && p[part].length === 1) p = { ...p, [part]: pad(p[part]) };
    if (part === "y" && p.y.length === 2) p = { ...p, y: `20${p.y}` };
    if (boxRef.current?.contains(e.relatedTarget as Node | null)) {
      if (p !== parts) update(p);
      return;
    }
    const iso = resolve(p);
    if (iso === null) {
      setInvalid(true);
      setParts(partsOf(hiddenRef.current?.value));
    } else {
      setInvalid(false);
      commit(iso);
      setParts(partsOf(iso));
    }
    onBlur?.(e);
  }

  function openPicker() {
    const el = hiddenRef.current;
    if (!el || disabled || readOnly) return;
    try {
      el.showPicker();
    } catch {
      el.focus();
      el.click();
    }
  }

  const segment = (part: Part, placeholder: string, width: string) => (
    <input
      ref={refs[part]}
      id={part === "d" ? id : undefined}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      autoFocus={part === "d" ? autoFocus : undefined}
      placeholder={placeholder}
      value={parts[part]}
      maxLength={10}
      disabled={disabled}
      readOnly={readOnly}
      required={required}
      aria-label={`${ariaLabel ? `${ariaLabel} ` : ""}${part === "d" ? "day" : part === "m" ? "month" : "year"}`}
      aria-invalid={invalid || ariaInvalid || undefined}
      aria-describedby={ariaDescribedBy}
      onChange={(e) => handleChange(part, e.target.value)}
      onKeyDown={(e) => handleKeyDown(part, e)}
      onPaste={handlePaste}
      onFocus={(e) => e.currentTarget.select()}
      onBlur={(e) => handleBlur(part, e)}
      className={cn(
        "min-w-0 border-0 bg-transparent p-0 text-center tabular-nums outline-none placeholder:text-grey-400 focus:ring-0",
        width,
      )}
    />
  );

  return (
    <span className={cn("inline-flex", wrapperClassName)}>
      <span
        ref={boxRef}
        role="group"
        aria-label={ariaLabel}
        title={invalid ? "Enter a valid date (day / month / year)" : title}
        onMouseDown={(e) => {
          // Clicking the box (not a box segment) focuses the first empty part.
          if (e.target === e.currentTarget) {
            e.preventDefault();
            focusPart(ORDER.find((p) => !partsRef.current[p]) ?? "y");
          }
        }}
        className={cn(
          "relative flex w-full cursor-text items-center gap-0.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20",
          className,
          invalid && "border-error",
          disabled && "cursor-not-allowed opacity-60",
        )}
      >
        {segment("d", "DD", "w-[2.6ch]")}
        <span className="select-none text-grey-400" aria-hidden="true">/</span>
        {segment("m", "MM", "w-[2.6ch]")}
        <span className="select-none text-grey-400" aria-hidden="true">/</span>
        {segment("y", "YYYY", "w-[4.6ch]")}
        <button
          type="button"
          tabIndex={-1}
          onClick={openPicker}
          disabled={disabled || readOnly}
          aria-label="Open calendar"
          className="ml-auto flex h-full shrink-0 items-center pl-2 text-grey-500 hover:text-primary disabled:opacity-40"
        >
          <CalendarDays size={16} aria-hidden="true" />
        </button>
        <span aria-hidden="true" className="pointer-events-none absolute bottom-0 right-0 h-px w-px overflow-hidden opacity-0">
          <input
            ref={attachHidden}
            type="date"
            name={name}
            tabIndex={-1}
            min={min}
            max={max}
            disabled={disabled}
            {...(controlled ? { value: value ?? "" } : { defaultValue })}
            onChange={(e) => {
              setParts(partsOf(e.target.value));
              setInvalid(false);
              onChange?.(e);
              onValueChange?.(e.target.value);
            }}
          />
        </span>
      </span>
    </span>
  );
});
