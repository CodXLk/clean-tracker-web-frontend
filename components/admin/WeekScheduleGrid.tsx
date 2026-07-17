"use client";

import { useMemo } from "react";
import { Building2, Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { TaskOccurrence, WorkType } from "@/features/workforce/schemas/assignment.schema";
import { WORK_TYPE_LABELS } from "@/features/workforce/schemas/assignment.schema";
import type { DayOfWeek } from "@/features/user-management/schemas/site.schema";

// Default colour per work type (matches the calendar's mapping).
const TYPE_HEX: Record<string, string> = {
  GENERAL_TASK: "#0B585A",
  PERIODICAL_TASK: "#A855F7",
  WORK_ORDER: "#F97316",
  OTHER: "#3B82F6",
};

const JS_DAY_TO_JAVA: DayOfWeek[] = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

function dayOfWeekOf(dateStr: string): DayOfWeek {
  return JS_DAY_TO_JAVA[new Date(dateStr + "T00:00:00").getDay()]!;
}

function occurrenceHex(occurrence: TaskOccurrence): string {
  return occurrence.colorHex ?? TYPE_HEX[occurrence.assignmentType] ?? "#0B585A";
}

function formatTimeShort(time: string): string {
  const [hStr, mStr] = time.split(":");
  const h = parseInt(hStr ?? "0", 10);
  const ampm = h >= 12 ? "pm" : "am";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const m = mStr ?? "00";
  return m === "00" ? `${h12}${ampm}` : `${h12}:${m}${ampm}`;
}

// ── Row model: Site → Floor → Area → one row per task ─────────────────────────
// Mirrors the classic printed cleaning-schedule layout: a bold band per floor,
// a tinted sub-band per area, then task rows marked on each scheduled day.

interface TaskRow {
  taskId: string;
  name: string;
  assignmentType: WorkType;
  hex: string;
  /** date → occurrences of this task on that date. */
  byDate: Map<string, TaskOccurrence[]>;
}

interface AreaGroup {
  areaName: string;
  rows: TaskRow[];
}

interface FloorGroup {
  floorName: string;
  areas: AreaGroup[];
}

interface SiteGroup {
  siteName: string;
  floors: FloorGroup[];
}

function buildSiteGroups(occurrences: TaskOccurrence[]): SiteGroup[] {
  const sites = new Map<string, Map<string, Map<string, Map<string, TaskRow>>>>();

  for (const occurrence of occurrences) {
    const floors = sites.get(occurrence.siteName) ?? new Map();
    sites.set(occurrence.siteName, floors);
    const areas = floors.get(occurrence.floorName) ?? new Map();
    floors.set(occurrence.floorName, areas);
    const tasks = areas.get(occurrence.areaName) ?? new Map();
    areas.set(occurrence.areaName, tasks);

    let row = tasks.get(occurrence.taskId);
    if (!row) {
      row = {
        taskId: occurrence.taskId,
        name: occurrence.name,
        assignmentType: occurrence.assignmentType,
        hex: occurrenceHex(occurrence),
        byDate: new Map(),
      };
      tasks.set(occurrence.taskId, row);
    }
    const list = row.byDate.get(occurrence.date) ?? [];
    list.push(occurrence);
    row.byDate.set(occurrence.date, list);
  }

  return [...sites.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([siteName, floors]) => ({
      siteName,
      floors: [...floors.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([floorName, areas]) => ({
          floorName,
          areas: [...areas.entries()]
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([areaName, tasks]) => ({
              areaName,
              rows: [...tasks.values()].sort((a, b) => a.name.localeCompare(b.name)),
            })),
        })),
    }));
}

// ── Component ─────────────────────────────────────────────────────────────────

interface WeekScheduleGridProps {
  weekDates: string[];
  occurrences: TaskOccurrence[];
  today: string;
  /** Null = no site selected → no working-day distinction. */
  workingDays: DayOfWeek[] | null;
  isLoading?: boolean;
  onOccurrenceClick?: (occurrence: TaskOccurrence) => void;
}

/**
 * Weekly scope view, styled after a printed cleaning schedule: floors as bold
 * full-width bands, areas as tinted sub-bands, and one row per task with a
 * check mark on every day it is scheduled.
 */
