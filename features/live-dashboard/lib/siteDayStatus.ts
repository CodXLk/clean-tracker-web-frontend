import type {
  CleaningStatus,
  InspectionStatus,
  PersonStatus,
  SiteDay,
  SiteDayPerson,
  SiteDayStatus,
} from "@/features/live-dashboard/schemas/siteDay.schema";

export interface StatusMeta {
  /** Short label that fits a schedule cell. */
  short: string;
  label: string;
  description: string;
  /** Tailwind classes for badges/cells. */
  cls: string;
  hex: string;
  /** Live states get a pulsing dot. */
  live?: boolean;
}

/** Site-day statuses plus the client portal's "Cleaning completed" (inspection is internal). */
export type DayStatusKey = SiteDayStatus | "CLEANING_COMPLETED";

export const SITE_DAY_STATUS_META: Record<DayStatusKey, StatusMeta> = {
  SCHEDULED: {
    short: "Scheduled", label: "Scheduled", description: "Cleaning scheduled — no cleaner has checked in yet",
    cls: "bg-grey-100 text-grey-600", hex: "#94A3B8",
  },
  CLEANING_IN_PROGRESS: {
    short: "Cleaning", label: "Cleaning in progress", description: "A cleaner is checked in and working",
    cls: "bg-amber-100 text-amber-700", hex: "#F59E0B", live: true,
  },
  CLEANING_PAUSED: {
    short: "Paused", label: "Cleaning paused", description: "The cleaner's session is paused (left the site or app closed)",
    cls: "bg-orange-100 text-orange-700", hex: "#F97316",
  },
  CLEANING_INCOMPLETE: {
    short: "Incomplete", label: "Cleaning incomplete", description: "Cleaners checked out with tasks still open",
    cls: "bg-rose-100 text-rose-700", hex: "#E11D48",
  },
  CLEANING_SKIPPED: {
    short: "Skipped", label: "Cleaning skipped", description: "Nobody checked in on this day — work resumed on a later day",
    cls: "bg-red-100 text-red-700 line-through decoration-red-400/60", hex: "#DC2626",
  },
  CARRIED_OVER: {
    short: "Carried", label: "Carried over", description: "Not done on the day — picked up on the following non-working day",
    cls: "bg-indigo-100 text-indigo-700", hex: "#6366F1",
  },
  PENDING_INSPECTION: {
    short: "Pending insp.", label: "Pending inspection", description: "All tasks done and cleaners checked out — awaiting a supervisor",
    cls: "bg-blue-100 text-blue-700", hex: "#2B7FFF",
  },
  INSPECTION_SCHEDULED: {
    short: "Inspection", label: "Inspection scheduled", description: "A supervisor inspection is scheduled",
    cls: "bg-sky-100 text-sky-700", hex: "#0EA5E9",
  },
  INSPECTION_IN_PROGRESS: {
    short: "Inspecting", label: "Inspection in progress", description: "A supervisor is checked in and inspecting",
    cls: "bg-violet-100 text-violet-700", hex: "#7C3AED", live: true,
  },
  INSPECTION_PAUSED: {
    short: "Insp. paused", label: "Inspection paused", description: "The supervisor's session is paused",
    cls: "bg-fuchsia-100 text-fuchsia-700", hex: "#C026D3",
  },
  INSPECTION_SKIPPED: {
    short: "Insp. skipped", label: "Inspection skipped", description: "The scheduled inspection wasn't done — a supervisor visited on a later day",
    cls: "bg-pink-100 text-pink-700", hex: "#DB2777",
  },
  COMPLETED: {
    short: "Completed", label: "Completed", description: "Cleaned and inspected",
    cls: "bg-emerald-100 text-emerald-700", hex: "#00A63E",
  },
  CLEANING_COMPLETED: {
    short: "Completed", label: "Cleaning completed", description: "Today's cleaning is done",
    cls: "bg-emerald-100 text-emerald-700", hex: "#00A63E",
  },
};

