"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { SiteFilterSelect } from "@/components/admin/SiteFilterSelect";
import { useSites } from "@/features/user-management/hooks/useSites";
import { useOccurrences } from "@/features/workforce/hooks/useAssignments";
import { usePublicHolidays } from "@/features/workforce/hooks/usePublicHolidays";
import { useComplaints } from "@/features/complaints/hooks/useComplaints";
import { useSiteDays, indexSiteDays } from "@/features/live-dashboard/hooks/useSiteDays";
import { weekdayShort } from "@/features/live-dashboard/lib/siteDayStatus";
import { isSelectableInOperations } from "@/features/user-management/schemas/site.schema";
import { todayISODate } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { ScheduleCellDetailModal } from "./ScheduleCellDetailModal";
import { DayStatusLegend } from "./SiteDayDetails";
import {
  ScheduleTable,
  MonthCalendar,
  getWeekStart,
  getDayDates,
  getMonthWeeks,
  formatWeekRangeLabel,
  GENERAL_HEXES,
  WORKORDER_HEXES,
  SEGMENT_BTN,
  type SiteMeta,
  type CellStat,
} from "./PersonScheduleTab";

type MainView = "schedule" | "calendar";
type ScopeView = "date" | "day";

const ALL_SITES = "";

interface SiteScheduleTabProps {
  /** Preselect one site (e.g. arriving from the overview). */
  initialSiteId?: string;
}

/**
 * Site-centric schedule: every active site (including non-completed work-order sites) as a row,
 * with each day's cleaning → inspection status driven by actual check-ins (Scheduled until a
 * cleaner checks in, then Cleaning / Paused, Pending inspection, Inspecting, Completed — plus
 * Skipped and Carried-over days). Has Schedule (date/day) and a month Calendar.
 */
