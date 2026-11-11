import type { Site, DayOfWeek } from "@/features/user-management/schemas/site.schema";
import { DAY_OF_WEEK_VALUES } from "@/features/user-management/schemas/site.schema";
import type { TaskOccurrence } from "@/features/workforce/schemas/assignment.schema";

/** Default first General task start when the site has no General window for the day. */
export const DEFAULT_GENERAL_START = "07:00";

type SiteWindowFields = Pick<Site, "generalTaskTimeMode" | "generalTaskStartTime" | "generalTaskEndTime" | "generalTaskDayTimes">;

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.slice(0, 5).split(":").map(Number);
  return h * 60 + m;
}

function fromMinutes(mins: number): string {
  const m = ((mins % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

/** Java DayOfWeek for a yyyy-MM-dd date (local, not UTC). */
export function dayOfWeekOfDate(date: string): DayOfWeek {
  const d = new Date(date + "T00:00:00");
  return DAY_OF_WEEK_VALUES[(d.getDay() + 6) % 7];
}

/** The site's General window for a day (per-day mode aware), as "HH:mm" strings, or null. */
export function generalWindowFor(
  site: SiteWindowFields | null | undefined,
  date: string,
): { start: string; end: string } | null {
  if (!site) return null;
  const day = dayOfWeekOfDate(date);
  if (site.generalTaskTimeMode === "PER_DAY") {
    const entry = (site.generalTaskDayTimes ?? []).find((d) => d.dayOfWeek === day);
    if (entry?.startTime && entry?.endTime) {
      return { start: entry.startTime.slice(0, 5), end: entry.endTime.slice(0, 5) };
    }
  }
  if (site.generalTaskStartTime && site.generalTaskEndTime) {
    return { start: site.generalTaskStartTime.slice(0, 5), end: site.generalTaskEndTime.slice(0, 5) };
  }
  return null;
}

/**
 * Default start time for a new General assignment on a date: right after the last General task
 * already scheduled at that site that day, else the day's General window start, else 07:00.
 */
export function defaultGeneralStartTime(
  site: (SiteWindowFields & { id: string }) | null | undefined,
  date: string,
  occurrences?: Pick<TaskOccurrence, "date" | "siteId" | "assignmentType" | "status" | "startTime" | "endTime">[],
): string {
  const window = generalWindowFor(site, date);
  const anchor = window ? toMinutes(window.start) : 0;
  const sameDay = (occurrences ?? []).filter(
    (o) =>
      site &&
      o.siteId === site.id &&
      o.date === date &&
      o.assignmentType === "GENERAL_TASK" &&
      o.status !== "CANCELLED",
  );
  if (sameDay.length > 0) {
    // Measure ends relative to the window start so overnight windows order correctly.
    const latest = Math.max(
      ...sameDay.map((o) => {
        const start = ((toMinutes(o.startTime) - anchor) % 1440 + 1440) % 1440;
        const duration = ((toMinutes(o.endTime) - toMinutes(o.startTime)) % 1440 + 1440) % 1440;
        return start + duration;
      }),
    );
    return fromMinutes(anchor + latest);
  }
  return window?.start ?? DEFAULT_GENERAL_START;
}

/**
 * Per-task start/end for a sequential task list, plus whether the block overruns the window.
 * Mirrors the backend: tasks run back to back from the assignment start in list order.
 */
export function computeTaskSlots(
  startTime: string,
  durations: number[],
  window?: { start: string; end: string } | null,
): { slots: { start: string; end: string }[]; overrunsWindow: boolean; startsOutsideWindow: boolean } {
  if (!/^\d{1,2}:\d{2}/.test(startTime ?? "")) {
    return { slots: [], overrunsWindow: false, startsOutsideWindow: false };
  }
  let cursor = toMinutes(startTime);
  const slots = durations.map((d) => {
    const s = cursor;
    cursor += d;
    return { start: fromMinutes(s), end: fromMinutes(cursor) };
  });
  if (!window) return { slots, overrunsWindow: false, startsOutsideWindow: false };
  const ws = toMinutes(window.start);
  let length = ((toMinutes(window.end) - ws) % 1440 + 1440) % 1440;
  if (length === 0) length = 1440;
  const offset = ((toMinutes(startTime) - ws) % 1440 + 1440) % 1440;
  const total = durations.reduce((a, b) => a + b, 0);
  return {
    slots,
    startsOutsideWindow: offset > length,
    overrunsWindow: offset <= length && offset + total > length,
  };
}
