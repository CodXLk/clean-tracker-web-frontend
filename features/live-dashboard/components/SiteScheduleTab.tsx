"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { useSites } from "@/features/user-management/hooks/useSites";
import { useOccurrences } from "@/features/workforce/hooks/useAssignments";
import { usePublicHolidays } from "@/features/workforce/hooks/usePublicHolidays";
import { useComplaints } from "@/features/complaints/hooks/useComplaints";
import { useAttendanceLogs } from "@/features/attendance/hooks/useAttendance";
import { isSelectableInOperations } from "@/features/user-management/schemas/site.schema";
import { todayISODate } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { ScheduleCellDetailModal } from "./ScheduleCellDetailModal";
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

/**
 * Site-centric schedule: every active site (including non-completed work-order sites) as a row,
 * coloured on the days it has tasks. Has Schedule (date/day) and a month Calendar — no week
 * time-grid, since a site has no single shift window.
 */
export function SiteScheduleTab() {
  const today = todayISODate();
  const sitesQuery = useSites();
  const complaintsQuery = useComplaints();
  const router = useRouter();

  const [mainView, setMainView] = useState<MainView>("schedule");
  const [scopeView, setScopeView] = useState<ScopeView>("date");
  const [weekStart, setWeekStart] = useState<Date>(() => getWeekStart(new Date()));
  const [monthCursor, setMonthCursor] = useState<Date>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [detailCell, setDetailCell] = useState<{ siteId: string; siteName: string; date: string } | null>(null);

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
  const attendanceQuery = useAttendanceLogs({ from: range.from, to: range.to });
  const occurrences = useMemo(() => occurrencesQuery.data ?? [], [occurrencesQuery.data]);

  // Every active site, incl. work-order sites that are not yet completed.
  const siteMetas = useMemo(() => {
    const sorted = [...(sitesQuery.data ?? [])]
      .filter(isSelectableInOperations)
      .sort((a, b) => a.name.localeCompare(b.name));
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

  const siteRows = useMemo(() => [...siteMetas.values()], [siteMetas]);

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

  // (siteId_date) that a cleaner has checked in on — drives "today" status.
  const checkedInSet = useMemo(() => {
    const set = new Set<string>();
    for (const log of attendanceQuery.data ?? []) {
      if (log.actorRole === "CLEANER" && log.checkInAt) set.add(`${log.siteId}_${log.occurrenceDate}`);
    }
    return set;
  }, [attendanceQuery.data]);

  // siteId -> date -> { total, completed, hasComplaint, started }.
  const statBySiteDate = useMemo(() => {
    const map = new Map<string, Map<string, CellStat>>();
    for (const o of occurrences) {
      if (o.status === "CANCELLED" || !siteMetas.has(o.siteId)) continue;
      const inner = map.get(o.siteId) ?? new Map<string, CellStat>();
      map.set(o.siteId, inner);
      const cur = inner.get(o.date) ?? { total: 0, completed: 0, hasComplaint: false, started: false };
      cur.total += 1;
      if (o.status === "COMPLETED") cur.completed += 1;
      // Attendance is keyed to the shift's business date (overnight tails fold onto the start day),
      // which matches the occurrence's series date rather than its (possibly moved) display date.
      if (
        checkedInSet.has(`${o.siteId}_${o.date}`) ||
        checkedInSet.has(`${o.siteId}_${o.occurrenceDate}`)
      ) {
        cur.started = true;
      }
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
  }, [occurrences, siteMetas, complaintsBySiteDate, checkedInSet]);

  // date -> distinct site ids (month view).
  const byDateSites = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const o of occurrences) {
      if (!siteMetas.has(o.siteId)) continue;
      const set = map.get(o.date) ?? new Set<string>();
      set.add(o.siteId);
      map.set(o.date, set);
    }
    return map;
  }, [occurrences, siteMetas]);

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

  const isLoading = sitesQuery.isLoading || occurrencesQuery.isLoading;

  // Data for the open day-detail modal (all tasks + complaints at that site/date).
  const detailOccurrences = useMemo(
    () =>
      detailCell
        ? occurrences.filter((o) => o.siteId === detailCell.siteId && o.date === detailCell.date)
        : [],
    [detailCell, occurrences],
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
            futureLikePast
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
