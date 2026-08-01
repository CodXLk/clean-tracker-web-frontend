"use client";

import { useMemo } from "react";
import { Building2, Check, Plus, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { TaskOccurrence, WorkType } from "@/features/workforce/schemas/assignment.schema";
import { WORK_TYPE_LABELS } from "@/features/workforce/schemas/assignment.schema";
import type { DayOfWeek } from "@/features/user-management/schemas/site.schema";
import type { Floor } from "@/features/user-management/schemas/floor.schema";
import type { Area } from "@/features/user-management/schemas/area.schema";

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

// ── Row model ─────────────────────────────────────────────────────────────────

interface TaskRow {
  taskId: string;
  name: string;
  assignmentType: WorkType;
  hex: string;
  /** date → occurrences of this task on that date. */
  byDate: Map<string, TaskOccurrence[]>;
}

function occurrenceToRow(row: TaskRow | undefined, occurrence: TaskOccurrence): TaskRow {
  const r =
    row ??
    {
      taskId: occurrence.taskId,
      name: occurrence.name,
      assignmentType: occurrence.assignmentType,
      hex: occurrenceHex(occurrence),
      byDate: new Map<string, TaskOccurrence[]>(),
    };
  const list = r.byDate.get(occurrence.date) ?? [];
  list.push(occurrence);
  r.byDate.set(occurrence.date, list);
  return r;
}

/** Occurrences grouped by areaId → task rows (managed mode). */
function rowsByArea(occurrences: TaskOccurrence[]): Map<string, TaskRow[]> {
  const byArea = new Map<string, Map<string, TaskRow>>();
  for (const occurrence of occurrences) {
    const tasks = byArea.get(occurrence.areaId) ?? new Map<string, TaskRow>();
    byArea.set(occurrence.areaId, tasks);
    tasks.set(occurrence.taskId, occurrenceToRow(tasks.get(occurrence.taskId), occurrence));
  }
  const result = new Map<string, TaskRow[]>();
  for (const [areaId, tasks] of byArea) {
    result.set(areaId, [...tasks.values()].sort((a, b) => a.name.localeCompare(b.name)));
  }
  return result;
}

// Read-only grouping (all-sites mode): Site → Floor → Area → tasks, from occurrences.
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
    tasks.set(occurrence.taskId, occurrenceToRow(tasks.get(occurrence.taskId), occurrence));
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

export interface AddAssignmentTarget {
  floorId: string;
  areaId: string;
  date: string;
}

interface WeekScheduleGridProps {
  weekDates: string[];
  occurrences: TaskOccurrence[];
  today: string;
  /** Null = no single site selected → no working-day distinction. */
  workingDays: DayOfWeek[] | null;
  isLoading?: boolean;
  onOccurrenceClick?: (occurrence: TaskOccurrence) => void;

  // ── Managed mode (a single site is selected) ────────────────────────────────
  siteId?: string;
  floors?: Floor[];
  /** floorId → its areas. */
  areasByFloor?: Map<string, Area[]>;
  /** Date used by the task-column "+" (Monday of the visible week). */
  mondayDate?: string;
  structureLoading?: boolean;
  onAddAssignment?: (target: AddAssignmentTarget) => void;
  onAddFloor?: () => void;
  onEditFloor?: (floor: Floor) => void;
  onDeleteFloor?: (floor: Floor) => void;
  onAddArea?: (floor: Floor) => void;
  onEditArea?: (area: Area) => void;
  onDeleteArea?: (area: Area) => void;
}

/**
 * Weekly scope view styled after a printed cleaning schedule: floors as bold
 * full-width bands, areas as tinted sub-bands, one row per task with a check on
 * each scheduled day. When a single site is selected ("managed mode") the full
 * floor/area structure is shown (even empty ones) with inline add/edit/delete
 * and hover "+" affordances to create assignments per area/day.
 */
export function WeekScheduleGrid({
  weekDates,
  occurrences,
  today,
  workingDays,
  isLoading = false,
  onOccurrenceClick,
  siteId,
  floors,
  areasByFloor,
  mondayDate,
  structureLoading = false,
  onAddAssignment,
  onAddFloor,
  onEditFloor,
  onDeleteFloor,
  onAddArea,
  onEditArea,
  onDeleteArea,
}: WeekScheduleGridProps) {
  const managed = !!siteId && !!floors;

  const readOnlyGroups = useMemo(
    () => (managed ? [] : buildSiteGroups(occurrences)),
    [managed, occurrences],
  );
  const managedRowsByArea = useMemo(
    () => (managed ? rowsByArea(occurrences) : new Map<string, TaskRow[]>()),
    [managed, occurrences],
  );

  const taskCount = occurrences.length;
  const multiSite = !managed && readOnlyGroups.length > 1;

  function isWorkingDate(date: string): boolean {
    return workingDays === null || workingDays.includes(dayOfWeekOf(date));
  }

  const gridTemplate = "minmax(260px, 1.6fr) repeat(7, minmax(64px, 1fr))";

  /** Empty day-cell strip to complete a band row (site/floor headers). */
  function bandCells(className?: string) {
    return weekDates.map((dateStr) => (
      <div key={dateStr} className={cn("border-l border-white/15", className)} />
    ));
  }

  function DayHeaderRow() {
    return (
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
    );
  }

  /** One task row of check marks — shared by both modes. */
  function TaskRowView({ row, striped }: { row: TaskRow; striped: boolean }) {
    return (
      <div
        className={cn(
          "grid border-b border-grey-200 transition-colors hover:bg-primary/[0.04]",
          striped && "bg-grey-100/40",
        )}
        style={{ gridTemplateColumns: gridTemplate }}
      >
        <div className="flex min-w-0 items-center gap-2.5 px-4 py-2.5 pl-6">
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
    );
  }

  return (
    <div className="flex flex-col">
      {/* Summary + legend + (managed) add-floor */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-grey-200 px-4 py-2.5">
        <span className="text-xs text-grey-500">
          {isLoading
            ? "Loading…"
            : `${taskCount} task${taskCount === 1 ? "" : "s"} scheduled this week`}
        </span>
        {managed && (
          <button
            type="button"
            onClick={onAddFloor}
            className="flex items-center gap-1.5 rounded-lg border border-primary px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Plus size={13} aria-hidden="true" />
            Add floor
          </button>
        )}
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
        <div className="min-w-[860px]">
          <DayHeaderRow />

          {/* ── Managed mode ─────────────────────────────────────────────── */}
          {managed ? (
            structureLoading ? (
              <p className="px-4 py-10 text-center text-sm text-grey-500">Loading structure…</p>
            ) : floors!.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
                <p className="text-sm text-grey-500">This site has no floors yet.</p>
                <button
                  type="button"
                  onClick={onAddFloor}
                  className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <Plus size={15} aria-hidden="true" />
                  Add the first floor
                </button>
              </div>
            ) : (
              <>
                {floors!.map((floor) => {
                  const floorAreas = areasByFloor?.get(floor.id) ?? [];
                  return (
                    <div key={floor.id}>
                      {/* Floor band */}
                      <div
                        className="group/floor grid bg-primary"
                        style={{ gridTemplateColumns: gridTemplate }}
                      >
                        <div className="flex items-center gap-2 px-4 py-2">
                          <span className="text-sm font-bold uppercase tracking-wide text-white">
                            {floor.name}
                          </span>
                          <div className="ml-auto flex items-center gap-0.5 opacity-0 transition-opacity group-hover/floor:opacity-100 focus-within:opacity-100">
                            <button
                              type="button"
                              aria-label={`Add area to ${floor.name}`}
                              title="Add area"
                              onClick={() => onAddArea?.(floor)}
                              className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-white/90 transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                            >
                              <Plus size={12} aria-hidden="true" />
                              Area
                            </button>
                            <button
                              type="button"
                              aria-label={`Rename ${floor.name}`}
                              title="Rename floor"
                              onClick={() => onEditFloor?.(floor)}
                              className="flex h-6 w-6 items-center justify-center rounded-md text-white/90 transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                            >
                              <Pencil size={12} aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              aria-label={`Delete ${floor.name}`}
                              title="Delete floor"
                              onClick={() => onDeleteFloor?.(floor)}
                              className="flex h-6 w-6 items-center justify-center rounded-md text-white/90 transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                            >
                              <Trash2 size={12} aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                        {bandCells()}
                      </div>

                      {floorAreas.length === 0 ? (
                        <div
                          className="grid border-b border-grey-200 bg-grey-100/40"
                          style={{ gridTemplateColumns: gridTemplate }}
                        >
                          <div className="px-6 py-2 text-xs italic text-grey-500">
                            No areas — use “+ Area” above to add one.
                          </div>
                          {weekDates.map((dateStr) => (
                            <div key={dateStr} className="border-l border-grey-200/60" />
                          ))}
                        </div>
                      ) : (
                        floorAreas.map((area) => {
                          const rows = managedRowsByArea.get(area.id) ?? [];
                          return (
                            <div key={area.id}>
                              {/* Area band — name + actions + hover-add day cells */}
                              <div
                                className="group/area grid border-b border-grey-200 bg-primary/10"
                                style={{ gridTemplateColumns: gridTemplate }}
                              >
                                <div className="flex items-center gap-1.5 px-4 py-1.5">
                                  <span className="text-[13px] font-semibold text-primary">
                                    {area.name}
                                  </span>
                                  <div className="ml-auto flex items-center gap-0.5 opacity-0 transition-opacity group-hover/area:opacity-100 focus-within:opacity-100">
                                    <button
                                      type="button"
                                      aria-label={`Add assignment to ${area.name}`}
                                      title="Add assignment (Monday)"
                                      onClick={() =>
                                        mondayDate &&
                                        onAddAssignment?.({
                                          floorId: floor.id,
                                          areaId: area.id,
                                          date: mondayDate,
                                        })
                                      }
                                      className="flex items-center gap-1 rounded-md bg-primary px-1.5 py-0.5 text-[11px] font-medium text-white transition-colors hover:bg-primary-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                    >
                                      <Plus size={12} aria-hidden="true" />
                                      Assign
                                    </button>
                                    <button
                                      type="button"
                                      aria-label={`Rename ${area.name}`}
                                      title="Rename area"
                                      onClick={() => onEditArea?.(area)}
                                      className="flex h-6 w-6 items-center justify-center rounded-md text-primary transition-colors hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                    >
                                      <Pencil size={12} aria-hidden="true" />
                                    </button>
                                    <button
                                      type="button"
                                      aria-label={`Delete ${area.name}`}
                                      title="Delete area"
                                      onClick={() => onDeleteArea?.(area)}
                                      className="flex h-6 w-6 items-center justify-center rounded-md text-primary transition-colors hover:bg-error/10 hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                    >
                                      <Trash2 size={12} aria-hidden="true" />
                                    </button>
                                  </div>
                                </div>
                                {weekDates.map((dateStr) => {
                                  const working = isWorkingDate(dateStr);
                                  return (
                                    <div
                                      key={dateStr}
                                      className={cn(
                                        "flex items-center justify-center border-l border-grey-200/60",
                                        !working && "bg-grey-200/30",
                                      )}
                                    >
                                      <button
                                        type="button"
                                        aria-label={`Add assignment in ${area.name} on ${dateStr}`}
                                        title={`Add assignment on ${dateStr}`}
                                        onClick={() =>
                                          onAddAssignment?.({
                                            floorId: floor.id,
                                            areaId: area.id,
                                            date: dateStr,
                                          })
                                        }
                                        className="flex h-5 w-5 items-center justify-center rounded-md text-primary opacity-0 transition-all hover:bg-primary hover:text-white group-hover/area:opacity-70 hover:!opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                      >
                                        <Plus size={12} aria-hidden="true" />
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Task rows */}
                              {rows.map((row, i) => (
                                <TaskRowView key={row.taskId} row={row} striped={i % 2 === 1} />
                              ))}
                            </div>
                          );
                        })
                      )}
                    </div>
                  );
                })}
              </>
            )
          ) : /* ── Read-only mode (all sites) ─────────────────────────────── */
          isLoading ? (
            <p className="px-4 py-10 text-center text-sm text-grey-500">Loading schedule…</p>
          ) : readOnlyGroups.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-grey-500">
              No tasks are scheduled this week. Select a site above to add floors, areas and
              assignments.
            </p>
          ) : (
            readOnlyGroups.map((site) => (
              <div key={site.siteName}>
                {multiSite && (
                  <div className="grid bg-on-surface" style={{ gridTemplateColumns: gridTemplate }}>
                    <div className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white">
                      <Building2 size={14} aria-hidden="true" />
                      {site.siteName}
                    </div>
                    {bandCells()}
                  </div>
                )}
                {site.floors.map((floor) => (
                  <div key={floor.floorName}>
                    <div className="grid bg-primary" style={{ gridTemplateColumns: gridTemplate }}>
                      <div className="px-4 py-2 text-sm font-bold uppercase tracking-wide text-white">
                        {floor.floorName}
                      </div>
                      {bandCells()}
                    </div>
                    {floor.areas.map((area) => (
                      <div key={area.areaName}>
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
                        {area.rows.map((row, i) => (
                          <TaskRowView key={row.taskId} row={row} striped={i % 2 === 1} />
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
