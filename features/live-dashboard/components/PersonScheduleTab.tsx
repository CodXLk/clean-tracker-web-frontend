"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Briefcase, Users, CheckCircle2, TriangleAlert, Eye } from "lucide-react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { SiteFilterSelect } from "@/components/admin/SiteFilterSelect";
import { useCleaners } from "@/features/cleaners/hooks/useCleaners";
import { useUsers } from "@/features/users/hooks/useUsers";
import { useSites } from "@/features/user-management/hooks/useSites";
import { useOccurrences } from "@/features/workforce/hooks/useAssignments";
import { usePublicHolidays } from "@/features/workforce/hooks/usePublicHolidays";
import { useComplaints } from "@/features/complaints/hooks/useComplaints";
import { ScheduleCellDetailModal } from "./ScheduleCellDetailModal";
import type { TaskOccurrence } from "@/features/workforce/schemas/assignment.schema";
import type { DayOfWeek, AssignedShift } from "@/features/user-management/schemas/site.schema";
import { todayISODate } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

// ── Date helpers ────────────────────────────────────────────────────────────────

function formatISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun..6=Sat
  const diff = (day + 6) % 7; // days since Monday
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getDayDates(weekStart: Date): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return formatISO(d);
  });
}

const JS_DAY_TO_JAVA: DayOfWeek[] = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

export function dayOfWeekOf(dateStr: string): DayOfWeek {
  return JS_DAY_TO_JAVA[new Date(dateStr + "T00:00:00").getDay()]!;
}

function nextDay(dateStr: string): string {
  return formatISO(new Date(new Date(`${dateStr}T00:00:00`).getTime() + 86400000));
}

/** Monday-first weeks covering the given month (up to 6 rows). */
export function getMonthWeeks(year: number, month: number): string[][] {
  const firstDay = new Date(year, month, 1);
  const start = getWeekStart(firstDay);
  const weeks: string[][] = [];
  for (let w = 0; w < 6; w++) {
    const week: string[] = [];
    for (let d = 0; d < 7; d++) {
      const cur = new Date(start);
      cur.setDate(start.getDate() + w * 7 + d);
      week.push(formatISO(cur));
    }
    weeks.push(week);
    const last = new Date(week[6]! + "T00:00:00");
    if (last.getMonth() > month || last.getFullYear() > year) break;
  }
  return weeks;
}

export function formatWeekRangeLabel(startStr: string, endStr: string): string {
  const start = new Date(startStr + "T00:00:00");
  const end = new Date(endStr + "T00:00:00");
  const startMonth = start.toLocaleDateString("en-US", { month: "short" });
  const endMonth = end.toLocaleDateString("en-US", { month: "short" });
  if (startMonth === endMonth) {
    return `${startMonth} ${start.getDate()} – ${end.getDate()}, ${end.getFullYear()}`;
  }
  return `${startMonth} ${start.getDate()} – ${endMonth} ${end.getDate()}, ${end.getFullYear()}`;
}

// ── Time-grid helpers (cleaner week view) ───────────────────────────────────────
const SLOT_HEIGHT = 48;

function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":");
  return (Number(h) || 0) * 60 + (Number(m) || 0);
}

