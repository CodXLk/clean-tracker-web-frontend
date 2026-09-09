"use client";

import { useMemo, useState } from "react";
import { Building2, GripVertical, Plus, Pencil, Repeat, RotateCcw, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { InitialsAvatar } from "@/components/shared/InitialsAvatar";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import type { SiteTaskSummary, TaskOccurrence, WorkType, AssignmentTaskStatus, RecurrenceType } from "@/features/workforce/schemas/assignment.schema";
import { WORK_TYPE_LABELS } from "@/features/workforce/schemas/assignment.schema";
import type { DayOfWeek } from "@/features/user-management/schemas/site.schema";
import type { Floor } from "@/features/user-management/schemas/floor.schema";
import type { Area } from "@/features/user-management/schemas/area.schema";

// Default colour per work type (matches the calendar's mapping).
const TYPE_HEX: Record<string, string> = {
  GENERAL_TASK: "#0D9488",
  PERIODICAL_TASK: "#A855F7",
  WORK_ORDER: "#F97316",
  OTHER: "#3B82F6",
};

function formatDateShort(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatWeekdayLong(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", { weekday: "long" });
}

/** Work-order detail popover shown when a scope-band work-order cell is clicked. */
function WorkOrderPopover({
  occurrences,
  poIds,
  onClose,
  onTaskClick,
}: {
  occurrences: TaskOccurrence[];
  poIds: string[];
  onClose: () => void;
  onTaskClick: (occ: TaskOccurrence) => void;
}) {
  const siteName = occurrences[0]?.siteName;
  return (
    <>
      {/* Click-away backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-label="Work order details"
        className="absolute left-1/2 top-full z-50 mt-1 w-64 -translate-x-1/2 rounded-xl border border-grey-200 bg-white p-3 text-left shadow-xl"
      >
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#C2410C]">Work Order</p>
            {poIds.length > 0 && (
              <p className="truncate text-xs font-semibold text-on-surface" title={poIds.join(", ")}>
                PO {poIds.join(", ")}
              </p>
            )}
            {siteName && <p className="truncate text-[11px] text-grey-500">{siteName}</p>}
          </div>
          <span className="shrink-0 rounded-full bg-grey-100 px-2 py-0.5 text-[10px] font-semibold text-grey-600">
            {occurrences.length} task{occurrences.length === 1 ? "" : "s"}
          </span>
        </div>
        <ul className="flex max-h-56 flex-col gap-1 overflow-y-auto">
          {occurrences.map((occ) => (
            <li key={`${occ.taskId}:${occ.date}`}>
              <button
                type="button"
                onClick={() => onTaskClick(occ)}
                className="flex w-full flex-col gap-0.5 rounded-lg border border-grey-100 px-2 py-1.5 text-left transition-colors hover:bg-grey-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <span className="truncate text-xs font-medium text-on-surface" title={occ.name}>
                  {occ.name}
                </span>
                <span className="truncate text-[10px] text-grey-500">
                  {[occ.floorName, occ.areaName].filter(Boolean).join(" · ")}
                  {occ.startTime ? ` · ${occ.startTime.slice(0, 5)}` : ""}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

const DAY_SHORT: Record<DayOfWeek, string> = {
  MONDAY: "Mon",
  TUESDAY: "Tue",
  WEDNESDAY: "Wed",
  THURSDAY: "Thu",
  FRIDAY: "Fri",
  SATURDAY: "Sat",
  SUNDAY: "Sun",
};

/** Human recurrence text for the day-view pattern row, e.g. "Every Mon" or "Every 2 weeks · Mon". */
function recurrenceDescription(row: {
  recurrenceType?: RecurrenceType | null;
  recurrenceInterval?: number | null;
  recurrenceDays?: DayOfWeek[];
}): string | null {
  const type = row.recurrenceType;
  if (!type) return null;
  const n = row.recurrenceInterval && row.recurrenceInterval > 0 ? row.recurrenceInterval : 1;
  if (type === "WEEKLY") {
    const days = (row.recurrenceDays ?? []).map((d) => DAY_SHORT[d]).join(", ");
    if (n === 1) return days ? `Every ${days}` : "Weekly";
    return days ? `Every ${n} weeks · ${days}` : `Every ${n} weeks`;
  }
  if (type === "DAILY") return n === 1 ? "Daily" : `Every ${n} days`;
  return n === 1 ? "Monthly" : `Every ${n} months`;
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

function dayOfWeekOf(dateStr: string): DayOfWeek {
  return JS_DAY_TO_JAVA[new Date(dateStr + "T00:00:00").getDay()]!;
}

function occurrenceHex(occurrence: TaskOccurrence): string {
  return occurrence.colorHex ?? TYPE_HEX[occurrence.assignmentType] ?? "#0B585A";
}

function cleanerName(c: { firstName?: string | null; lastName?: string | null }): string {
  return [c.firstName, c.lastName].filter(Boolean).join(" ").trim() || "Cleaner";
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
  /** Source assignment (managed mode) — lets the task-row "+" load this task's details. */
  assignmentId?: string;
  hex: string;
  /** Admin-defined order of the task within its area. */
  orderIndex: number;
  /** Short per-task recurrence label (managed mode, when the task overrides the assignment rule). */
  recurrenceLabel?: string | null;
  /** Effective recurrence (task or assignment rule) — drives the day-view pattern. */
  recurrenceType?: RecurrenceType | null;
  recurrenceInterval?: number | null;
  recurrenceDays?: DayOfWeek[];
  /** date → occurrences of this task on that date. */
  byDate: Map<string, TaskOccurrence[]>;
  /** weekday → the nearest occurrence on that weekday (day view, across weeks). */
  byWeekday: Map<DayOfWeek, TaskOccurrence[]>;
  /** Next occurrence date after the visible week (managed all-tasks mode). */
  nextDate?: string | null;
  /** Lifecycle status (managed mode). */
  status?: AssignmentTaskStatus;
}

/** Nearest occurrence on each weekday (day view maps the recurrence pattern to Mon–Sun). */
function weekdayMapFromDates(byDate: Map<string, TaskOccurrence[]>): Map<DayOfWeek, TaskOccurrence[]> {
  const byWeekday = new Map<DayOfWeek, TaskOccurrence[]>();
  for (const d of [...byDate.keys()].sort()) {
    const wd = dayOfWeekOf(d);
    if (!byWeekday.has(wd)) byWeekday.set(wd, byDate.get(d)!);
  }
  return byWeekday;
}

function occurrenceToRow(row: TaskRow | undefined, occurrence: TaskOccurrence): TaskRow {
  const r =
    row ??
    {
      taskId: occurrence.taskId,
      name: occurrence.name,
      assignmentType: occurrence.assignmentType,
      hex: occurrenceHex(occurrence),
      orderIndex: occurrence.orderIndex,
      byDate: new Map<string, TaskOccurrence[]>(),
      byWeekday: new Map<DayOfWeek, TaskOccurrence[]>(),
    };
  const list = r.byDate.get(occurrence.date) ?? [];
  list.push(occurrence);
  r.byDate.set(occurrence.date, list);
  return r;
}

/** Group scope-view rows by task name so split/isolated occurrences of the same task
 *  (which carry different task ids) stay on one row instead of appearing as duplicates. */
function taskRowKey(o: TaskOccurrence): string {
  return o.name.trim().toLowerCase();
}

/** Occurrences grouped by areaId → task rows (managed mode). */
function rowsByArea(occurrences: TaskOccurrence[]): Map<string, TaskRow[]> {
  const byArea = new Map<string, Map<string, TaskRow>>();
  for (const occurrence of occurrences) {
    const tasks = byArea.get(occurrence.areaId) ?? new Map<string, TaskRow>();
    byArea.set(occurrence.areaId, tasks);
    const key = taskRowKey(occurrence);
    tasks.set(key, occurrenceToRow(tasks.get(key), occurrence));
  }
  const result = new Map<string, TaskRow[]>();
  for (const [areaId, tasks] of byArea) {
    const rows = [...tasks.values()];
    for (const r of rows) r.byWeekday = weekdayMapFromDates(r.byDate);
    result.set(areaId, rows.sort((a, b) => a.orderIndex - b.orderIndex || a.name.localeCompare(b.name)));
  }
  return result;
}

/**
 * Managed mode: build one row for EVERY task at the site (from siteTasks), filling the
 * week cells from occurrences and carrying each task's next date. Rows are grouped by area
 * and ordered by category (work order → periodical → general → other), then by name.
 */
function occCount(m?: Map<string, TaskOccurrence[]>): number {
  if (!m) return 0;
  let n = 0;
  for (const list of m.values()) n += list.length;
  return n;
}

function managedRows(siteTasks: SiteTaskSummary[], occurrences: TaskOccurrence[]): Map<string, TaskRow[]> {
  const occByTask = new Map<string, Map<string, TaskOccurrence[]>>();
  for (const o of occurrences) {
    const m = occByTask.get(o.taskId) ?? new Map<string, TaskOccurrence[]>();
    occByTask.set(o.taskId, m);
    const list = m.get(o.date) ?? [];
    list.push(o);
    m.set(o.date, list);
  }
  const byArea = new Map<string, TaskRow[]>();
  // Merge same-named tasks in an area onto one row, so an added occurrence (created as a new
  // one-off task with the same name) shows in that task's cell instead of a duplicate row.
  const rowByKey = new Map<string, TaskRow>();
  const primaryCount = new Map<string, number>();
  for (const t of siteTasks) {
    const areaId = t.areaId ?? "";
    const key = `${areaId}::${t.name.trim().toLowerCase()}`;
    const taskOcc = occByTask.get(t.taskId);
    const count = occCount(taskOcc);
    const existing = rowByKey.get(key);
    if (!existing) {
      const byDate = new Map<string, TaskOccurrence[]>();
      if (taskOcc) for (const [d, list] of taskOcc) byDate.set(d, [...list]);
      const row: TaskRow = {
        taskId: t.taskId,
        name: t.name,
        assignmentType: t.assignmentType,
        assignmentId: t.assignmentId,
        hex: TYPE_HEX[t.assignmentType] ?? "#0B585A",
        orderIndex: t.orderIndex,
        recurrenceLabel: t.recurrenceLabel ?? null,
        recurrenceType: t.recurrenceType ?? null,
        recurrenceInterval: t.recurrenceInterval ?? null,
        recurrenceDays: t.recurrenceDays ?? [],
        byDate,
        byWeekday: new Map<DayOfWeek, TaskOccurrence[]>(),
        nextDate: t.nextDate ?? null,
        status: t.status,
      };
      rowByKey.set(key, row);
      primaryCount.set(key, count);
      const rows = byArea.get(areaId) ?? [];
      byArea.set(areaId, rows);
      rows.push(row);
    } else {
      if (taskOcc) {
        for (const [d, list] of taskOcc) {
          existing.byDate.set(d, [...(existing.byDate.get(d) ?? []), ...list]);
        }
      }
      if (t.nextDate && (!existing.nextDate || t.nextDate < existing.nextDate)) {
        existing.nextDate = t.nextDate;
      }
      // The task with more occurrences in view is the "real" one; it drives the row's actions.
      if (count > (primaryCount.get(key) ?? 0)) {
        existing.taskId = t.taskId;
        existing.assignmentId = t.assignmentId;
        existing.assignmentType = t.assignmentType;
        existing.hex = TYPE_HEX[t.assignmentType] ?? existing.hex;
        existing.recurrenceLabel = t.recurrenceLabel ?? existing.recurrenceLabel ?? null;
        existing.status = t.status;
        primaryCount.set(key, count);
      }
      existing.orderIndex = Math.min(existing.orderIndex, t.orderIndex);
    }
  }
  for (const rows of byArea.values()) {
    for (const r of rows) r.byWeekday = weekdayMapFromDates(r.byDate);
    rows.sort((a, b) => a.orderIndex - b.orderIndex || a.name.localeCompare(b.name));
  }
  return byArea;
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
  // Admin-defined sort orders captured from the occurrences (floor within site, area within floor).
  const floorOrder = new Map<string, number>();
  const areaOrder = new Map<string, number>();
  for (const occurrence of occurrences) {
    const floors = sites.get(occurrence.siteName) ?? new Map();
    sites.set(occurrence.siteName, floors);
    const areas = floors.get(occurrence.floorName) ?? new Map();
    floors.set(occurrence.floorName, areas);
    const tasks = areas.get(occurrence.areaName) ?? new Map();
    areas.set(occurrence.areaName, tasks);
    const key = taskRowKey(occurrence);
    tasks.set(key, occurrenceToRow(tasks.get(key), occurrence));
    floorOrder.set(`${occurrence.siteName}\u0000${occurrence.floorName}`, occurrence.floorSortOrder);
    areaOrder.set(
      `${occurrence.siteName}\u0000${occurrence.floorName}\u0000${occurrence.areaName}`,
      occurrence.areaSortOrder,
    );
  }
  return [...sites.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([siteName, floors]) => ({
      siteName,
      floors: [...floors.entries()]
        .sort(
          ([a], [b]) =>
            (floorOrder.get(`${siteName}\u0000${a}`) ?? 0) - (floorOrder.get(`${siteName}\u0000${b}`) ?? 0) ||
            a.localeCompare(b),
        )
        .map(([floorName, areas]) => ({
          floorName,
          areas: [...areas.entries()]
            .sort(
              ([a], [b]) =>
                (areaOrder.get(`${siteName}\u0000${floorName}\u0000${a}`) ?? 0) -
                  (areaOrder.get(`${siteName}\u0000${floorName}\u0000${b}`) ?? 0) || a.localeCompare(b),
            )
            .map(([areaName, tasks]) => ({
              areaName,
              rows: [...tasks.values()].sort((a, b) => a.orderIndex - b.orderIndex || a.name.localeCompare(b.name)),
            })),
        })),
    }));
}

// ── Component ─────────────────────────────────────────────────────────────────

export interface AddAssignmentTarget {
  floorId: string;
  areaId: string;
  date: string;
  /** Day-view quick add: prefill the New Assignment with this task's name. */
  taskName?: string;
  /**
   * Scope-view constraint for the create modal:
   * - ONE_OFF: date-view cell → single date, no recurrence.
   * - DAY_WEEKLY: day-view cell → repeats weekly (or monthly) on that weekday.
   * - TASK_INHERIT: day-view task-row → load the task and keep its recurrence.
   * - undefined: area "Assign" button → full recurrence options (unchanged).
   */
  mode?: "ONE_OFF" | "DAY_WEEKLY" | "TASK_INHERIT";
  /** Task-row add: load this existing task's details into the create form. */
  sourceAssignmentId?: string;
  sourceTaskId?: string;
}

interface WeekScheduleGridProps {
  weekDates: string[];
  occurrences: TaskOccurrence[];
  today: string;
  /** Null = no single site selected → no working-day distinction. */
  workingDays: DayOfWeek[] | null;
  isLoading?: boolean;
  /** Weekday (Mon–Sun) recurrence view instead of the dated week grid. */
  dayView?: boolean;
  /** Public holidays keyed by date (date view) — tints and labels the column. */
  holidays?: Map<string, string>;
  onOccurrenceClick?: (occurrence: TaskOccurrence) => void;

  // ── Managed mode (a single site is selected) ────────────────────────────────
  siteId?: string;
  floors?: Floor[];
  /** All tasks at the site (managed mode) so rows include tasks with no occurrence this week. */
  siteTasks?: SiteTaskSummary[];
  /** floorId → its areas. */
  areasByFloor?: Map<string, Area[]>;
  /** Date used by the task-column "+" (Monday of the visible week). */
  mondayDate?: string;
  structureLoading?: boolean;
  /** When true, floors can be drag-reordered (super admin / company admin). */
  canReorderFloors?: boolean;
  onReorderFloors?: (orderedFloorIds: string[]) => void;
  /** When true, areas can be drag-reordered within their floor. */
  canReorderAreas?: boolean;
  onReorderAreas?: (floorId: string, orderedAreaIds: string[]) => void;
  /** When true, tasks can be drag-reordered within their area (super admin / company admin). */
  canReorderTasks?: boolean;
  onReorderTasks?: (areaId: string, orderedTaskIds: string[]) => void;
  onAddAssignment?: (target: AddAssignmentTarget) => void;
  /** Toggle a task active/inactive (managed mode). */
  onToggleTaskStatus?: (taskId: string, status: "ACTIVE" | "INACTIVE") => void;
  /** Restore a soft-deleted task back to active (managed mode). */
  onRestoreTask?: (taskId: string) => void;
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
  dayView = false,
  holidays,
  onOccurrenceClick,
  siteId,
  floors,
  siteTasks,
  areasByFloor,
  mondayDate,
  structureLoading = false,
  canReorderFloors = false,
  onReorderFloors,
  canReorderAreas = false,
  onReorderAreas,
  canReorderTasks = false,
  onReorderTasks,
  onAddAssignment,
  onToggleTaskStatus,
  onRestoreTask,
  onAddFloor,
  onEditFloor,
  onDeleteFloor,
  onAddArea,
  onEditArea,
  onDeleteArea,
}: WeekScheduleGridProps) {
  const managed = !!siteId && !!floors;

  const [draggingFloorId, setDraggingFloorId] = useState<string | null>(null);
  const [dragOverFloorId, setDragOverFloorId] = useState<string | null>(null);

  function handleFloorDrop(targetFloorId: string) {
    if (!draggingFloorId || draggingFloorId === targetFloorId || !onReorderFloors || !floors) {
      setDraggingFloorId(null);
      setDragOverFloorId(null);
      return;
    }
    const ids = floors.map((f) => f.id);
    const from = ids.indexOf(draggingFloorId);
    const to = ids.indexOf(targetFloorId);
    if (from >= 0 && to >= 0) {
      ids.splice(from, 1);
      ids.splice(to, 0, draggingFloorId);
      onReorderFloors(ids);
    }
    setDraggingFloorId(null);
    setDragOverFloorId(null);
  }

  // Area drag-reorder is scoped to a single floor: the dragged area's id plus its floor.
  const [draggingArea, setDraggingArea] = useState<{ floorId: string; areaId: string } | null>(null);
  const [dragOverAreaId, setDragOverAreaId] = useState<string | null>(null);

  function handleAreaDrop(floorId: string, targetAreaId: string) {
    const dragging = draggingArea;
    setDraggingArea(null);
    setDragOverAreaId(null);
    if (!dragging || dragging.floorId !== floorId || dragging.areaId === targetAreaId || !onReorderAreas) {
      return;
    }
    const ids = (areasByFloor?.get(floorId) ?? []).map((a) => a.id);
    const from = ids.indexOf(dragging.areaId);
    const to = ids.indexOf(targetAreaId);
    if (from >= 0 && to >= 0) {
      ids.splice(from, 1);
      ids.splice(to, 0, dragging.areaId);
      onReorderAreas(floorId, ids);
    }
  }

  // Task drag-reorder is scoped to a single area: the dragged task's id plus its area.
  const [draggingTask, setDraggingTask] = useState<{ areaId: string; taskId: string } | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);

  function handleTaskDrop(areaId: string, targetTaskId: string, orderedTaskIds: string[]) {
    const dragging = draggingTask;
    setDraggingTask(null);
    setDragOverTaskId(null);
    if (!dragging || dragging.areaId !== areaId || dragging.taskId === targetTaskId || !onReorderTasks) {
      return;
    }
    const ids = [...orderedTaskIds];
    const from = ids.indexOf(dragging.taskId);
    const to = ids.indexOf(targetTaskId);
    if (from >= 0 && to >= 0) {
      ids.splice(from, 1);
      ids.splice(to, 0, dragging.taskId);
      onReorderTasks(areaId, ids);
    }
  }

  const readOnlyGroups = useMemo(
    () => (managed ? [] : buildSiteGroups(occurrences)),
    [managed, occurrences],
  );
  const managedRowsByArea = useMemo(
    () => {
      if (!managed) return new Map<string, TaskRow[]>();
      if (siteTasks) return managedRows(siteTasks, occurrences);
      return rowsByArea(occurrences);
    },
    [managed, siteTasks, occurrences],
  );

  /** date → work-order occurrences on that date (for the summary band). */
  const workOrdersByDate = useMemo(() => {
    const map = new Map<string, TaskOccurrence[]>();
    for (const occurrence of occurrences) {
      if (occurrence.assignmentType !== "WORK_ORDER") continue;
      const list = map.get(occurrence.date) ?? [];
      list.push(occurrence);
      map.set(occurrence.date, list);
    }
    return map;
  }, [occurrences]);
  const hasWorkOrders = workOrdersByDate.size > 0;
  // Date whose work-order detail popover is open in the scope band.
  const [woPopupDate, setWoPopupDate] = useState<string | null>(null);

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
        className="grid border-b-2 border-grey-300 bg-surface"
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
          const holidayName = !dayView ? holidays?.get(dateStr) : undefined;
          return (
            <div
              key={dateStr}
              title={holidayName}
              className={cn(
                "flex flex-col items-center border-l border-grey-200 py-2.5",
                isToday && "bg-primary/5",
                holidayName ? "bg-rose-50" : !working && "bg-grey-100/70",
              )}
            >
              <span
                className={cn(
                  "text-[11px] font-bold uppercase tracking-wide",
                  isToday ? "text-ink" : working ? "text-grey-600" : "text-grey-400",
                )}
              >
                {day}
              </span>
              {!dayView && (
                <span
                  className={cn(
                    "mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold",
                    isToday ? "bg-primary text-white shadow-sm" : working ? "text-on-surface" : "text-grey-400",
                  )}
                >
                  {dt.getDate()}
                </span>
              )}
              {holidayName && (
                <span
                  className="mt-1 max-w-full truncate rounded-full bg-rose-100 px-1.5 py-0.5 text-[9px] font-semibold text-rose-600"
                  title={holidayName}
                >
                  {holidayName}
                </span>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  /** Work-order summary band — one coloured "Work Order" cell per date that has one. */
  function WorkOrderRow() {
    return (
      <div
        className="grid border-b border-grey-200 bg-[#F97316]/[0.06]"
        style={{ gridTemplateColumns: gridTemplate }}
      >
        <div className="flex items-center px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#C2410C]">
          Work Orders
        </div>
        {weekDates.map((dateStr) => {
          const wos = workOrdersByDate.get(dateStr) ?? [];
          const first = wos[0];
          const poIds = [...new Set(wos.map((w) => w.poId).filter(Boolean))];
          const label = poIds.length ? `Work Order — PO ${poIds.join(", ")}` : "Work Order";
          const isOpen = woPopupDate === dateStr;
          return (
            <div
              key={dateStr}
              className={cn(
                "relative flex items-center justify-center border-l border-grey-200 p-1",
                dateStr === today && "bg-primary/[0.04]",
              )}
            >
              {first && (
                <button
                  type="button"
                  title={label}
                  aria-label={label}
                  aria-expanded={isOpen}
                  onClick={() => setWoPopupDate(isOpen ? null : dateStr)}
                  className="relative w-full truncate rounded-md px-1.5 py-1 text-center text-[10px] font-bold uppercase leading-tight tracking-wide text-white shadow-sm transition-transform hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  style={{ backgroundColor: TYPE_HEX.WORK_ORDER }}
                >
                  Work Order
                </button>
              )}
              {/* Count sits outside the (truncating) button so it isn't clipped at the cell edge. */}
              {first && wos.length > 0 && (
                <span className="pointer-events-none absolute right-0.5 top-0.5 z-10 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-on-surface px-1 text-[9px] font-semibold text-white shadow">
                  {wos.length}
                </span>
              )}
              {first && isOpen && (
                <WorkOrderPopover
                  occurrences={wos}
                  poIds={poIds}
                  onClose={() => setWoPopupDate(null)}
                  onTaskClick={(occ) => {
                    setWoPopupDate(null);
                    onOccurrenceClick?.(occ);
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  /** One task row of check marks — shared by both modes. */
  function TaskRowView({
    row,
    striped,
    floorId,
    areaId,
  }: {
    row: TaskRow;
    striped: boolean;
    floorId?: string;
    areaId?: string;
  }) {
    const status = row.status ?? "ACTIVE";
    const isDeleted = status === "DELETED";
    const isInactive = status === "INACTIVE";
    // Non-active tasks are dimmed (and deleted ones struck through) so hidden work is obvious
    // when the "Inactive"/"All" filter is applied.
    const nameMuted = isDeleted || isInactive;

    const statusToggle =
      floorId && areaId && !isDeleted && onToggleTaskStatus ? (
        <button
          type="button"
          role="switch"
          aria-checked={status === "ACTIVE"}
          aria-label={status === "ACTIVE" ? `Deactivate ${row.name}` : `Activate ${row.name}`}
          title={status === "ACTIVE" ? "Active — click to make inactive" : "Inactive — click to activate"}
          onClick={(e) => {
            e.stopPropagation();
            onToggleTaskStatus(row.taskId, status === "ACTIVE" ? "INACTIVE" : "ACTIVE");
          }}
          className={cn(
            "relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            status === "ACTIVE" ? "bg-success" : "bg-grey-300",
          )}
        >
          <span
            className={cn(
              "inline-block h-3 w-3 rounded-full bg-white shadow transition-transform",
              status === "ACTIVE" ? "translate-x-3.5" : "translate-x-0.5",
            )}
          />
        </button>
      ) : null;

    const statusPill =
      isInactive || isDeleted ? (
        <span
          className={cn(
            "inline-flex shrink-0 items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
            isDeleted ? "bg-error/10 text-error" : "bg-grey-200 text-grey-600",
          )}
        >
          {isDeleted ? "Deleted" : "Inactive"}
        </span>
      ) : null;

    const restoreControl =
      floorId && areaId && isDeleted && onRestoreTask ? (
        <button
          type="button"
          title={`Restore ${row.name}`}
          onClick={(e) => {
            e.stopPropagation();
            onRestoreTask(row.taskId);
          }}
          className="inline-flex shrink-0 items-center gap-1 rounded-full border border-primary/40 px-2 py-0.5 text-[10px] font-semibold text-primary transition-colors hover:bg-primary/10"
        >
          <RotateCcw size={10} aria-hidden="true" />
          Restore
        </button>
      ) : null;

    const statusControl = (
      <>
        {statusToggle}
        {statusPill}
        {restoreControl}
      </>
    );

    // A task with no occurrence in the visible window: highlight the whole row and show its
    // next available date + work type instead of the day cells.
    if (managed && (dayView ? row.byWeekday.size === 0 : row.byDate.size === 0)) {
      const recurDesc = recurrenceDescription(row);
      const label = row.nextDate
        ? `${recurDesc ? `${recurDesc} · ` : ""}Next available · ${formatDateShort(row.nextDate)}`
        : recurDesc
          ? `${recurDesc} · No upcoming date`
          : "No upcoming date";
      return (
        <div
          className="grid border-b border-grey-200"
          style={{ gridTemplateColumns: gridTemplate, backgroundColor: `${row.hex}12` }}
        >
          <div className="flex min-w-0 items-center gap-2.5 px-4 py-2.5 pl-6">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: row.hex }}
              aria-hidden="true"
            />
            <span
              className={cn(
                "truncate text-sm",
                nameMuted ? "text-grey-500" : "text-on-surface",
                isDeleted && "line-through",
              )}
              title={row.name}
            >
              {row.name}
            </span>
            {statusControl}
            {row.recurrenceLabel && (
              <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-ink">
                <Repeat size={9} aria-hidden="true" />
                {row.recurrenceLabel}
              </span>
            )}
          </div>
          <div className="col-span-7 flex items-center gap-2 border-l border-grey-200 px-4 py-2.5">
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white"
              style={{ backgroundColor: row.hex }}
            >
              {WORK_TYPE_LABELS[row.assignmentType]}
            </span>
            <span
              className={cn(
                "text-xs font-medium",
                row.nextDate ? "text-on-surface" : "text-grey-500",
              )}
            >
              {label}
            </span>
          </div>
        </div>
      );
    }
    return (
      <div
        className={cn(
          "group/trow grid border-b border-grey-200 transition-colors hover:bg-primary/[0.04]",
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
          <span
            className={cn(
              "truncate text-sm",
              nameMuted ? "text-grey-500" : "text-on-surface",
              isDeleted && "line-through",
            )}
            title={row.name}
          >
            {row.name}
          </span>
          {statusControl}
          {row.recurrenceLabel && (
            <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-ink">
              <Repeat size={9} aria-hidden="true" />
              {row.recurrenceLabel}
            </span>
          )}
        </div>
        {weekDates.map((dateStr) => {
          const cellOccurrences = dayView
            ? row.byWeekday.get(dayOfWeekOf(dateStr)) ?? []
            : row.byDate.get(dateStr) ?? [];
          const first = cellOccurrences[0];
          const working = isWorkingDate(dateStr);
          const recurDesc = recurrenceDescription(row);
          const times = cellOccurrences.map((o) => formatTimeShort(o.startTime.slice(0, 5))).join(", ");
          const label = first
            ? dayView
              ? `${row.name}${recurDesc ? ` · ${recurDesc}` : ""}${times ? ` — ${times}` : ""}`
              : `${row.name}${recurDesc ? ` · ${recurDesc}` : ""}${row.nextDate ? ` · Next available ${formatDateShort(row.nextDate)}` : ""}${times ? ` — ${times}` : ""}`
            : undefined;
          // Unique, named cleaners assigned across this cell's occurrences
          // (skip unnamed/placeholder entries so empty slots show no badge).
          const cleaners = first
            ? Array.from(
                new Map(cellOccurrences.flatMap((o) => o.cleaners).map((c) => [c.id, c])).values(),
              ).filter((c) => (c.firstName?.trim() || c.lastName?.trim()))
            : [];
          // Cleaners assigned via an outsource project — styled distinctly.
          const outsourceIds = new Set(cellOccurrences.flatMap((o) => o.outsourceCleanerIds ?? []));
          const hasOutsource = cleaners.some((c) => outsourceIds.has(c.id));
          return (
            <div
              key={dateStr}
              className={cn(
                "relative border-l border-grey-200",
                dayView ? "min-h-[46px]" : "min-h-[38px]",
                dateStr === today && "bg-primary/[0.04]",
                !working && "bg-grey-100/60",
              )}
            >
              {first ? (
                <button
                  type="button"
                  title={hasOutsource ? `${label} · Outsourced` : label}
                  aria-label={hasOutsource ? `${label} (outsourced)` : label}
                  onClick={() => onOccurrenceClick?.(first)}
                  className={cn(
                    "absolute inset-1 flex flex-col items-center justify-center gap-0.5 rounded-md px-1 text-center text-white shadow-sm transition-transform hover:scale-[1.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
                    hasOutsource && "ring-2 ring-[#ED5F25] ring-offset-1",
                  )}
                  style={{ backgroundColor: occurrenceHex(first) }}
                >
                  {cleaners.length > 0 ? (
                    <span className="flex items-center">
                      {cleaners.slice(0, 3).map((c) => (
                        <InitialsAvatar
                          key={c.id}
                          name={cleanerName(c)}
                          size={18}
                          className={cn(
                            "-ml-1.5 ring-2 first:ml-0",
                            outsourceIds.has(c.id) ? "ring-[#ED5F25]" : "ring-white",
                          )}
                        />
                      ))}
                      {cleaners.length > 3 && (
                        <span className="-ml-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-black/40 px-1 text-[9px] font-bold leading-none ring-2 ring-white">
                          +{cleaners.length - 3}
                        </span>
                      )}
                    </span>
                  ) : (
                    cellOccurrences.length > 1 && (
                      <span className="text-[11px] font-bold leading-none">×{cellOccurrences.length}</span>
                    )
                  )}
                </button>
              ) : (
                floorId && areaId && onAddAssignment && (
                  <button
                    type="button"
                    aria-label={dayView ? `Add ${row.name} on ${formatWeekdayLong(dateStr)}` : `Add ${row.name} on this date`}
                    title={dayView ? `Add this task on ${formatWeekdayLong(dateStr)}` : "Add this task to this date"}
                    onClick={() =>
                      onAddAssignment({
                        floorId,
                        areaId,
                        date: dateStr,
                        taskName: row.name,
                        mode: dayView ? "TASK_INHERIT" : "ONE_OFF",
                        sourceAssignmentId: row.assignmentId,
                        sourceTaskId: row.taskId,
                      })
                    }
                    className="absolute inset-1 flex items-center justify-center rounded-md text-grey-400 opacity-0 transition-colors hover:bg-primary/10 hover:text-primary group-hover/trow:opacity-70 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <Plus size={14} aria-hidden="true" />
                  </button>
                )
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
            className="flex items-center gap-1.5 rounded-lg border border-primary px-2.5 py-1 text-xs font-medium text-ink transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
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
        <div className="min-w-[900px]">
          <div className="sticky top-0 z-10 flex bg-surface">
            {managed && <div className="w-11 shrink-0 border-b-2 border-grey-300" aria-hidden="true" />}
            <div className="min-w-0 flex-1">
              <DayHeaderRow />
            </div>
          </div>
          {/* Work orders land on specific dates only — hidden in the weekday (day) view. */}
          {hasWorkOrders && !dayView && (
            <div className="flex">
              {managed && <div className="w-11 shrink-0 bg-[#F97316]/[0.06]" aria-hidden="true" />}
              <div className="min-w-0 flex-1">
                <WorkOrderRow />
              </div>
            </div>
          )}

          {/* ── Managed mode ─────────────────────────────────────────────── */}
          {managed ? (
            structureLoading || isLoading ? (
              <div className="flex items-center justify-center gap-2 px-4 py-16 text-sm text-grey-500">
                <LoadingSpinner />
                Loading schedule…
              </div>
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
                  const isDragTarget =
                    canReorderFloors &&
                    dragOverFloorId === floor.id &&
                    draggingFloorId != null &&
                    draggingFloorId !== floor.id;
                  return (
                    <div
                      key={floor.id}
                      onDragOver={
                        canReorderFloors
                          ? (e) => {
                              e.preventDefault();
                              if (dragOverFloorId !== floor.id) setDragOverFloorId(floor.id);
                            }
                          : undefined
                      }
                      onDrop={canReorderFloors ? () => handleFloorDrop(floor.id) : undefined}
                      className={cn(
                        "group/floor flex min-h-[6rem] border-b-2 border-grey-300",
                        isDragTarget && "ring-2 ring-inset ring-primary/60",
                        draggingFloorId === floor.id && "opacity-60",
                      )}
                    >
                      {/* Vertical floor label + actions (left rail) */}
                      <div
                        className="flex w-11 shrink-0 flex-col items-center gap-1 border-r border-grey-200 bg-surface-muted py-2"
                        draggable={canReorderFloors}
                        onDragStart={canReorderFloors ? () => setDraggingFloorId(floor.id) : undefined}
                        onDragEnd={
                          canReorderFloors
                            ? () => {
                                setDraggingFloorId(null);
                                setDragOverFloorId(null);
                              }
                            : undefined
                        }
                      >
                        <div className="flex flex-col items-center gap-0.5 opacity-0 transition-opacity group-hover/floor:opacity-100 focus-within:opacity-100">
                          <button
                            type="button"
                            aria-label={`Add area to ${floor.name}`}
                            title="Add area"
                            onClick={() => onAddArea?.(floor)}
                            className="flex h-5 w-5 items-center justify-center rounded-md text-ink transition-colors hover:bg-primary hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                          >
                            <Plus size={12} aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            aria-label={`Rename ${floor.name}`}
                            title="Rename floor"
                            onClick={() => onEditFloor?.(floor)}
                            className="flex h-5 w-5 items-center justify-center rounded-md text-ink transition-colors hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                          >
                            <Pencil size={11} aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            aria-label={`Delete ${floor.name}`}
                            title="Delete floor"
                            onClick={() => onDeleteFloor?.(floor)}
                            className="flex h-5 w-5 items-center justify-center rounded-md text-ink transition-colors hover:bg-error/10 hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                          >
                            <Trash2 size={11} aria-hidden="true" />
                          </button>
                        </div>
                        <div className="flex min-h-0 flex-1 items-center overflow-hidden">
                          <span
                            className="whitespace-nowrap rotate-180 text-xs font-bold uppercase leading-none tracking-wide text-ink [writing-mode:vertical-rl]"
                            title={floor.name}
                          >
                            {floor.name}
                          </span>
                        </div>
                        {canReorderFloors && (
                          <GripVertical
                            size={14}
                            className="cursor-grab text-grey-400"
                            aria-label="Drag to reorder floor"
                          />
                        )}
                      </div>

                      {/* Floor content */}
                      <div className="min-w-0 flex-1">
                      {floorAreas.length === 0 ? (
                        <div
                          className="grid border-b border-grey-200 bg-grey-100/40"
                          style={{ gridTemplateColumns: gridTemplate }}
                        >
                          <div className="px-4 py-2 text-xs italic text-grey-500">
                            No areas — use the + on the floor rail to add one.
                          </div>
                          {weekDates.map((dateStr) => (
                            <div key={dateStr} className="border-l border-grey-200/60" />
                          ))}
                        </div>
                      ) : (
                        floorAreas.map((area) => {
                          const rows = managedRowsByArea.get(area.id) ?? [];
                          const isAreaDragTarget =
                            canReorderAreas &&
                            dragOverAreaId === area.id &&
                            draggingArea != null &&
                            draggingArea.areaId !== area.id &&
                            draggingArea.floorId === floor.id;
                          return (
                            <div
                              key={area.id}
                              onDragOver={
                                canReorderAreas && draggingArea?.floorId === floor.id
                                  ? (e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      if (dragOverAreaId !== area.id) setDragOverAreaId(area.id);
                                    }
                                  : undefined
                              }
                              onDrop={
                                canReorderAreas && draggingArea?.floorId === floor.id
                                  ? (e) => {
                                      e.stopPropagation();
                                      handleAreaDrop(floor.id, area.id);
                                    }
                                  : undefined
                              }
                              className={cn(
                                isAreaDragTarget && "ring-2 ring-inset ring-primary/60",
                                draggingArea?.areaId === area.id && "opacity-60",
                              )}
                            >
                              {/* Area band — name + actions + hover-add day cells */}
                              <div
                                className="group/area grid border-y border-grey-200 bg-surface-muted"
                                draggable={canReorderAreas}
                                onDragStart={
                                  canReorderAreas
                                    ? (e) => {
                                        e.stopPropagation();
                                        setDraggingArea({ floorId: floor.id, areaId: area.id });
                                      }
                                    : undefined
                                }
                                onDragEnd={
                                  canReorderAreas
                                    ? () => {
                                        setDraggingArea(null);
                                        setDragOverAreaId(null);
                                      }
                                    : undefined
                                }
                                style={{ gridTemplateColumns: gridTemplate }}
                              >
                                <div className="flex items-center gap-1.5 px-4 py-1.5">
                                  {canReorderAreas && (
                                    <GripVertical
                                      size={12}
                                      className="cursor-grab text-ink/60"
                                      aria-label="Drag to reorder area"
                                    />
                                  )}
                                  <span className="text-[13px] font-semibold text-ink">
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
                                      className="flex h-6 w-6 items-center justify-center rounded-md text-ink transition-colors hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                    >
                                      <Pencil size={12} aria-hidden="true" />
                                    </button>
                                    <button
                                      type="button"
                                      aria-label={`Delete ${area.name}`}
                                      title="Delete area"
                                      onClick={() => onDeleteArea?.(area)}
                                      className="flex h-6 w-6 items-center justify-center rounded-md text-ink transition-colors hover:bg-error/10 hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
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
                                        aria-label={dayView ? `Add assignment in ${area.name} on ${formatWeekdayLong(dateStr)}` : `Add assignment in ${area.name} on ${dateStr}`}
                                        title={dayView ? `Add assignment on ${formatWeekdayLong(dateStr)}` : `Add assignment on ${dateStr}`}
                                        onClick={() =>
                                          onAddAssignment?.({
                                            floorId: floor.id,
                                            areaId: area.id,
                                            date: dateStr,
                                            mode: dayView ? "DAY_WEEKLY" : "ONE_OFF",
                                          })
                                        }
                                        className="flex h-5 w-5 items-center justify-center rounded-md text-ink opacity-0 transition-all hover:bg-primary hover:text-white group-hover/area:opacity-70 hover:!opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                      >
                                        <Plus size={12} aria-hidden="true" />
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Task rows */}
                              {(() => {
                                const orderedTaskIds = rows.map((r) => r.taskId);
                                return rows.map((row, i) => {
                                  const isTaskDragTarget =
                                    canReorderTasks &&
                                    dragOverTaskId === row.taskId &&
                                    draggingTask != null &&
                                    draggingTask.areaId === area.id &&
                                    draggingTask.taskId !== row.taskId;
                                  return (
                                    <div
                                      key={row.taskId}
                                      draggable={canReorderTasks}
                                      onDragStart={
                                        canReorderTasks
                                          ? (e) => {
                                              e.stopPropagation();
                                              setDraggingTask({ areaId: area.id, taskId: row.taskId });
                                            }
                                          : undefined
                                      }
                                      onDragEnd={
                                        canReorderTasks
                                          ? () => {
                                              setDraggingTask(null);
                                              setDragOverTaskId(null);
                                            }
                                          : undefined
                                      }
                                      onDragOver={
                                        canReorderTasks && draggingTask?.areaId === area.id
                                          ? (e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              if (dragOverTaskId !== row.taskId) setDragOverTaskId(row.taskId);
                                            }
                                          : undefined
                                      }
                                      onDrop={
                                        canReorderTasks && draggingTask?.areaId === area.id
                                          ? (e) => {
                                              e.stopPropagation();
                                              handleTaskDrop(area.id, row.taskId, orderedTaskIds);
                                            }
                                          : undefined
                                      }
                                      className={cn(
                                        canReorderTasks && "cursor-grab",
                                        isTaskDragTarget && "ring-2 ring-inset ring-primary/60",
                                        draggingTask?.taskId === row.taskId && "opacity-60",
                                      )}
                                    >
                                      <TaskRowView row={row} striped={i % 2 === 1} floorId={floor.id} areaId={area.id} />
                                    </div>
                                  );
                                });
                              })()}
                            </div>
                          );
                        })
                      )}
                      </div>
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
                          <div className="px-4 py-1.5 text-[13px] font-semibold text-ink">
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
