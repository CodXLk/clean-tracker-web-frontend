"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { SiteFilterSelect } from "@/components/admin/SiteFilterSelect";
import { useClientSchedule } from "@/features/live-dashboard/hooks/useClientDashboard";
import { CLIENT_STATUS_META } from "@/features/live-dashboard/lib/siteDayStatus";
import { todayISODate } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
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
const NO_HOLIDAYS = new Map<string, string>();

/**
 * Client portal site schedule: the client's own sites with a simple status per day — Scheduled,
 * Cleaning in progress or Cleaning completed. Internal states (inspection, skipped, carried over)
 * are never shown, and cells aren't clickable.
 */
export function ClientSiteScheduleTab({ initialSiteId }: { initialSiteId?: string }) {
  const today = todayISODate();
  const [mainView, setMainView] = useState<MainView>("schedule");
  const [scopeView, setScopeView] = useState<ScopeView>("date");
  const [siteFilter, setSiteFilter] = useState<string>(initialSiteId ?? ALL_SITES);
  const [weekStart, setWeekStart] = useState<Date>(() => getWeekStart(new Date()));
  const [monthCursor, setMonthCursor] = useState<Date>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

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
  const range = useMemo(() => {
    if (mainView === "calendar") {
      const flat = monthWeeks.flat();
      return { from: flat[0]!, to: flat[flat.length - 1]! };
    }
    return { from: weekDates[0]!, to: weekDates[6]! };
  }, [mainView, monthWeeks, weekDates]);

  const query = useClientSchedule(range);

  const siteMetas = useMemo(() => {
    const sorted = [...(query.data?.sites ?? [])].sort((a, b) => {
      if (a.workOrderSite !== b.workOrderSite) return a.workOrderSite ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    let generalIdx = 0;
    let workOrderIdx = 0;
    const metas = new Map<string, SiteMeta>();
    for (const s of sorted) {
      const hex = s.workOrderSite
        ? WORKORDER_HEXES[workOrderIdx++ % WORKORDER_HEXES.length]!
        : GENERAL_HEXES[generalIdx++ % GENERAL_HEXES.length]!;
      metas.set(s.id, { siteId: s.id, siteName: s.name, hex, isWorkOrder: s.workOrderSite });
    }
    return metas;
  }, [query.data]);

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

  const statBySiteDate = useMemo(() => {
    const map = new Map<string, Map<string, CellStat>>();
    for (const day of query.data?.days ?? []) {
      const inner = map.get(day.siteId) ?? new Map<string, CellStat>();
      inner.set(day.date, {
        total: day.totalTasks,
        completed: day.completedTasks,
        hasComplaint: false,
        dayStatus: day.status,
      });
      map.set(day.siteId, inner);
    }
    return map;
  }, [query.data]);

  const byDateSites = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const day of query.data?.days ?? []) {
      if (siteFilter && day.siteId !== siteFilter) continue;
      const set = map.get(day.date) ?? new Set<string>();
      set.add(day.siteId);
      map.set(day.date, set);
    }
    return map;
  }, [query.data, siteFilter]);

  function shiftRange(step: number) {
    if (mainView === "calendar") {
      setMonthCursor((d) => new Date(d.getFullYear(), d.getMonth() + step, 1));
    } else {
      setWeekStart((d) => {
        const n = new Date(d);
        n.setDate(n.getDate() + step * 7);
        return n;
      });
    }
  }
  function navToday() {
    setWeekStart(getWeekStart(new Date()));
    const d = new Date();
    setMonthCursor(new Date(d.getFullYear(), d.getMonth(), 1));
  }

  const rangeLabel =
    mainView === "calendar"
      ? monthCursor.toLocaleDateString("en-US", { month: "long", year: "numeric" })
      : formatWeekRangeLabel(weekDates[0]!, weekDates[6]!);

  const toggle = (active: boolean) =>
    cn(SEGMENT_BTN, active ? "bg-primary text-white" : "text-on-surface hover:bg-grey-100");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SiteFilterSelect
          variant="field"
          sites={siteOptions}
          value={siteFilter}
          onChange={setSiteFilter}
          loading={query.isLoading}
          ariaLabel="Filter by site"
          placeholder="All sites"
        />
        <DayStatusLegend statuses={["SCHEDULED", "CLEANING_IN_PROGRESS", "CLEANING_COMPLETED"]} />
      </div>

      <div className="flex flex-col overflow-hidden rounded-2xl bg-surface shadow-sm">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-grey-200 px-4 py-3">
          <h3 className="min-w-[140px] text-base font-bold text-on-surface">{rangeLabel}</h3>
          <div className="flex items-center rounded-xl border border-grey-200 bg-surface p-1">
            <button
              type="button"
              aria-label="Previous"
              onClick={() => shiftRange(-1)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-grey-500 transition-colors hover:bg-grey-100"
            >
              <ChevronLeft size={16} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={navToday}
              className="rounded-lg px-3 py-1 text-xs font-semibold text-on-surface transition-colors hover:bg-grey-100"
            >
              Today
            </button>
            <button
              type="button"
              aria-label="Next"
              onClick={() => shiftRange(1)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-grey-500 transition-colors hover:bg-grey-100"
            >
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            {mainView === "schedule" && (
              <div className="flex overflow-hidden rounded-xl border border-grey-200">
                <button type="button" onClick={() => setScopeView("date")} className={toggle(scopeView === "date")}>
                  Date
                </button>
                <button type="button" onClick={() => setScopeView("day")} className={toggle(scopeView === "day")}>
                  Day
                </button>
              </div>
            )}
            <div className="flex overflow-hidden rounded-xl border border-grey-200">
              <button type="button" onClick={() => setMainView("schedule")} className={toggle(mainView === "schedule")}>
                Schedule
              </button>
              <button type="button" onClick={() => setMainView("calendar")} className={toggle(mainView === "calendar")}>
                Calendar
              </button>
            </div>
          </div>
        </div>

        <div>
          {query.isLoading ? (
            <div className="flex justify-center py-16">
              <LoadingSpinner />
            </div>
          ) : query.isError ? (
            <EmptyState title="Couldn't load the schedule" description="Please try again in a moment." />
          ) : siteRows.length === 0 ? (
            <EmptyState title="No sites" description="You don't have any active sites yet." />
          ) : mainView === "schedule" ? (
            <ScheduleTable
              scopeView={scopeView}
              weekDates={weekDates}
              today={today}
              siteRows={siteRows}
              statBySiteDate={statBySiteDate}
              mode="status"
              statusMeta={CLIENT_STATUS_META}
            />
          ) : (
            <MonthCalendar
              monthWeeks={monthWeeks}
              month={monthCursor.getMonth()}
              today={today}
              byDateSites={byDateSites}
              siteMetas={siteMetas}
              holidays={NO_HOLIDAYS}
            />
          )}
        </div>
      </div>
    </div>
  );
}