/** Client portal statuses with client-facing wording. */
export const CLIENT_STATUS_META: Record<"SCHEDULED" | "CLEANING_IN_PROGRESS" | "CLEANING_COMPLETED", StatusMeta> = {
  SCHEDULED: { ...SITE_DAY_STATUS_META.SCHEDULED, description: "Cleaning is scheduled" },
  CLEANING_IN_PROGRESS: { ...SITE_DAY_STATUS_META.CLEANING_IN_PROGRESS, description: "Our team is cleaning now" },
  CLEANING_COMPLETED: SITE_DAY_STATUS_META.CLEANING_COMPLETED,
};

/** A supervisor's own status on a day, expressed as a site-day status for cell styling. */
export function supervisorDayStatus(person: SiteDayPerson): SiteDayStatus {
  switch (person.status) {
    case "IN_PROGRESS": return "INSPECTION_IN_PROGRESS";
    case "PAUSED": return "INSPECTION_PAUSED";
    case "DONE": return "COMPLETED";
    case "SKIPPED": return "INSPECTION_SKIPPED";
    default: return "INSPECTION_SCHEDULED";
  }
}

/** A cleaner's own status on a day, expressed as a site-day status for cell styling. */
export function cleanerDayStatus(person: SiteDayPerson, day: SiteDay): SiteDayStatus {
  // Once the day's tasks are all done, follow the site's workflow (pending inspection → completed).
  const afterCleaning: SiteDayStatus =
    day.status === "COMPLETED" || day.status === "INSPECTION_IN_PROGRESS" || day.status === "INSPECTION_PAUSED"
      || day.status === "INSPECTION_SKIPPED"
      ? day.status
      : "PENDING_INSPECTION";
  switch (person.status) {
    case "IN_PROGRESS": return "CLEANING_IN_PROGRESS";
    case "PAUSED": return "CLEANING_PAUSED";
    case "DONE": return day.cleaningStatus === "COMPLETED" ? afterCleaning : "CLEANING_INCOMPLETE";
    case "SKIPPED": return day.cleaningStatus === "CARRIED_OVER" ? "CARRIED_OVER" : "CLEANING_SKIPPED";
    default:
      if (day.cleaningStatus === "CARRIED_OVER") return "CARRIED_OVER";
      return day.cleaningStatus === "COMPLETED" ? afterCleaning : "SCHEDULED";
  }
}

export const CLEANING_STATUS_LABEL: Record<CleaningStatus, string> = {
  NONE: "No cleaning",
  PENDING: "Pending cleaning",
  IN_PROGRESS: "Cleaning in progress",
  PAUSED: "Cleaning paused",
  INCOMPLETE: "Checked out · tasks left",
  COMPLETED: "Cleaning completed",
  SKIPPED: "Cleaning skipped",
  CARRIED_OVER: "Carried over",
};

export const INSPECTION_STATUS_LABEL: Record<InspectionStatus, string> = {
  NONE: "Not scheduled",
  PENDING: "Inspection pending",
  IN_PROGRESS: "Inspection in progress",
  PAUSED: "Inspection paused",
  COMPLETED: "Inspection completed",
  SKIPPED: "Inspection skipped",
};

export const PERSON_STATUS_META: Record<PersonStatus, { label: string; cls: string }> = {
  PENDING: { label: "Not checked in", cls: "bg-grey-100 text-grey-600" },
  IN_PROGRESS: { label: "Checked in", cls: "bg-amber-100 text-amber-700" },
  PAUSED: { label: "Paused", cls: "bg-orange-100 text-orange-700" },
  DONE: { label: "Checked out", cls: "bg-emerald-100 text-emerald-700" },
  SKIPPED: { label: "Didn't come", cls: "bg-red-100 text-red-700" },
};

/** Cleaning-phase bucket for the overview donut. */
export type CleaningBucket = "pending" | "inProgress" | "incomplete" | "completed";
export function cleaningBucket(day: SiteDay): CleaningBucket {
  switch (day.cleaningStatus) {
    case "IN_PROGRESS":
    case "PAUSED":
      return "inProgress";
    case "INCOMPLETE":
      return "incomplete";
    case "COMPLETED":
      return "completed";
    default:
      return "pending";
  }
}

export type InspectionBucket = "pending" | "inProgress" | "completed";
export function inspectionBucket(day: SiteDay): InspectionBucket {
  switch (day.inspectionStatus) {
    case "IN_PROGRESS":
    case "PAUSED":
      return "inProgress";
    case "COMPLETED":
      return "completed";
    default:
      return "pending";
  }
}

