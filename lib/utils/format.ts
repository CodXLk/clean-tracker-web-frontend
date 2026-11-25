/** Today's date as a `yyyy-MM-dd` string, for date-only API params (e.g. task-assignment ranges). */
export function todayISODate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const pad2 = (n: number) => String(n).padStart(2, "0");

/**
 * Parses a date value. Date-only `yyyy-MM-dd` strings are read as a local calendar day (not UTC
 * midnight, which can shift the day); anything else goes through `new Date`.
 */
export function toDate(value: string | number | Date | null | undefined): Date | null {
  if (value == null || value === "") return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === "string") {
    const m = ISO_DATE.exec(value);
    if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * The app-wide date display: `dd/MM/yyyy`. With `options`, formats with Intl in day-first (en-AU)
 * order instead (e.g. `{ weekday: "short", day: "numeric", month: "short" }` → "Wed 25 Nov").
 * Returns "" for empty/invalid input.
 */
export function formatDate(value: string | number | Date | null | undefined, options?: Intl.DateTimeFormatOptions): string {
  const date = toDate(value);
  if (!date) return "";
  if (options) return new Intl.DateTimeFormat("en-AU", options).format(date);
  return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()}`;
}

/** "Wednesday 25 November" — a headline day label (e.g. the dashboard's "Today"). */
export function formatDayHeading(value: string | number | Date | null | undefined): string {
  const date = toDate(value);
  if (!date) return "";
  const weekday = date.toLocaleDateString("en-AU", { weekday: "long" });
  const month = date.toLocaleDateString("en-AU", { month: "long" });
  return `${weekday} ${date.getDate()} ${month}`;
}

/** `dd/MM/yyyy h:mm am` (optionally in an IANA time zone). */
export function formatDateTime(value: string | number | Date | null | undefined, timeZone?: string): string {
  const date = toDate(value);
  if (!date) return "";
  try {
    const parts = new Intl.DateTimeFormat("en-AU", {
      day: "2-digit", month: "2-digit", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true,
      timeZone,
    }).formatToParts(date);
    const get = (t: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === t)?.value ?? "";
    return `${get("day")}/${get("month")}/${get("year")} ${get("hour")}:${get("minute")} ${get("dayPeriod").toLowerCase()}`;
  } catch {
    return `${formatDate(date)} ${date.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" })}`;
  }
}

/** `yyyy-MM-dd` → `dd/MM/yyyy` ("" when empty/invalid). */
export function isoToDisplayDate(iso: string | null | undefined): string {
  const m = iso ? ISO_DATE.exec(iso.slice(0, 10)) : null;
  return m ? `${m[3]}/${m[2]}/${m[1]}` : "";
}

/** `dd/MM/yyyy` (also `d/M/yyyy`, `-` or `.` separators) → `yyyy-MM-dd`, or null when it isn't a real date. */
export function displayToIsoDate(text: string | null | undefined): string | null {
  const m = text ? /^\s*(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})\s*$/.exec(text) : null;
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  const d = new Date(year, month - 1, day);
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return null;
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}…`;
}