export function SiteScheduleTab({ initialSiteId }: SiteScheduleTabProps) {
  const today = todayISODate();
  const sitesQuery = useSites();
  const complaintsQuery = useComplaints();
  const router = useRouter();

  const [mainView, setMainView] = useState<MainView>("schedule");
  const [scopeView, setScopeView] = useState<ScopeView>("date");
  const [siteFilter, setSiteFilter] = useState<string>(initialSiteId ?? ALL_SITES);
  const [weekStart, setWeekStart] = useState<Date>(() => getWeekStart(new Date()));
  const [monthCursor, setMonthCursor] = useState<Date>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [detailCell, setDetailCell] = useState<{ siteId: string; siteName: string; date: string } | null>(null);

  // Follow a new preselection (e.g. clicking another site on the overview).
  const [lastInitialSiteId, setLastInitialSiteId] = useState(initialSiteId);
  if (initialSiteId !== lastInitialSiteId) {
    setLastInitialSiteId(initialSiteId);
    setSiteFilter(initialSiteId ?? ALL_SITES);
  }

  const weekDates = useMemo(() => getDayDates(weekStart), [weekStart]);
  const monthWeeks = useMemo(
    () => getMonthWeeks(monthCursor.getFullYear(), monthCursor.getMonth()),
    [monthCursor],
  );

  const holidayYears = useMemo(() => {
    const set = new Set<number>();
    for (const w of monthWeeks) for (const d of w) set.add(Number(d.slice(0, 4)));
    return [...set];
  }, [monthWeeks]);
  const holidays = usePublicHolidays(holidayYears);

  const range = useMemo(() => {
    if (mainView === "calendar") {
      const flat = monthWeeks.flat();
      return { from: flat[0]!, to: flat[flat.length - 1]! };
    }
    return { from: weekDates[0]!, to: weekDates[6]! };
  }, [mainView, monthWeeks, weekDates]);

  const occurrencesQuery = useOccurrences({ from: range.from, to: range.to });
  const siteDaysQuery = useSiteDays({ from: range.from, to: range.to, enabled: mainView === "schedule" });
  const occurrences = useMemo(() => occurrencesQuery.data ?? [], [occurrencesQuery.data]);
  const siteDayIndex = useMemo(() => indexSiteDays(siteDaysQuery.data), [siteDaysQuery.data]);

  // Every active site, incl. work-order sites that are not yet completed.
  const siteMetas = useMemo(() => {
    const sorted = [...(sitesQuery.data ?? [])]
      .filter(isSelectableInOperations)
      .sort((a, b) => {
        // Work order sites lead, then alphabetical within each group.
        const aWo = Boolean(a.workOrderSite || a.oneTimeSite);
        const bWo = Boolean(b.workOrderSite || b.oneTimeSite);
        if (aWo !== bWo) return aWo ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
    let generalIdx = 0;
    let workOrderIdx = 0;
    const metas = new Map<string, SiteMeta>();
    for (const s of sorted) {
      const isWorkOrder = Boolean(s.workOrderSite || s.oneTimeSite);
      const hex = isWorkOrder
        ? WORKORDER_HEXES[workOrderIdx++ % WORKORDER_HEXES.length]!
        : GENERAL_HEXES[generalIdx++ % GENERAL_HEXES.length]!;
      metas.set(s.id, { siteId: s.id, siteName: s.name, hex, isWorkOrder });
    }
    return metas;
  }, [sitesQuery.data]);

  const siteOptions = useMemo(
    () => [
      { id: ALL_SITES, name: "All sites" },
      ...[...siteMetas.values()]
        .sort((a, b) => a.siteName.localeCompare(b.siteName))
        .map((s) => ({ id: s.siteId, name: s.siteName })),
    ],
    [siteMetas],
  );

  const siteRows = useMemo(() => {
    const all = [...siteMetas.values()];
    return siteFilter ? all.filter((s) => s.siteId === siteFilter) : all;
  }, [siteMetas, siteFilter]);

  // siteId -> set of dates with a complaint raised.
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

  // siteId -> date -> task counts + check-in driven status.
  const statBySiteDate = useMemo(() => {
    const map = new Map<string, Map<string, CellStat>>();
    for (const o of occurrences) {
      if (o.status === "CANCELLED" || !siteMetas.has(o.siteId)) continue;
      const inner = map.get(o.siteId) ?? new Map<string, CellStat>();
      map.set(o.siteId, inner);
      const cur = inner.get(o.date) ?? { total: 0, completed: 0, hasComplaint: false };
      cur.total += 1;
      if (o.status === "COMPLETED") cur.completed += 1;
      inner.set(o.date, cur);
    }
    for (const day of siteDaysQuery.data ?? []) {
      if (!siteMetas.has(day.siteId)) continue;
      const inner = map.get(day.siteId) ?? new Map<string, CellStat>();
      map.set(day.siteId, inner);
      const cur = inner.get(day.date) ?? { total: 0, completed: 0, hasComplaint: false };
      // Carried days count the earlier working day's tasks, so take the server's totals.
      cur.total = day.totalTasks;
      cur.completed = day.completedTasks;
      cur.dayStatus = day.status;
      cur.dayNote = day.carriedFrom
        ? `carried from ${weekdayShort(day.carriedFrom)}`
        : day.carriedTo
          ? `picked up on ${weekdayShort(day.carriedTo)}`
          : undefined;
      inner.set(day.date, cur);
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
  }, [occurrences, siteDaysQuery.data, siteMetas, complaintsBySiteDate]);

  // date -> distinct site ids (month view).
  const byDateSites = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const o of occurrences) {
      if (!siteMetas.has(o.siteId)) continue;
      if (siteFilter && o.siteId !== siteFilter) continue;
      const set = map.get(o.date) ?? new Set<string>();
      set.add(o.siteId);
      map.set(o.date, set);
    }
    return map;
  }, [occurrences, siteMetas, siteFilter]);

  function navPrev() {
    if (mainView === "calendar") {
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
    if (mainView === "calendar") {
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
    mainView === "calendar" ? monthLabel : formatWeekRangeLabel(weekDates[0]!, weekDates[6]!);

  const isLoading =
    sitesQuery.isLoading || occurrencesQuery.isLoading || (mainView === "schedule" && siteDaysQuery.isLoading);

  const detailDay = detailCell ? siteDayIndex.get(detailCell.siteId)?.get(detailCell.date) ?? null : null;

  // Tasks for the open day-detail modal; a carried day also lists the earlier day's General tasks.
  const detailOccurrences = useMemo(() => {
    if (!detailCell) return [];
    const carriedFrom = detailDay?.carriedFrom;
    return occurrences.filter(
      (o) =>
        o.siteId === detailCell.siteId &&
        (o.date === detailCell.date ||
          (carriedFrom != null && o.date === carriedFrom && o.assignmentType === "GENERAL_TASK")),
    );
  }, [detailCell, detailDay, occurrences]);
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
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SiteFilterSelect
          variant="field"
          sites={siteOptions}
          value={siteFilter}
          onChange={setSiteFilter}
          loading={sitesQuery.isLoading}
          ariaLabel="Filter by site"
          placeholder="All sites"
        />
        {mainView === "schedule" && (
          <DayStatusLegend
            statuses={[
              "SCHEDULED",
              "CLEANING_IN_PROGRESS",
              "CLEANING_PAUSED",
              "PENDING_INSPECTION",
              "INSPECTION_IN_PROGRESS",
              "COMPLETED",
              "CLEANING_SKIPPED",
              "CARRIED_OVER",
            ]}
          />
        )}
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

        {/* Body */}
        <div>
          {isLoading ? (
            <div className="flex justify-center py-16">
              <LoadingSpinner />
            </div>
          ) : siteRows.length === 0 ? (
            <EmptyState title="No sites" description="There are no active sites to show." />
          ) : mainView === "schedule" ? (
            <ScheduleTable
              scopeView={scopeView}
              weekDates={weekDates}
              today={today}
              siteRows={siteRows}
              statBySiteDate={statBySiteDate}
              mode="status"
              onCellClick={(siteId, date, siteName) => setDetailCell({ siteId, siteName, date })}
              onOpenSite={(siteId) => router.push(`/admin/workforce?tab=operations&site=${siteId}`)}
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
        siteDay={detailDay}
        onOpenCleaner={(id) => {
          setDetailCell(null);
          router.push(`/admin/dashboard?tab=cleaners-schedule&cleaner=${id}`);
        }}
        onOpenSupervisor={(id) => {
          setDetailCell(null);
          router.push(`/admin/dashboard?tab=supervisor-schedule&supervisor=${id}`);
        }}
      />
    </div>
  );
}