export const CLOSE_REASON_LABEL: Record<string, string> = {
  CHECKED_OUT: "Checked out",
  EARLY_BEFORE_SHIFT_END: "Left before shift end",
  PENDING_TASKS: "Forced check-out · tasks pending",
  BELOW_MINIMUM: "Forced check-out · below minimum time",
  FORGOT_CHECKOUT: "Forgot to check out (closed by system)",
  WORK_ORDER_COMPLETED: "Closed when work order completed",
};

export const PAUSE_REASON_LABEL: Record<string, string> = {
  GEOFENCE: "Left the site area",
  STALE_HEARTBEAT: "Lost contact",
  LOCATION_UNAVAILABLE: "Location unavailable",
  APP_CLOSED: "App closed",
};

// ── Time formatting ────────────────────────────────────────────────────────────

/** "HH:mm[:ss]" local time → "9:30 AM". */
export function formatLocalTime(hhmm?: string | null): string {
  if (!hhmm) return "";
  const [h, m] = hhmm.split(":").map(Number);
  if (h === undefined || Number.isNaN(h)) return hhmm;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m ?? 0).padStart(2, "0")} ${ampm}`;
}

/** An instant shown in the site's zone ("9:30 AM"). */
export function formatInstant(iso?: string | null, timeZone?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  try {
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: timeZone ?? undefined });
  } catch {
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }
}

/** The site-local calendar date ("yyyy-MM-dd") of an instant. */
export function localDateOf(iso?: string | null, timeZone?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  try {
    return d.toLocaleDateString("en-CA", { timeZone: timeZone ?? undefined });
  } catch {
    return d.toLocaleDateString("en-CA");
  }
}

/**
 * An instant in the site's zone, suffixed with the weekday when it falls on a different day than
 * the service day (overnight shifts: "6:05 AM Tue").
 */
export function formatInstantOn(iso: string | null | undefined, timeZone: string | null | undefined, serviceDate: string): string {
  const time = formatInstant(iso, timeZone);
  if (!time) return "";
  const local = localDateOf(iso, timeZone);
  return local && local !== serviceDate ? `${time} ${weekdayShort(local)}` : time;
}

/** True when a local "HH:mm" window ends on the next day. */
export function crossesMidnight(start?: string | null, end?: string | null): boolean {
  return Boolean(start && end && end.slice(0, 5) <= start.slice(0, 5));
}

/** "10:00 PM – 6:00 AM (overnight)". */
export function formatWindow(start?: string | null, end?: string | null): string {
  if (!start) return "";
  if (!end) return formatLocalTime(start);
  return `${formatLocalTime(start)} – ${formatLocalTime(end)}${crossesMidnight(start, end) ? " (overnight)" : ""}`;
}

export function formatMinutes(mins?: number | null): string {
  if (mins == null || mins <= 0) return "0m";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
}

export function weekdayShort(dateStr?: string | null): string {
  if (!dateStr) return "";
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("en-US", { weekday: "short" });
}

/** Minutes between now and an instant (positive when it's in the past). */
export function minutesSince(iso?: string | null, now = Date.now()): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? null : Math.floor((now - t) / 60000);
}

/** Expected start text with where it came from ("Shift 9:00 AM", "Window 7:00 AM"). */
export function expectedStartLabel(day: SiteDay): string {
  if (!day.expectedStart) return "";
  const range = formatWindow(day.expectedStart, day.expectedEnd);
  if (day.expectedSource === "SHIFT") return `Shift ${range}`;
  if (day.expectedSource === "GENERAL") return `Cleaning window ${range}`;
  return `Tasks ${range}`;
}

/** Whether nobody has checked in although the expected start has passed (today only). */
export function isLateStart(day: SiteDay, now = Date.now()): boolean {
  if (day.cleaningStatus !== "PENDING" || !day.expectedStartAt) return false;
  const since = minutesSince(day.expectedStartAt, now);
  return since != null && since > 0;
}

/** The person's live pause (open session paused), if any. */
export function openPause(person: SiteDayPerson): string | null {
  const s = person.sessions.find((x) => x.status === "PAUSED");
  return s?.pausedAt ?? null;
}