function fmtMins(mins: number): string {
  const total = ((mins % 1440) + 1440) % 1440;
  const h = Math.floor(total / 60);
  const m = total % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${h12} ${ampm}` : `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function hourLabel(h: number): string {
  return h === 0 ? "12 AM" : h === 12 ? "12 PM" : h > 12 ? `${h - 12} PM` : `${h} AM`;
}

// ── Colour palettes ─────────────────────────────────────────────────────────────
// General sites use cool colours; work-order sites use a warm (orange/red) family so
// they read as work orders at a glance. Each site still gets its own distinct colour.
export const GENERAL_HEXES = [
  "#0B585A", "#2563EB", "#7C3AED", "#059669", "#DB2777",
  "#0891B2", "#4F46E5", "#0D9488", "#9333EA", "#15803D",
];
export const WORKORDER_HEXES = ["#F97316", "#EA580C", "#D97706", "#DC2626", "#B45309"];

const WEEKDAY_SHORT: Record<DayOfWeek, string> = {
  MONDAY: "Mon", TUESDAY: "Tue", WEDNESDAY: "Wed", THURSDAY: "Thu",
  FRIDAY: "Fri", SATURDAY: "Sat", SUNDAY: "Sun",
};

export interface SiteMeta {
  siteId: string;
  siteName: string;
  hex: string;
  isWorkOrder: boolean;
}

/** Per-cell rollup for a (site, date): cleaning completion + whether a complaint was raised. */
export interface CellStat {
  total: number;
  completed: number;
  hasComplaint: boolean;
  /** A cleaner has checked in for this site on this date (drives "today" status). */
  started?: boolean;
}

type CellStatus = "scheduled" | "cleaning" | "inspection" | "complaint";
function statusOf(stat: CellStat, date: string, today: string): CellStatus {
  if (stat.hasComplaint && date <= today) return "complaint";
  if (stat.total > 0 && stat.completed === stat.total) return "inspection";
  if (date > today) return "scheduled"; // future day, not started yet
  if (date < today) return "cleaning"; // past day still pending
  return stat.started ? "cleaning" : "scheduled"; // today: cleaning once a cleaner checks in
}
const STATUS_META: Record<CellStatus, { label: string; cls: string; tip: string }> = {
  scheduled: { label: "Scheduled", cls: "bg-grey-100 text-grey-600", tip: "Scheduled" },
  cleaning: { label: "Cleaning", cls: "bg-amber-100 text-amber-700", tip: "Cleaning pending" },
  inspection: { label: "Inspection", cls: "bg-blue-100 text-blue-700", tip: "Cleaning done — inspection pending" },
  complaint: { label: "Complaint", cls: "bg-red-100 text-red-700", tip: "Complaint raised — blocked" },
};

function personName(first?: string | null, last?: string | null): string {
  return `${first ?? ""} ${last ?? ""}`.trim() || "Unnamed";
}

type MainView = "schedule" | "calendar";
type ScopeView = "date" | "day";
type Audience = "cleaners" | "supervisors";

const GRID_TEMPLATE = "minmax(200px, 1.6fr) repeat(7, minmax(60px, 1fr))";

// Segmented toggle button styling, matching the workforce toolbar.
export const SEGMENT_BTN =
  "flex h-9 items-center px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

interface PersonScheduleTabProps {
  audience: Audience;
  /** Preselect this person (e.g. arriving from the roster "view schedule" eye). */
  initialPersonId?: string;
}

export function PersonScheduleTab({ audience, initialPersonId }: PersonScheduleTabProps) {
  const today = todayISODate();
  const isCleaner = audience === "cleaners";
  const noun = isCleaner ? "cleaner" : "supervisor";
  const router = useRouter();

  const cleanersQuery = useCleaners();
  const usersQuery = useUsers();
  const sitesQuery = useSites();
  const complaintsQuery = useComplaints();

  const [personId, setPersonId] = useState<string>(initialPersonId ?? "");
  const [mainView, setMainView] = useState<MainView>("schedule");
  const [scopeView, setScopeView] = useState<ScopeView>("date");
  const [calendarMode, setCalendarMode] = useState<"week" | "month">("week");
  const [weekStart, setWeekStart] = useState<Date>(() => getWeekStart(new Date()));
  const [monthCursor, setMonthCursor] = useState<Date>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  // The cell whose day-detail modal is open.
  const [detailCell, setDetailCell] = useState<{ siteId: string; siteName: string; date: string } | null>(null);

  // Follow a new preselection (e.g. navigating from the roster eye to a different cleaner).
  const [lastInitialPersonId, setLastInitialPersonId] = useState(initialPersonId);
  if (initialPersonId !== lastInitialPersonId) {
    setLastInitialPersonId(initialPersonId);
    if (initialPersonId) setPersonId(initialPersonId);
  }

  // Supervisors have day-only schedules (no shift times), so their calendar is month-only.
  const effectiveCalendarMode = isCleaner ? calendarMode : "month";

  // The selectable people for this audience, and the default (first) selection.
  const people = useMemo(() => {
    if (isCleaner) {
      return (cleanersQuery.data ?? []).map((c) => ({
        id: c.id,
        firstName: c.firstName,
        lastName: c.lastName,
      }));
    }
    return (usersQuery.data ?? [])
      .filter((u) => u.role === "SUPERVISOR" || (u.roles ?? []).includes("SUPERVISOR"))
      .map((u) => ({ id: u.id, firstName: u.firstName, lastName: u.lastName }));
  }, [isCleaner, cleanersQuery.data, usersQuery.data]);
  const effectivePersonId = personId || people[0]?.id || "";

  const weekDates = useMemo(() => getDayDates(weekStart), [weekStart]);
  const monthWeeks = useMemo(
    () => getMonthWeeks(monthCursor.getFullYear(), monthCursor.getMonth()),
    [monthCursor],
  );

  // Public holidays covering the visible month grid (may span two years at the edges).
  const holidayYears = useMemo(() => {
    const set = new Set<number>();
    for (const w of monthWeeks) for (const d of w) set.add(Number(d.slice(0, 4)));
    return [...set];
  }, [monthWeeks]);
  const holidays = usePublicHolidays(holidayYears);

  // Fetch range covers the whole visible span (a week, or the month grid).
  const range = useMemo(() => {
    if (mainView === "calendar" && effectiveCalendarMode === "month") {
      const flat = monthWeeks.flat();
      return { from: flat[0]!, to: flat[flat.length - 1]! };
    }
    return { from: weekDates[0]!, to: weekDates[6]! };
  }, [mainView, effectiveCalendarMode, monthWeeks, weekDates]);

  const occurrencesQuery = useOccurrences({ from: range.from, to: range.to });

  // Only occurrences the selected person is assigned to.
  const personOccurrences = useMemo(() => {
    const list = occurrencesQuery.data ?? [];
    if (!effectivePersonId) return [] as TaskOccurrence[];
    return list.filter((o) =>
      (isCleaner ? o.cleaners : o.supervisors).some((c) => c.id === effectivePersonId),
    );
  }, [occurrencesQuery.data, effectivePersonId, isCleaner]);

  // Which sites are work orders (by the site's own flags).
  const workOrderSiteIds = useMemo(() => {
    const set = new Set<string>();
    for (const s of sitesQuery.data ?? []) {
      if (s.workOrderSite || s.oneTimeSite) set.add(s.id);
    }
    return set;
  }, [sitesQuery.data]);

  // Distinct assigned sites (sorted by name) with a stable colour per site.
  const siteMetas = useMemo(() => {
    const byId = new Map<string, { siteName: string; isWorkOrder: boolean }>();
    for (const o of personOccurrences) {
      if (!byId.has(o.siteId)) {
        byId.set(o.siteId, {
          siteName: o.siteName,
          isWorkOrder: workOrderSiteIds.has(o.siteId) || o.assignmentType === "WORK_ORDER",
        });
      }
    }
    const entries = [...byId.entries()].sort((a, b) =>
      a[1].siteName.localeCompare(b[1].siteName),
    );
    let generalIdx = 0;
    let workOrderIdx = 0;
    const metas = new Map<string, SiteMeta>();
    for (const [siteId, info] of entries) {
      const hex = info.isWorkOrder
        ? WORKORDER_HEXES[workOrderIdx++ % WORKORDER_HEXES.length]!
        : GENERAL_HEXES[generalIdx++ % GENERAL_HEXES.length]!;
      metas.set(siteId, { siteId, siteName: info.siteName, hex, isWorkOrder: info.isWorkOrder });
    }
    return metas;
  }, [personOccurrences, workOrderSiteIds]);

  const siteRows = useMemo(() => [...siteMetas.values()], [siteMetas]);

  // siteId -> set of dates that have a complaint raised (from the full complaint list).
  const complaintsBySiteDate = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const c of complaintsQuery.data?.complaints ?? []) {
      if (!c.siteId) continue;
      for (const t of c.tasks) {
        if (!t.date) continue;
        const set = map.get(c.siteId) ?? new Set<string>();
        set.add(t.date);
        map.set(c.siteId, set);
      }
    }
    return map;
  }, [complaintsQuery.data]);

  // siteId -> date -> { total, completed, hasComplaint }. Day and date views share it, since
  // each visible week has exactly one date per weekday.
  const statBySiteDate = useMemo(() => {
    const map = new Map<string, Map<string, CellStat>>();
    for (const o of personOccurrences) {
      if (o.status === "CANCELLED") continue;
      const inner = map.get(o.siteId) ?? new Map<string, CellStat>();
      map.set(o.siteId, inner);
      const cur = inner.get(o.date) ?? { total: 0, completed: 0, hasComplaint: false };
      cur.total += 1;
      if (o.status === "COMPLETED") cur.completed += 1;
      inner.set(o.date, cur);
    }
    for (const [siteId, dates] of complaintsBySiteDate) {
      const inner = map.get(siteId);
      if (!inner) continue;
      for (const date of dates) {
        const cur = inner.get(date);
        if (cur) cur.hasComplaint = true;
      }
    }
    return map;
  }, [personOccurrences, complaintsBySiteDate]);

  // date -> distinct site ids (calendar month view).
  const byDateSites = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const o of personOccurrences) {
      const set = map.get(o.date) ?? new Set<string>();
      set.add(o.siteId);
      map.set(o.date, set);
    }
    return map;
  }, [personOccurrences]);

  // siteId -> the selected cleaner's assigned shifts at that site (their check-in/out windows).
  const cleanerShiftsBySite = useMemo(() => {
    const map = new Map<string, AssignedShift[]>();
    if (!isCleaner || !effectivePersonId) return map;
    for (const s of sitesQuery.data ?? []) {
      const profile = s.cleanerProfiles.find((p) => p.cleanerId === effectivePersonId);
      if (profile && profile.shifts.length > 0) map.set(s.id, profile.shifts);
    }
    return map;
  }, [isCleaner, effectivePersonId, sitesQuery.data]);

  const personOptions = useMemo(
    () => people.map((p) => ({ id: p.id, name: personName(p.firstName, p.lastName) })),
    [people],
  );

  function navPrev() {
    if (mainView === "calendar" && effectiveCalendarMode === "month") {
      setMonthCursor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
    } else {
      setWeekStart((d) => {
        const n = new Date(d);
        n.setDate(n.getDate() - 7);
        return n;
      });
    }
  }
  function navNext() {
    if (mainView === "calendar" && effectiveCalendarMode === "month") {
      setMonthCursor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
    } else {
      setWeekStart((d) => {
        const n = new Date(d);
        n.setDate(n.getDate() + 7);
        return n;
      });
    }
  }
  function navToday() {
    setWeekStart(getWeekStart(new Date()));
    const d = new Date();
    setMonthCursor(new Date(d.getFullYear(), d.getMonth(), 1));
  }

  const monthLabel = monthCursor.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const rangeLabel =
    mainView === "calendar" && effectiveCalendarMode === "month"
      ? monthLabel
      : formatWeekRangeLabel(weekDates[0]!, weekDates[6]!);

  const isLoading =
    (isCleaner ? cleanersQuery.isLoading : usersQuery.isLoading) || occurrencesQuery.isLoading;

  // Data for the open day-detail modal (this person's tasks + complaints at that site/date).
  const detailOccurrences = useMemo(
    () =>
      detailCell
        ? personOccurrences.filter((o) => o.siteId === detailCell.siteId && o.date === detailCell.date)
        : [],
    [detailCell, personOccurrences],
  );
  const detailComplaints = useMemo(
    () =>
      detailCell
        ? (complaintsQuery.data?.complaints ?? []).filter(
            (c) => c.siteId === detailCell.siteId && c.tasks.some((t) => t.date === detailCell.date),
          )
        : [],
    [detailCell, complaintsQuery.data],
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Person picker — matches the operations tab's site dropdown */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SiteFilterSelect
          variant="field"
          sites={personOptions}
          value={effectivePersonId}
          onChange={setPersonId}
          loading={isCleaner ? cleanersQuery.isLoading : usersQuery.isLoading}
          icon={Users}
          ariaLabel={`Select ${noun}`}
          placeholder={`Select ${noun}`}
          emptyLabel={`No ${noun}s`}
          searchPlaceholder={`Search ${noun}s…`}
          noResultsLabel={`No ${noun}s match your search.`}
          noOptionsLabel={`No ${noun}s available.`}
        />
      </div>

      <div className="flex flex-col overflow-hidden rounded-2xl bg-surface shadow-sm">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-grey-200 px-4 py-3">
        <h3 className="min-w-[140px] text-base font-bold text-on-surface">{rangeLabel}</h3>

        {/* navigation */}
        <div className="flex items-center rounded-xl border border-grey-200 bg-surface p-1">
          <button
            type="button"
            aria-label="Previous"
            onClick={navPrev}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-grey-500 transition-colors hover:bg-grey-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <ChevronLeft size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={navToday}
            className="rounded-lg px-3 py-1 text-xs font-semibold text-on-surface transition-colors hover:bg-grey-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Today
          </button>
          <button
            type="button"
            aria-label="Next"
            onClick={navNext}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-grey-500 transition-colors hover:bg-grey-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </div>

        {/* View toggles */}
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {mainView === "schedule" && (
            <div className="flex overflow-hidden rounded-xl border border-grey-200">
              <button
                type="button"
                onClick={() => setScopeView("date")}
                className={cn(
                  SEGMENT_BTN,
                  scopeView === "date" ? "bg-primary text-white" : "text-on-surface hover:bg-grey-100",
                )}
              >
                Date
              </button>
              <button
                type="button"
                onClick={() => setScopeView("day")}
                className={cn(
                  SEGMENT_BTN,
                  scopeView === "day" ? "bg-primary text-white" : "text-on-surface hover:bg-grey-100",
                )}
              >
                Day
              </button>
            </div>
          )}

          {/* Week / Month sub-toggle — cleaners only (supervisors have day-only schedules) */}
          {mainView === "calendar" && isCleaner && (
            <div className="flex overflow-hidden rounded-xl border border-grey-200">
              <button
                type="button"
                onClick={() => setCalendarMode("week")}
                className={cn(
                  SEGMENT_BTN,
                  calendarMode === "week" ? "bg-primary text-white" : "text-on-surface hover:bg-grey-100",
                )}
              >
                Week
              </button>
              <button
                type="button"
                onClick={() => setCalendarMode("month")}
                className={cn(
                  SEGMENT_BTN,
                  calendarMode === "month" ? "bg-primary text-white" : "text-on-surface hover:bg-grey-100",
                )}
              >
                Month
              </button>
            </div>
          )}
          <div className="flex overflow-hidden rounded-xl border border-grey-200">
            <button
              type="button"
              onClick={() => setMainView("schedule")}
              className={cn(
                SEGMENT_BTN,
                mainView === "schedule" ? "bg-primary text-white" : "text-on-surface hover:bg-grey-100",
              )}
            >
              Schedule
            </button>
            <button
              type="button"
              onClick={() => setMainView("calendar")}
              className={cn(
                SEGMENT_BTN,
                mainView === "calendar" ? "bg-primary text-white" : "text-on-surface hover:bg-grey-100",
              )}
            >
              Calendar
            </button>
          </div>
        </div>
      </div>

      {/* Legend */}
      {siteRows.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-grey-200 bg-grey-50 px-4 py-2.5">
          {siteRows.map((s) => (
            <span key={s.siteId} className="inline-flex items-center gap-1.5 text-xs text-on-surface">
              <span
                className="inline-block h-3 w-3 rounded-sm"
                style={{ backgroundColor: s.hex }}
                aria-hidden="true"
              />
              {s.siteName}
              {s.isWorkOrder && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-[#F97316]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#C2410C]">
                  <Briefcase size={9} aria-hidden="true" />
                  Work order
                </span>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Body */}
      <div>
        {isLoading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner />
          </div>
        ) : !effectivePersonId ? (
          <EmptyState title={`Select a ${noun}`} description={`Choose a ${noun} to see their site schedule.`} />
        ) : siteRows.length === 0 ? (
          <EmptyState
            title="No assigned sites"
            description={`This ${noun} has no tasks in the selected period.`}
          />
        ) : mainView === "schedule" ? (
          <ScheduleTable
            scopeView={scopeView}
            weekDates={weekDates}
            today={today}
            siteRows={siteRows}
            statBySiteDate={statBySiteDate}
            mode="count"
            onCellClick={(siteId, date, siteName) => setDetailCell({ siteId, siteName, date })}
            onOpenSite={(siteId) => router.push(`/admin/workforce?tab=operations&site=${siteId}`)}
          />
        ) : effectiveCalendarMode === "week" ? (
          <WeekTimeGrid
            weekDates={weekDates}
            today={today}
            occurrences={personOccurrences}
            siteMetas={siteMetas}
            shiftsBySite={cleanerShiftsBySite}
          />
        ) : (
          <MonthCalendar
            monthWeeks={monthWeeks}
            month={monthCursor.getMonth()}
            today={today}
            byDateSites={byDateSites}
            siteMetas={siteMetas}
            holidays={holidays}
          />
        )}
      </div>
      </div>

      <ScheduleCellDetailModal
        open={detailCell !== null}
        onClose={() => setDetailCell(null)}
        siteName={detailCell?.siteName ?? ""}
        date={detailCell?.date ?? ""}
        occurrences={detailOccurrences}
        complaints={detailComplaints}
      />
    </div>
  );
}

// ── Schedule (table) view ───────────────────────────────────────────────────────

interface ScheduleTableProps {
  scopeView: ScopeView;
  weekDates: string[];
  today: string;
  siteRows: SiteMeta[];
  statBySiteDate: Map<string, Map<string, CellStat>>;
  /** "count": completed/total + check (cleaner/supervisor). "status": site status badge. */
  mode?: "count" | "status";
  /** In "status" mode, colour future date cells the same as past dates instead of "Scheduled". */
  futureLikePast?: boolean;
  onCellClick?: (siteId: string, date: string, siteName: string) => void;
  /** When set, an eye icon by each site name opens that site in the Operations tab. */
  onOpenSite?: (siteId: string) => void;
}

export function ScheduleTable({
  scopeView,
  weekDates,
  today,
  siteRows,
  statBySiteDate,
  mode = "count",
  futureLikePast = false,
  onCellClick,
  onOpenSite,
}: ScheduleTableProps) {
  const dayView = scopeView === "day";

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[760px]">
        {/* Header */}
        <div
          className="grid border-b-2 border-grey-300 bg-surface"
          style={{ gridTemplateColumns: GRID_TEMPLATE }}
        >
          <div className="flex items-end px-4 pb-2 pt-3 text-xs font-bold uppercase tracking-wide text-grey-500">
            Site
          </div>
          {weekDates.map((dateStr) => {
            const dt = new Date(dateStr + "T00:00:00");
            const wd = dayOfWeekOf(dateStr);
            const isToday = !dayView && dateStr === today;
            return (
              <div
                key={dateStr}
                className={cn(
                  "flex flex-col items-center border-l border-grey-200 py-2.5",
                  isToday && "bg-primary/5",
                )}
              >
                <span
                  className={cn(
                    "text-[11px] font-bold uppercase tracking-wide",
                    isToday ? "text-primary" : "text-grey-600",
                  )}
                >
                  {WEEKDAY_SHORT[wd]}
                </span>
                {!dayView && (
                  <span
                    className={cn(
                      "mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold",
                      isToday ? "bg-primary text-white shadow-sm" : "text-on-surface",
                    )}
                  >
                    {dt.getDate()}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Rows */}
        {siteRows.map((s, ri) => (
          <div
            key={s.siteId}
            className={cn(
              "grid border-b border-grey-200 last:border-b-0",
              ri % 2 === 1 && "bg-grey-100/40",
            )}
            style={{ gridTemplateColumns: GRID_TEMPLATE }}
          >
            <div className="flex min-w-0 items-center gap-2.5 px-4 py-2.5">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: s.hex }}
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1 truncate text-sm text-on-surface" title={s.siteName}>
                {s.siteName}
              </span>
              {s.isWorkOrder && (
                <Briefcase size={13} className="shrink-0 text-[#C2410C]" aria-hidden="true" />
              )}
              {onOpenSite && (
                <button
                  type="button"
                  onClick={() => onOpenSite(s.siteId)}
                  aria-label={`Open ${s.siteName} in Operations`}
                  title="Open in Operations"
                  className="shrink-0 text-grey-400 transition-colors hover:text-primary"
                >
                  <Eye size={15} aria-hidden="true" />
                </button>
              )}
            </div>
            {weekDates.map((dateStr) => {
              const stat = statBySiteDate.get(s.siteId)?.get(dateStr);
              const total = stat?.total ?? 0;
              const isToday = !dayView && dateStr === today;
              return (
                <div
                  key={dateStr}
                  className={cn(
                    "relative min-h-[40px] border-l border-grey-200",
                    isToday && "bg-primary/[0.04]",
                  )}
                >
                  {total > 0 && stat && (
                    mode === "status" ? (
                      (() => {
                        const status = statusOf(stat, dateStr, today);
                        const meta = STATUS_META[status];
                        // Site schedule: keep the "Scheduled" label but use the past-day colour.
                        const cls = futureLikePast && status === "scheduled" ? STATUS_META.cleaning.cls : meta.cls;
                        return (
                          <button
                            type="button"
                            onClick={() => onCellClick?.(s.siteId, dateStr, s.siteName)}
                            title={`${s.siteName} — ${meta.tip} (${stat.completed}/${stat.total} done)`}
                            className={cn(
                              "absolute inset-1 flex items-center justify-center rounded-md px-1 text-[10px] font-semibold shadow-sm transition-transform hover:scale-[1.03]",
                              cls,
                            )}
                          >
                            {meta.label}
                          </button>
                        );
                      })()
                    ) : (
                      <button
                        type="button"
                        onClick={() => onCellClick?.(s.siteId, dateStr, s.siteName)}
                        title={`${s.siteName} — ${stat.completed}/${stat.total} tasks completed${stat.hasComplaint ? " · complaint" : ""}`}
                        className={cn(
                          "absolute inset-1 flex items-center justify-center rounded-md text-xs font-semibold text-white shadow-sm transition-transform hover:scale-[1.04]",
                          s.isWorkOrder && "ring-2 ring-offset-1 ring-[#F97316]",
                        )}
                        style={{ backgroundColor: s.hex }}
                      >
                        {stat.completed === stat.total ? (
                          <CheckCircle2 size={16} aria-hidden="true" />
                        ) : (
                          <span>
                            {stat.completed}/{stat.total}
                          </span>
                        )}
                        {stat.hasComplaint && (
                          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-white ring-1 ring-white">
                            <TriangleAlert size={9} aria-hidden="true" />
                          </span>
                        )}
                      </button>
                    )
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Calendar (month) view ───────────────────────────────────────────────────────

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface MonthCalendarProps {
  monthWeeks: string[][];
  month: number;
  today: string;
  byDateSites: Map<string, Set<string>>;
  siteMetas: Map<string, SiteMeta>;
  holidays: Map<string, string>;
}

export function MonthCalendar({ monthWeeks, month, today, byDateSites, siteMetas, holidays }: MonthCalendarProps) {
  return (
    <div className="flex flex-col">
      <div className="grid grid-cols-7 border-b border-grey-200">
        {DAY_LABELS.map((d) => (
          <div key={d} className="py-2 text-center text-xs font-medium text-grey-500">
            {d}
          </div>
        ))}
      </div>

      {monthWeeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7 border-b border-grey-200 last:border-b-0">
          {week.map((dateStr) => {
            const dt = new Date(dateStr + "T00:00:00");
            const isCurrentMonth = dt.getMonth() === month;
            const isToday = dateStr === today;
            const holidayName = holidays.get(dateStr);
            const siteIds = [...(byDateSites.get(dateStr) ?? [])]
              .map((id) => siteMetas.get(id))
              .filter((m): m is SiteMeta => Boolean(m))
              .sort((a, b) => a.siteName.localeCompare(b.siteName));
            const visible = siteIds.slice(0, 4);
            const overflow = siteIds.length - visible.length;

            return (
              <div
                key={dateStr}
                title={holidayName}
                className={cn(
                  "min-h-[104px] border-r border-grey-200 p-1 last:border-r-0",
                  !isCurrentMonth && "bg-grey-100/30",
                  holidayName && "bg-rose-50",
                )}
              >
                <div className="mb-1 flex items-center justify-between gap-1">
                  <span
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                      isToday ? "bg-primary text-white" : isCurrentMonth ? "text-on-surface" : "text-grey-400",
                    )}
                  >
                    {dt.getDate()}
                  </span>
                  {holidayName && (
                    <span
                      className="min-w-0 max-w-full truncate rounded-full bg-rose-100 px-1.5 py-0.5 text-[9px] font-semibold text-rose-600"
                      title={holidayName}
                    >
                      {holidayName}
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  {visible.map((s) => (
                    <div
                      key={s.siteId}
                      title={s.siteName}
                      className={cn(
                        "flex items-center gap-1 truncate rounded px-1.5 py-0.5 text-[10px] font-medium text-white",
                        s.isWorkOrder && "ring-1 ring-inset ring-white/70",
                      )}
                      style={{ backgroundColor: s.hex }}
                    >
                      {s.isWorkOrder && <Briefcase size={9} className="shrink-0" aria-hidden="true" />}
                      <span className="truncate">{s.siteName}</span>
                    </div>
                  ))}
                  {overflow > 0 && (
                    <span className="px-1 text-[10px] font-medium text-grey-500">+{overflow} more</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ── Week time-grid (cleaner shifts by time) ─────────────────────────────────────

interface TimedBlockBase {
  key: string;
  siteId: string;
  siteName: string;
  hex: string;
  isWorkOrder: boolean;
  startMin: number;         // day-part position within this column (0..1440)
  endMin: number;
  labelStartMin: number;    // full shift window for the label (labelEnd may wrap past midnight)
  labelEndMin: number;
  shiftName?: string | null;
  count: number;
  overnight: boolean;       // part of an overnight shift
  continued: boolean;       // morning half shown on the next day's column
}
type TimedBlock = TimedBlockBase & { col: number; cols: number };

interface WeekTimeGridProps {
  weekDates: string[];
  today: string;
  occurrences: TaskOccurrence[];
  siteMetas: Map<string, SiteMeta>;
  /** siteId -> the selected cleaner's assigned shifts at that site. */
  shiftsBySite: Map<string, AssignedShift[]>;
}

/** Greedy side-by-side layout for overlapping blocks within one day. */
function layoutOverlaps(blocks: TimedBlockBase[]): TimedBlock[] {
  const sorted = [...blocks].sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin);
  const result: TimedBlock[] = [];
  let cluster: (TimedBlockBase & { col: number })[] = [];
  let clusterEnd = -1;

  function flush() {
    const cols = cluster.reduce((m, b) => Math.max(m, b.col + 1), 0);
    for (const b of cluster) result.push({ ...b, cols });
    cluster = [];
    clusterEnd = -1;
  }

  for (const b of sorted) {
    if (cluster.length > 0 && b.startMin >= clusterEnd) flush();
    const used = new Set(cluster.filter((c) => c.endMin > b.startMin).map((c) => c.col));
    let col = 0;
    while (used.has(col)) col++;
    cluster.push({ ...b, col });
    clusterEnd = Math.max(clusterEnd, b.endMin);
  }
  flush();
  return result;
}

function WeekTimeGrid({ weekDates, today, occurrences, siteMetas, shiftsBySite }: WeekTimeGridProps) {
  const weekSet = new Set(weekDates);

  // 1) Which (date, site) the cleaner works, with a fallback task-time window + task count.
  const workByDate = new Map<string, Map<string, { count: number; startMin: number; endMin: number }>>();
  for (const o of occurrences) {
    if (!siteMetas.has(o.siteId)) continue;
    const dayMap = workByDate.get(o.date) ?? new Map<string, { count: number; startMin: number; endMin: number }>();
    workByDate.set(o.date, dayMap);
    const s = timeToMinutes(o.startTime);
    const e = timeToMinutes(o.endTime);
    const cur = dayMap.get(o.siteId);
    if (cur) {
      cur.count += 1;
      cur.startMin = Math.min(cur.startMin, s);
      cur.endMin = Math.max(cur.endMin, e);
    } else {
      dayMap.set(o.siteId, { count: 1, startMin: s, endMin: e });
    }
  }

  // 2) For each worked (site, day), place a block per assigned shift (using the shift's
  //    check-in/out window). Overnight shifts split into an evening part (this day → midnight)
  //    and a morning part (midnight → end) on the next day. Sites with no assigned shift fall
  //    back to the task time window.
  const rawByDay = new Map<string, TimedBlockBase[]>();
  const pushBlock = (date: string, b: TimedBlockBase) => {
    const list = rawByDay.get(date) ?? [];
    list.push(b);
    rawByDay.set(date, list);
  };
  const pushWindow = (
    date: string,
    meta: SiteMeta,
    idKey: string,
    startMin: number,
    endMin: number,
    shiftName: string | null,
    count: number,
  ) => {
    const base = {
      siteId: meta.siteId,
      siteName: meta.siteName,
      hex: meta.hex,
      isWorkOrder: meta.isWorkOrder,
      shiftName,
      count,
      labelStartMin: startMin,
      labelEndMin: endMin,
    };
    if (endMin <= startMin) {
      pushBlock(date, { ...base, key: `${date}_${idKey}_ev`, startMin, endMin: 24 * 60, overnight: true, continued: false });
      const nd = nextDay(date);
      if (weekSet.has(nd)) {
        pushBlock(nd, { ...base, key: `${nd}_${idKey}_am`, startMin: 0, endMin, overnight: true, continued: true });
      }
    } else {
      pushBlock(date, { ...base, key: `${date}_${idKey}`, startMin, endMin, overnight: false, continued: false });
    }
  };

  for (const [date, dayMap] of workByDate) {
    const wd = dayOfWeekOf(date);
    for (const [siteId, w] of dayMap) {
      const meta = siteMetas.get(siteId)!;
      const applicable = (shiftsBySite.get(siteId) ?? []).filter((sh) => !sh.dayOfWeek || sh.dayOfWeek === wd);
      if (applicable.length > 0) {
        for (const sh of applicable) {
          pushWindow(date, meta, `${siteId}_${sh.id}`, timeToMinutes(sh.startTime), timeToMinutes(sh.endTime), sh.name, w.count);
        }
      } else {
        pushWindow(date, meta, `${siteId}_task`, w.startMin, w.endMin, null, w.count);
      }
    }
  }

  const blocksByDay = new Map<string, TimedBlock[]>();
  let minStart = 8 * 60;
  let maxEnd = 18 * 60;
  for (const dateStr of weekDates) {
    const laid = layoutOverlaps(rawByDay.get(dateStr) ?? []);
    blocksByDay.set(dateStr, laid);
    for (const b of laid) {
      minStart = Math.min(minStart, b.startMin);
      maxEnd = Math.max(maxEnd, b.endMin);
    }
  }

  const gridStart = Math.max(0, Math.floor(minStart / 60));
  const gridEnd = Math.min(24, Math.max(gridStart + 1, Math.ceil(maxEnd / 60)));
  const hours = Array.from({ length: gridEnd - gridStart }, (_, i) => gridStart + i);
  const pxPerMin = SLOT_HEIGHT / 60;
  const gridHeight = (gridEnd - gridStart) * SLOT_HEIGHT;

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[760px]">
        {/* Day header */}
        <div className="flex border-b-2 border-grey-300 bg-surface">
          <div className="w-14 shrink-0 border-r border-grey-200" />
          {weekDates.map((dateStr) => {
            const dt = new Date(dateStr + "T00:00:00");
            const isToday = dateStr === today;
            return (
              <div
                key={dateStr}
                className={cn(
                  "flex flex-1 flex-col items-center border-l border-grey-200 py-2.5 first:border-l-0",
                  isToday && "bg-primary/5",
                )}
              >
                <span
                  className={cn(
                    "text-[11px] font-bold uppercase tracking-wide",
                    isToday ? "text-primary" : "text-grey-600",
                  )}
                >
                  {WEEKDAY_SHORT[dayOfWeekOf(dateStr)]}
                </span>
                <span
                  className={cn(
                    "mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold",
                    isToday ? "bg-primary text-white shadow-sm" : "text-on-surface",
                  )}
                >
                  {dt.getDate()}
                </span>
              </div>
            );
          })}
        </div>

        {/* Time grid */}
        <div className="overflow-y-auto" style={{ maxHeight: 560 }}>
          <div className="relative flex">
            {/* Hour labels */}
            <div className="w-14 shrink-0 border-r border-grey-200">
              {hours.map((h) => (
                <div
                  key={h}
                  className="relative flex items-start justify-end pr-2"
                  style={{ height: SLOT_HEIGHT }}
                >
                  <span className="relative -top-2 text-[10px] text-grey-400">{hourLabel(h)}</span>
                </div>
              ))}
            </div>

            {/* Day columns */}
            <div className="relative flex flex-1">
              {weekDates.map((dateStr) => {
                const isToday = dateStr === today;
                const blocks = blocksByDay.get(dateStr) ?? [];
                return (
                  <div
                    key={dateStr}
                    className={cn(
                      "relative flex-1 border-l border-grey-200 first:border-l-0",
                      isToday && "bg-primary/[0.03]",
                    )}
                    style={{ height: gridHeight }}
                  >
                    {hours.map((h) => (
                      <div
                        key={h}
                        className="absolute left-0 right-0 border-t border-grey-200/70"
                        style={{ top: (h - gridStart) * SLOT_HEIGHT }}
                      />
                    ))}
                    {blocks.map((b) => {
                      const top = (b.startMin - gridStart * 60) * pxPerMin;
                      const height = Math.max((b.endMin - b.startMin) * pxPerMin, 22);
                      const widthPct = 100 / b.cols;
                      return (
                        <div
                          key={b.key}
                          title={`${b.siteName} · ${fmtMins(b.labelStartMin)}–${fmtMins(b.labelEndMin)}${b.overnight ? " (overnight)" : ""}${b.shiftName ? ` · ${b.shiftName}` : ""}${b.count > 1 ? ` · ${b.count} tasks` : ""}`}
                          className={cn(
                            "absolute overflow-hidden rounded-md p-1 text-left text-white shadow-sm",
                            b.isWorkOrder && "ring-1 ring-inset ring-white/70",
                          )}
                          style={{
                            top,
                            height,
                            left: `calc(${b.col * widthPct}% + 2px)`,
                            width: `calc(${widthPct}% - 4px)`,
                            backgroundColor: b.hex,
                          }}
                        >
                          <p className="flex items-center gap-1 truncate text-[10px] font-semibold leading-tight">
                            {b.isWorkOrder && <Briefcase size={9} className="shrink-0" aria-hidden="true" />}
                            <span className="truncate">{b.siteName}</span>
                          </p>
                          {height > 30 && (
                            <p className="truncate text-[9px] leading-tight opacity-90">
                              {b.continued && "↳ "}
                              {fmtMins(b.labelStartMin)}–{fmtMins(b.labelEndMin)}
                            </p>
                          )}
                          {height > 46 && b.shiftName && (
                            <p className="truncate text-[9px] leading-tight opacity-80">{b.shiftName}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