export function WeekScheduleGrid({
  weekDates,
  occurrences,
  today,
  workingDays,
  isLoading = false,
  onOccurrenceClick,
}: WeekScheduleGridProps) {
  const siteGroups = useMemo(() => buildSiteGroups(occurrences), [occurrences]);
  const multiSite = siteGroups.length > 1;
  const taskCount = useMemo(
    () =>
      siteGroups.reduce(
        (sum, s) =>
          sum + s.floors.reduce(
            (fSum, f) => fSum + f.areas.reduce((aSum, a) => aSum + a.rows.length, 0),
            0,
          ),
        0,
      ),
    [siteGroups],
  );

  function isWorkingDate(date: string): boolean {
    return workingDays === null || workingDays.includes(dayOfWeekOf(date));
  }

  const gridTemplate = "minmax(240px, 1.6fr) repeat(7, minmax(64px, 1fr))";

  /** Empty day-cell strip used to complete band rows (floor/area headers). */
  function bandCells(className?: string) {
    return weekDates.map((dateStr) => (
      <div key={dateStr} className={cn("border-l border-white/15", className)} />
    ));
  }

  return (
    <div className="flex flex-col">
      {/* Summary + work-type legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-grey-200 px-4 py-2.5">
        <span className="text-xs text-grey-500">
          {isLoading ? "Loading…" : `${taskCount} task${taskCount === 1 ? "" : "s"} scheduled this week`}
        </span>
        <div className="ml-auto flex flex-wrap items-center gap-3">
          {(Object.keys(WORK_TYPE_LABELS) as WorkType[]).map((type) => (
            <span key={type} className="flex items-center gap-1.5 text-xs text-grey-500">
              <span
                className="inline-block h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: TYPE_HEX[type] }}
                aria-hidden="true"
              />
              {WORK_TYPE_LABELS[type]}
            </span>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[820px]">
          {/* Day header row */}
          <div
            className="sticky top-0 z-10 grid border-b-2 border-grey-300 bg-surface"
            style={{ gridTemplateColumns: gridTemplate }}
          >
            <div className="flex items-end px-4 pb-2 pt-3 text-xs font-bold uppercase tracking-wide text-grey-500">
              Task
            </div>
            {weekDates.map((dateStr) => {
              const dt = new Date(dateStr + "T00:00:00");
              const day = dt.toLocaleDateString("en-US", { weekday: "short" });
              const isToday = dateStr === today;
              const working = isWorkingDate(dateStr);
              return (
                <div
                  key={dateStr}
                  className={cn(
                    "flex flex-col items-center border-l border-grey-200 py-2",
                    isToday && "bg-primary/5",
                    !working && "bg-grey-100/70",
                  )}
                >
                  <span
                    className={cn(
                      "text-xs font-bold uppercase tracking-wide",
                      isToday ? "text-primary" : working ? "text-grey-700" : "text-grey-400",
                    )}
                  >
                    {day}
                  </span>
                  <span
                    className={cn(
                      "mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                      isToday ? "bg-primary text-white" : working ? "text-on-surface" : "text-grey-400",
                    )}
                  >
                    {dt.getDate()}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Body */}
          {isLoading ? (
            <p className="px-4 py-10 text-center text-sm text-grey-500">Loading schedule…</p>
          ) : siteGroups.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-grey-500">
              No tasks are scheduled this week.
            </p>
          ) : (
            siteGroups.map((site) => (
              <div key={site.siteName}>
                {/* Site band — only when multiple sites are visible */}
                {multiSite && (
                  <div
                    className="grid bg-on-surface"
                    style={{ gridTemplateColumns: gridTemplate }}
                  >
                    <div className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white">
                      <Building2 size={14} aria-hidden="true" />
                      {site.siteName}
                    </div>
                    {bandCells()}
                  </div>
                )}

                {site.floors.map((floor) => (
                  <div key={floor.floorName}>
                    {/* Floor band — bold full-width section header */}
                    <div
                      className="grid bg-primary"
                      style={{ gridTemplateColumns: gridTemplate }}
                    >
                      <div className="px-4 py-2 text-sm font-bold uppercase tracking-wide text-white">
                        {floor.floorName}
                      </div>
                      {bandCells()}
                    </div>

                    {floor.areas.map((area) => (
                      <div key={area.areaName}>
                        {/* Area sub-band */}
                        <div
                          className="grid border-b border-grey-200 bg-primary/10"
                          style={{ gridTemplateColumns: gridTemplate }}
                        >
                          <div className="px-4 py-1.5 text-[13px] font-semibold text-primary">
                            {area.areaName}
                          </div>
                          {weekDates.map((dateStr) => (
                            <div
                              key={dateStr}
                              className={cn(
                                "border-l border-grey-200/60",
                                !isWorkingDate(dateStr) && "bg-grey-200/30",
                              )}
                            />
                          ))}
                        </div>

                        {/* Task rows */}
                        {area.rows.map((row, rowIndex) => (
                          <div
                            key={row.taskId}
                            className={cn(
                              "grid border-b border-grey-200 transition-colors hover:bg-primary/[0.04]",
                              rowIndex % 2 === 1 && "bg-grey-100/40",
                            )}
                            style={{ gridTemplateColumns: gridTemplate }}
                          >
                            <div className="flex min-w-0 items-center gap-2.5 px-4 py-2.5">
                              <span
                                className="h-2.5 w-2.5 shrink-0 rounded-full"
                                style={{ backgroundColor: row.hex }}
                                aria-hidden="true"
                              />
                              <span className="truncate text-sm text-on-surface" title={row.name}>
                                {row.name}
                              </span>
                            </div>
                            {weekDates.map((dateStr) => {
                              const cellOccurrences = row.byDate.get(dateStr) ?? [];
                              const first = cellOccurrences[0];
                              const working = isWorkingDate(dateStr);
                              const label = first
                                ? `${row.name} — ${cellOccurrences
                                    .map((o) => formatTimeShort(o.startTime.slice(0, 5)))
                                    .join(", ")}`
                                : undefined;
                              return (
                                <div
                                  key={dateStr}
                                  className={cn(
                                    "flex items-center justify-center border-l border-grey-200 py-1.5",
                                    dateStr === today && "bg-primary/[0.04]",
                                    !working && "bg-grey-100/60",
                                  )}
                                >
                                  {first && (
                                    <button
                                      type="button"
                                      title={label}
                                      aria-label={label}
                                      onClick={() => onOccurrenceClick?.(first)}
                                      className="relative flex h-6 w-6 items-center justify-center rounded-md shadow-sm transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
                                      style={{ backgroundColor: occurrenceHex(first) }}
                                    >
                                      <Check size={14} strokeWidth={3.5} className="text-white" aria-hidden="true" />
                                      {cellOccurrences.length > 1 && (
                                        <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-on-surface text-[9px] font-semibold text-white">
                                          {cellOccurrences.length}
                                        </span>
                                      )}
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
