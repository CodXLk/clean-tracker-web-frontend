"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, X, Pencil, Trash2, Clock, Calendar, Repeat, Users, UserCog, Package, MoonStar } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  useOccurrences,
  useSiteTasks,
  useEditOccurrence,
  useDeleteOccurrence,
  useReorderTasks,
  useSetTaskStatus,
  useRestoreTask,
  useSiteTaskStatusCounts,
  type OccurrenceQuery,
  type EditOccurrenceInput,
} from "@/features/workforce/hooks/useAssignments";
import { useSites } from "@/features/user-management/hooks/useSites";
import { useMe } from "@/features/auth/hooks/useMe";
import {
  useFloors,
  useCreateFloor,
  useUpdateFloor,
  useDeleteFloor,
  useReorderFloors,
} from "@/features/user-management/hooks/useFloors";
import { useAreas, useCreateArea, useUpdateArea, useDeleteArea, useReorderAreas } from "@/features/user-management/hooks/useAreas";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import { WeekScheduleGrid, type AddAssignmentTarget } from "@/components/admin/WeekScheduleGrid";
import { NameFormModal } from "@/components/admin/NameFormModal";
import { EditOccurrenceModal } from "@/components/admin/EditOccurrenceModal";
import { TaskInfoModal } from "@/components/admin/TaskInfoModal";
import { NewAssignmentModal } from "@/components/admin/NewAssignmentModal";
import { TypeDetailsModal } from "@/components/admin/TypeDetailsModal";
import { usePublicHolidays } from "@/features/workforce/hooks/usePublicHolidays";
import { SiteFilterSelect } from "@/components/admin/SiteFilterSelect";
import { ConfirmDialog } from "@/features/user-management/components/ConfirmDialog";
import type { TaskOccurrence, OccurrenceScope } from "@/features/workforce/schemas/assignment.schema";
import { WORK_TYPE_LABELS, assignmentToFormInput, type WorkType, type Assignment } from "@/features/workforce/schemas/assignment.schema";
import { DAY_OF_WEEK_VALUES, type DayOfWeek } from "@/features/user-management/schemas/site.schema";
import type { Floor } from "@/features/user-management/schemas/floor.schema";
import type { Area } from "@/features/user-management/schemas/area.schema";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CalendarEvent {
  /** Composite identity — occurrences are computed, not stored. */
  id: string;
  taskId: string;
  /** Original series date (used for edit/delete API calls). */
  occurrenceDate: string;
  recurring: boolean;
  title: string;
  subtitle: string;
  description: string;
  startTime: string;
  endTime: string;
  date: string;
  color: string;
  textColor: string;
  /** Grouping metadata — used to collapse an assignment's tasks into one block. */
  assignmentId: string;
  assignmentType: string;
  siteName: string;
  templateName: string | null;
  /** True when this block represents multiple tasks of one assignment (read-only). */
  grouped?: boolean;
  /** Underlying per-task events when grouped (length > 1). */
  members?: CalendarEvent[];
  /** Assigned cleaner slots (profiles) and who fills them. */
  cleanerProfiles?: { label: string; name?: string | null }[];
  /** Supervisor slots (profiles) responsible for review. */
  supervisorProfiles?: { label: string; name?: string | null }[];
  /** Expected inventory items consumed on completion. */
  items?: { name: string; quantity: number; unit?: string | null }[];
  /** The underlying occurrence (present for single-task events; drives the full edit modal). */
  raw?: TaskOccurrence;
}

/** Prefill for the New Assignment modal, opened from a calendar slot or a scope cell. */
export interface AssignmentPrefill {
  date?: Date;
  time?: string;
  siteId?: string;
  floorId?: string;
  areaId?: string;
  /** Day-view quick add — seed the first task's name. */
  taskName?: string;
  /** Scope-view create constraint: one-off (date cell), weekly-on-day, or inherit from a task. */
  mode?: "ONE_OFF" | "DAY_WEEKLY" | "TASK_INHERIT";
  /** For DAY_WEEKLY: the weekday the new task should repeat on. */
  weekday?: DayOfWeek;
  /** Task-row add: load this existing task's details into the create form. */
  sourceTask?: { assignmentId: string; taskId: string };
}

interface WorkforceCalendarProps {
  onNewAssignment?: (prefill: AssignmentPrefill) => void;
  /** Controlled site selection — the Operations tab lifts this to the page header. */
  siteId?: string;
  onSiteChange?: (id: string) => void;
}

interface QuickAddState {
  show: boolean;
  date: string;
  time: string;
  x: number;
  y: number;
}

// ── Time helpers ──────────────────────────────────────────────────────────────

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function minutesToTime(mins: number): string {
  const clamped = Math.max(0, Math.min(mins, 23 * 60 + 59));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function addMinutes(time: string, mins: number): string {
  return minutesToTime(timeToMinutes(time) + mins);
}

function timeDiff(start: string, end: string): number {
  return timeToMinutes(end) - timeToMinutes(start);
}

// Shared toolbar control styling — one consistent height (36px) + font across the row.
const TOOLBAR_CONTROL =
  "h-9 rounded-xl border border-grey-200 bg-surface px-3 text-xs font-medium text-on-surface outline-none transition-colors hover:bg-grey-100 focus-visible:ring-2 focus-visible:ring-primary";
const SEGMENT_BTN =
  "flex h-9 items-center px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDisplayDate(dateStr: string): { day: string; date: number } {
  const dt = new Date(dateStr + "T00:00:00");
  const day = dt.toLocaleDateString("en-US", { weekday: "short" });
  return { day, date: dt.getDate() };
}

function getDayDates(weekStart: Date): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return formatDate(d);
  });
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  // Shift back to Monday (getDay: 0=Sun..6=Sat).
  const diff = (day + 6) % 7;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getMonthWeeks(year: number, month: number): string[][] {
  const firstDay = new Date(year, month, 1);
  const start = getWeekStart(firstDay);
  const weeks: string[][] = [];
  for (let w = 0; w < 6; w++) {
    const week: string[] = [];
    for (let d = 0; d < 7; d++) {
      const cur = new Date(start);
      cur.setDate(start.getDate() + w * 7 + d);
      week.push(formatDate(cur));
    }
    weeks.push(week);
    if (weeks[w]![6]) {
      const lastDate = new Date(weeks[w]![6]! + "T00:00:00");
      if (lastDate.getMonth() > month || lastDate.getFullYear() > year) break;
    }
  }
  return weeks;
}

function formatTimeDisplay(time: string): string {
  const [hStr, mStr] = time.split(":");
  const h = parseInt(hStr ?? "0", 10);
  const m = mStr ?? "00";
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m} ${ampm}`;
}

function formatDateLong(dateStr: string): string {
  const dt = new Date(dateStr + "T00:00:00");
  return dt.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

/** "Jul 13 – 19, 2026" (or "Jun 29 – Jul 5, 2026" across a month boundary). */
function formatWeekRangeLabel(startStr: string, endStr: string): string {
  const start = new Date(startStr + "T00:00:00");
  const end = new Date(endStr + "T00:00:00");
  const startMonth = start.toLocaleDateString("en-US", { month: "short" });
  const endMonth = end.toLocaleDateString("en-US", { month: "short" });
  if (startMonth === endMonth) {
    return `${startMonth} ${start.getDate()} – ${end.getDate()}, ${end.getFullYear()}`;
  }
  return `${startMonth} ${start.getDate()} – ${endMonth} ${end.getDate()}, ${end.getFullYear()}`;
}

/** Java DayOfWeek name for a yyyy-MM-dd string. */
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

// ── Constants ─────────────────────────────────────────────────────────────────

const SLOT_HEIGHT = 60;
const START_HOUR = 6;
const END_HOUR = 21;
// Vertical offset per stacked rectangle so lower work-type layers peek out at the top.
const STACK_OFFSET = 9;
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => i + START_HOUR);
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const EVENT_COLORS: Array<{ color: string; textColor: string; hex: string; label: string }> = [
  { color: "bg-[#0B585A]",  textColor: "text-white", hex: "#0B585A", label: "Teal"   },
  { color: "bg-pink-500",   textColor: "text-white", hex: "#EC4899", label: "Pink"   },
  { color: "bg-purple-500", textColor: "text-white", hex: "#A855F7", label: "Purple" },
  { color: "bg-blue-500",   textColor: "text-white", hex: "#3B82F6", label: "Blue"   },
  { color: "bg-orange-500", textColor: "text-white", hex: "#F97316", label: "Orange" },
  { color: "bg-green-500",  textColor: "text-white", hex: "#22C55E", label: "Green"  },
  { color: "bg-red-500",    textColor: "text-white", hex: "#EF4444", label: "Red"    },
];

// Default calendar colour per work type (falls back when no colorHex is stored).
const ASSIGNMENT_TYPE_COLOR: Record<string, string> = {
  GENERAL_TASK: "#0D9488",
  PERIODICAL_TASK: "#A855F7",
  WORK_ORDER: "#F97316",
  OTHER: "#3B82F6",
};

// Stacking order of work-type rectangles in a day cell.
const WORK_TYPE_ORDER: string[] = ["WORK_ORDER", "GENERAL_TASK", "PERIODICAL_TASK", "OTHER"];

interface DayTypeGroup {
  type: string;
  hex: string;
  events: CalendarEvent[];
}

/** Group a day's per-task events by work type, in a stable stacking order. */
function groupDayByType(dayEvents: CalendarEvent[]): DayTypeGroup[] {
  const byType = new Map<string, CalendarEvent[]>();
  for (const e of dayEvents) {
    const list = byType.get(e.assignmentType);
    if (list) list.push(e);
    else byType.set(e.assignmentType, [e]);
  }
  return WORK_TYPE_ORDER.filter((t) => byType.has(t)).map((t) => ({
    type: t,
    hex: ASSIGNMENT_TYPE_COLOR[t] ?? "#0B585A",
    events: byType.get(t)!,
  }));
}

function normalizeTime(time: string): string {
  return time.length >= 5 ? time.slice(0, 5) : time;
}

/** Resolve a Tailwind colour class pair for an occurrence's stored hex / type default. */
function resolveEventColor(hex: string | null | undefined, assignmentType: string): {
  color: string;
  textColor: string;
} {
  const target = (hex ?? ASSIGNMENT_TYPE_COLOR[assignmentType] ?? "#0B585A").toUpperCase();
  const match = EVENT_COLORS.find((c) => c.hex.toUpperCase() === target);
  if (match) return { color: match.color, textColor: match.textColor };
  // Unknown hex — render via an arbitrary Tailwind value so any colour still shows.
  return { color: `bg-[${target}]`, textColor: "text-white" };
}

function mapOccurrenceToEvent(occurrence: TaskOccurrence): CalendarEvent {
  const { color, textColor } = resolveEventColor(occurrence.colorHex, occurrence.assignmentType);
  return {
    id: `${occurrence.taskId}_${occurrence.occurrenceDate}`,
    taskId: occurrence.taskId,
    occurrenceDate: occurrence.occurrenceDate,
    recurring: occurrence.recurring,
    title: occurrence.name,
    subtitle: [occurrence.siteName, occurrence.areaName].filter(Boolean).join(" · "),
    description: occurrence.description ?? "",
    startTime: normalizeTime(occurrence.startTime),
    endTime: normalizeTime(occurrence.endTime),
    date: occurrence.date,
    color,
    textColor,
    assignmentId: occurrence.assignmentId,
    assignmentType: occurrence.assignmentType,
    siteName: occurrence.siteName,
    templateName: occurrence.templateName ?? null,
    cleanerProfiles: occurrence.cleanerProfiles,
    supervisorProfiles: occurrence.supervisorProfiles,
    items: occurrence.items,
    raw: occurrence,
  };
}

/**
 * Collapse a day's per-task events into one block per assignment. The block is
 * labelled by the assignment's saved template name, else its task-type. Blocks
 * with a single task stay fully editable; multi-task blocks are read-only.
 */
function groupDayEvents(dayEvents: CalendarEvent[]): CalendarEvent[] {
  const byAssignment = new Map<string, CalendarEvent[]>();
  for (const ev of dayEvents) {
    const list = byAssignment.get(ev.assignmentId);
    if (list) list.push(ev);
    else byAssignment.set(ev.assignmentId, [ev]);
  }
  const groups: CalendarEvent[] = [];
  for (const [assignmentId, members] of byAssignment) {
    members.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
    const first = members[0];
    const label = first.templateName?.trim() || WORK_TYPE_LABELS[first.assignmentType as WorkType] || first.title;
    if (members.length === 1) {
      // Relabel by type/template for display, but keep the real task for editing.
      groups.push({ ...first, title: label, members: [first] });
      continue;
    }
    const endTime = members.reduce(
      (max, m) => (timeToMinutes(m.endTime) > timeToMinutes(max) ? m.endTime : max),
      members[0].endTime,
    );
    groups.push({
      ...first,
      id: `grp_${assignmentId}_${first.date}`,
      title: label,
      subtitle: [first.siteName, `${members.length} tasks`].filter(Boolean).join(" · "),
      startTime: members[0].startTime,
      endTime,
      grouped: true,
      members,
    });
  }
  return groups;
}

// ── Occurrence scope dialog (This / This and following / All) ─────────────────

interface ScopeDialogState {
  kind: "edit" | "delete";
  event: CalendarEvent;
  message: string;
  /** Edit payload (without scope); unused for deletes. */
  payload: Omit<EditOccurrenceInput, "scope">;
  /** Snapshot to restore on cancel (drag/resize applied optimistically). */
  previous: CalendarEvent | null;
}

interface OccurrenceScopeDialogProps {
  state: ScopeDialogState;
  isPending: boolean;
  onSelect: (scope: OccurrenceScope) => void;
  onCancel: () => void;
}

function OccurrenceScopeDialog({ state, isPending, onSelect, onCancel }: OccurrenceScopeDialogProps) {
  const isDelete = state.kind === "delete";

  // One-time events need no scope choice — just a confirm.
  if (!state.event.recurring) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="scope-dialog-title"
      >
        <div className="absolute inset-0 bg-black/40" onClick={onCancel} aria-hidden="true" />
        <div className="relative z-10 w-full max-w-sm rounded-2xl bg-surface p-5 shadow-2xl ring-1 ring-grey-200">
          <h2 id="scope-dialog-title" className="text-base font-semibold text-on-surface">
            {isDelete ? "Delete assignment" : "Update assignment"}
          </h2>
          <p className="mt-2 text-sm text-grey-500">{state.message}</p>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={isPending}
              className="flex-1 rounded-xl border border-grey-300 py-2 text-sm font-medium text-on-surface transition-colors hover:bg-grey-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onSelect("ALL")}
              disabled={isPending}
              className="flex-1 rounded-xl bg-primary py-2 text-sm font-medium text-white transition-colors hover:bg-primary-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60"
            >
              {isPending ? "Saving…" : "Confirm"}
            </button>
          </div>
        </div>
      </div>
    );
  }
  const options: Array<{ scope: OccurrenceScope; label: string; hint: string }> = [
    {
      scope: "THIS",
      label: "This event",
      hint: isDelete ? "Remove only this day" : "Change only this day",
    },
    {
      scope: "THIS_AND_FOLLOWING",
      label: "This and following events",
      hint: isDelete ? "End the series from this day" : "Split the series from this day",
    },
    {
      scope: "ALL",
      label: "All events",
      hint: isDelete ? "Delete the entire series" : "Change the entire series",
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="scope-dialog-title"
    >
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} aria-hidden="true" />
      <div className="relative z-10 w-full max-w-sm rounded-2xl bg-surface p-5 shadow-2xl ring-1 ring-grey-200">
        <div className="flex items-center gap-2">
          <Repeat size={16} className="shrink-0 text-ink" aria-hidden="true" />
          <h2 id="scope-dialog-title" className="text-base font-semibold text-on-surface">
            {isDelete ? "Delete recurring event" : "Update recurring event"}
          </h2>
        </div>
        <p className="mt-2 text-sm text-grey-500">{state.message}</p>

        <div className="mt-4 flex flex-col gap-2">
          {options.map((option) => (
            <button
              key={option.scope}
              type="button"
              disabled={isPending}
              onClick={() => onSelect(option.scope)}
              className="rounded-xl border border-grey-300 px-4 py-2.5 text-left transition-colors hover:border-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60"
            >
              <span className="block text-sm font-medium text-on-surface">{option.label}</span>
              <span className="block text-xs text-grey-500">{option.hint}</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="mt-3 w-full rounded-xl border border-grey-300 py-2 text-sm font-medium text-on-surface transition-colors hover:bg-grey-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Event Detail Modal ────────────────────────────────────────────────────────

interface EventDetailModalProps {
  event: CalendarEvent | null;
  onClose: () => void;
  onSave: (updated: CalendarEvent) => void;
  onDelete: (id: string) => void;
  /** Open the full prefilled editor for a single-task occurrence. */
  onEditDetails?: (occurrence: TaskOccurrence) => void;
}

function EventDetailModal({ event, onClose, onSave, onDelete, onEditDetails }: EventDetailModalProps) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [colorIdx, setColorIdx] = useState(0);

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setDescription(event.description);
      setDate(event.date);
      setStartTime(event.startTime);
      setEndTime(event.endTime);
      const idx = EVENT_COLORS.findIndex((c) => c.color === event.color);
      setColorIdx(idx >= 0 ? idx : 0);
      setEditing(false);
    }
  }, [event]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!event) return null;

  function handleSave() {
    if (!event) return;
    const chosen = EVENT_COLORS[colorIdx]!;
    onSave({
      ...event,
      title:       title.trim() || event.title,
      description,
      date,
      startTime,
      endTime,
      color:       chosen.color,
      textColor:   chosen.textColor,
    });
    setEditing(false);
  }

  const chosen = EVENT_COLORS[colorIdx]!;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-modal-title"
    >
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-surface shadow-2xl ring-1 ring-grey-200">
        {/* Colour strip at top */}
        <div className={cn("h-1.5 w-full rounded-t-2xl", chosen.color)} />

        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-4 pb-2">
          {editing ? (
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1 rounded-lg border border-grey-300 px-2 py-1 text-base font-semibold text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          ) : (
            <h2 id="event-modal-title" className="text-base font-semibold text-on-surface">
              {event.title}
            </h2>
          )}
          <div className="ml-3 flex shrink-0 items-center gap-1">
            {!editing && (
              <button
                type="button"
                aria-label="Edit event"
                onClick={() => (event.raw && onEditDetails ? onEditDetails(event.raw) : setEditing(true))}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-grey-500 transition-colors hover:bg-grey-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Pencil size={14} aria-hidden="true" />
              </button>
            )}
            <button
              type="button"
              aria-label="Delete event"
              onClick={() => onDelete(event.id)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-grey-500 transition-colors hover:bg-red-50 hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Trash2 size={14} aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-grey-500 transition-colors hover:bg-grey-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <X size={14} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 pb-5">
          {/* Recurring badge */}
          {event.recurring && (
            <div className="mb-1 flex items-center gap-1.5 text-xs text-grey-500">
              <Repeat size={12} aria-hidden="true" />
              Recurring — changes will ask which occurrences to affect
            </div>
          )}

          {/* Date row */}
          <div className="flex items-center gap-2 py-1.5">
            <Calendar size={14} className="shrink-0 text-grey-500" aria-hidden="true" />
            {editing ? (
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="rounded-lg border border-grey-300 px-2 py-1 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            ) : (
              <span className="text-sm text-on-surface">{formatDateLong(event.date)}</span>
            )}
          </div>

          {/* Time row */}
          <div className="flex items-center gap-2 py-1.5">
            <Clock size={14} className="shrink-0 text-grey-500" aria-hidden="true" />
            {editing ? (
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="rounded-lg border border-grey-300 px-2 py-1 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
                <span className="text-xs text-grey-500">–</span>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="rounded-lg border border-grey-300 px-2 py-1 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
            ) : (
              <span className="text-sm text-on-surface">
                {formatTimeDisplay(event.startTime)} – {formatTimeDisplay(event.endTime)}
              </span>
            )}
          </div>

          {/* Location subtitle (read-only) */}
          {event.subtitle && <p className="mt-1 text-sm text-grey-500">{event.subtitle}</p>}

          {/* Description */}
          {editing ? (
            <div className="mt-2">
              <label className="mb-1 block text-xs font-medium text-grey-500">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Add a description…"
                className="w-full resize-none rounded-lg border border-grey-300 px-3 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
          ) : (
            event.description && (
              <p className="mt-1 text-sm text-grey-500">{event.description}</p>
            )
          )}

          {/* Assigned profiles + items (read-only) */}
          {!editing && (
            <div className="mt-3 flex flex-col gap-3">
              {(event.cleanerProfiles?.length ?? 0) > 0 && (
                <section>
                  <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-grey-500">
                    <Users size={12} aria-hidden="true" /> Cleaner profiles
                  </p>
                  <ul className="flex flex-col gap-1">
                    {event.cleanerProfiles!.map((p, i) => (
                      <li
                        key={i}
                        className="flex items-center justify-between rounded-lg bg-grey-50 px-2.5 py-1 text-xs"
                      >
                        <span className="font-medium text-on-surface">{p.label}</span>
                        <span className="text-grey-500">{p.name ?? "Vacant"}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              {(event.supervisorProfiles?.length ?? 0) > 0 && (
                <section>
                  <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-grey-500">
                    <UserCog size={12} aria-hidden="true" /> Supervisor profiles
                  </p>
                  <ul className="flex flex-col gap-1">
                    {event.supervisorProfiles!.map((p, i) => (
                      <li
                        key={i}
                        className="flex items-center justify-between rounded-lg bg-grey-50 px-2.5 py-1 text-xs"
                      >
                        <span className="font-medium text-on-surface">{p.label}</span>
                        <span className="text-grey-500">{p.name ?? "Vacant"}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              {(event.items?.length ?? 0) > 0 && (
                <section>
                  <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-grey-500">
                    <Package size={12} aria-hidden="true" /> Items
                  </p>
                  <ul className="flex flex-col gap-1">
                    {event.items!.map((it, i) => (
                      <li
                        key={i}
                        className="flex items-center justify-between rounded-lg bg-grey-50 px-2.5 py-1 text-xs"
                      >
                        <span className="text-on-surface">{it.name}</span>
                        <span className="text-grey-500">
                          {it.quantity}
                          {it.unit ? ` ${it.unit}` : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          )}

          {/* Color picker (edit mode) */}
          {editing && (
            <div className="mt-3">
              <p className="mb-1.5 text-xs font-medium text-grey-500">Color</p>
              <div className="flex gap-2 flex-wrap">
                {EVENT_COLORS.map((c, i) => (
                  <button
                    key={c.label}
                    type="button"
                    aria-label={`Color: ${c.label}`}
                    onClick={() => setColorIdx(i)}
                    className={cn(
                      "h-6 w-6 rounded-full transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                      i === colorIdx && "ring-2 ring-offset-1 ring-primary scale-110",
                    )}
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Footer actions */}
          {editing ? (
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="flex-1 rounded-xl border border-grey-300 py-2 text-sm font-medium text-on-surface transition-colors hover:bg-grey-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="flex-1 rounded-xl bg-primary py-2 text-sm font-medium text-white transition-colors hover:bg-primary-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                Save changes
              </button>
            </div>
          ) : (
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-grey-300 py-2 text-sm font-medium text-on-surface transition-colors hover:bg-grey-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => (event.raw && onEditDetails ? onEditDetails(event.raw) : setEditing(true))}
                className="flex-1 rounded-xl bg-primary py-2 text-sm font-medium text-white transition-colors hover:bg-primary-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                Edit event
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Week View ─────────────────────────────────────────────────────────────────

/** Visual minimum length (in minutes ≙ px) — matches the 24px min block height. */
const MIN_VISUAL_MINUTES = 24;

interface LaidOutEvent {
  ev: CalendarEvent;
  /** Column index within its overlap cluster. */
  col: number;
  /** Total columns in the cluster — events share the slot width. */
  cols: number;
}

/**
 * Side-by-side layout for overlapping events: events that overlap in time are
 * clustered, each gets a column, and every event in the cluster shares the
 * day-column width so simultaneous tasks stay visible next to each other.
 */
function layoutDayEvents(dayEvents: CalendarEvent[]): LaidOutEvent[] {
  const sorted = [...dayEvents].sort(
    (a, b) =>
      timeToMinutes(a.startTime) - timeToMinutes(b.startTime) ||
      timeToMinutes(b.endTime) - timeToMinutes(a.endTime),
  );
  const result: LaidOutEvent[] = [];
  let cluster: CalendarEvent[] = [];
  let clusterEnd = -1;

  function visualEnd(ev: CalendarEvent): number {
    const start = timeToMinutes(ev.startTime);
    return Math.max(timeToMinutes(ev.endTime), start + MIN_VISUAL_MINUTES);
  }

  function flushCluster() {
    if (cluster.length === 0) return;
    // Greedy column assignment: first column whose last event ended already.
    const columnEnds: number[] = [];
    const placed = cluster.map((ev) => {
      const start = timeToMinutes(ev.startTime);
      let col = columnEnds.findIndex((end) => end <= start);
      if (col === -1) {
        col = columnEnds.length;
        columnEnds.push(visualEnd(ev));
      } else {
        columnEnds[col] = visualEnd(ev);
      }
      return { ev, col };
    });
    for (const p of placed) {
      result.push({ ...p, cols: columnEnds.length });
    }
    cluster = [];
    clusterEnd = -1;
  }

  for (const ev of sorted) {
    if (cluster.length > 0 && timeToMinutes(ev.startTime) >= clusterEnd) {
      flushCluster();
    }
    cluster.push(ev);
    clusterEnd = Math.max(clusterEnd, visualEnd(ev));
  }
  flushCluster();
  return result;
}

interface WeekViewProps {
  weekDates: string[];
  events: CalendarEvent[];
  today: string;
  /** Null = no site selected → no working-day distinction. */
  workingDays: DayOfWeek[] | null;
  onSlotClick: (date: string, time: string, x: number, y: number) => void;
  onEventClick: (event: CalendarEvent) => void;
  onDeleteEvent: (id: string) => void;
  onDragStart: (e: React.DragEvent, event: CalendarEvent) => void;
  onDrop: (e: React.DragEvent, date: string, slotTime: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onResizeStart: (e: React.MouseEvent, event: CalendarEvent) => void;
  draggingId: string | null;
}

function WeekView({
  weekDates,
  events,
  today,
  workingDays,
  onSlotClick,
  onEventClick,
  onDeleteEvent,
  onDragStart,
  onDrop,
  onDragOver,
  onResizeStart,
  draggingId,
}: WeekViewProps) {
  const [hoverSlot, setHoverSlot] = useState<{ date: string; time: string } | null>(null);
  const [currentTimeTop, setCurrentTimeTop] = useState<number>(-1);

  useEffect(() => {
    function updateCurrentTime() {
      const now = new Date();
      const mins = now.getHours() * 60 + now.getMinutes();
      const top = (mins - START_HOUR * 60) * (SLOT_HEIGHT / 60);
      setCurrentTimeTop(top);
    }
    updateCurrentTime();
    const interval = setInterval(updateCurrentTime, 60000);
    return () => clearInterval(interval);
  }, []);

  function getEventsForDay(date: string): CalendarEvent[] {
    return groupDayEvents(events.filter((e) => e.date === date));
  }

  function isWorkingDate(date: string): boolean {
    return workingDays === null || workingDays.includes(dayOfWeekOf(date));
  }

  function slotTimeForY(y: number): string {
    const mins = Math.round(y / (SLOT_HEIGHT / 60) / 30) * 30 + START_HOUR * 60;
    return minutesToTime(mins);
  }

  return (
    <div className="flex min-w-0 flex-col">
      {/* Day header row */}
      <div className="flex border-b border-grey-200 bg-surface">
        <div className="w-16 shrink-0 border-r border-grey-200" />
        {weekDates.map((dateStr) => {
          const { day, date } = formatDisplayDate(dateStr);
          const isToday = dateStr === today;
          const working = isWorkingDate(dateStr);
          return (
            <div
              key={dateStr}
              className={cn(
                "flex flex-1 flex-col items-center py-3 text-center",
                isToday && "bg-primary/5",
                !working && "bg-grey-100/70",
              )}
            >
              <span className={cn("text-xs font-medium", isToday ? "text-ink" : "text-grey-500")}>
                {day}
              </span>
              <span
                className={cn(
                  "mt-1 flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold",
                  isToday ? "bg-primary text-white" : working ? "text-on-surface" : "text-grey-400",
                )}
              >
                {date}
              </span>
              {!working && (
                <span className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-grey-400">
                  off
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Time grid */}
      <div className="overflow-y-auto" style={{ maxHeight: "560px" }}>
        <div className="relative flex">
          {/* Time labels */}
          <div className="w-16 shrink-0 border-r border-grey-200">
            {HOURS.map((h) => (
              <div
                key={h}
                className="relative flex items-start justify-end pr-2"
                style={{ height: `${SLOT_HEIGHT}px` }}
              >
                <span className="relative -top-2 text-xs text-grey-400">
                  {h === 12 ? "12 PM" : h > 12 ? `${h - 12} PM` : `${h} AM`}
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          <div className="relative flex flex-1">
            {weekDates.map((dateStr) => {
              const isToday = dateStr === today;
              const working = isWorkingDate(dateStr);
              const dayEvents = getEventsForDay(dateStr);
              return (
                <div
                  key={dateStr}
                  className={cn(
                    "relative flex-1 border-r border-grey-200 last:border-r-0",
                    isToday && "bg-primary/[0.02]",
                    !working && "bg-grey-100/50",
                  )}
                  style={{ height: `${SLOT_HEIGHT * HOURS.length}px` }}
                  onDragOver={onDragOver}
                  onDrop={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const y = e.clientY - rect.top;
                    const slotTime = slotTimeForY(y);
                    onDrop(e, dateStr, slotTime);
                  }}
                >
                  {/* Hour lines */}
                  {HOURS.map((h) => (
                    <div
                      key={h}
                      className="absolute left-0 right-0 border-t border-grey-200/70"
                      style={{ top: `${(h - START_HOUR) * SLOT_HEIGHT}px` }}
                    />
                  ))}

                  {/* 30-min lines */}
                  {HOURS.map((h) => (
                    <div
                      key={`${h}-30`}
                      className="absolute left-0 right-0 border-t border-grey-200/30"
                      style={{ top: `${(h - START_HOUR) * SLOT_HEIGHT + SLOT_HEIGHT / 2}px` }}
                    />
                  ))}

                  {/* Clickable slot overlay */}
                  {HOURS.map((h) =>
                    [0, 30].map((m) => {
                      const slotTime = minutesToTime(h * 60 + m);
                      const isHovered =
                        hoverSlot?.date === dateStr && hoverSlot?.time === slotTime;
                      return (
                        <div
                          key={`${h}-${m}`}
                          className={cn(
                            "absolute left-0 right-0 cursor-pointer transition-colors",
                            isHovered && "bg-primary/5",
                          )}
                          style={{
                            top: `${(h - START_HOUR) * SLOT_HEIGHT + (m === 30 ? SLOT_HEIGHT / 2 : 0)}px`,
                            height: `${SLOT_HEIGHT / 2}px`,
                          }}
                          onMouseEnter={() => setHoverSlot({ date: dateStr, time: slotTime })}
                          onMouseLeave={() => setHoverSlot(null)}
                          onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            onSlotClick(dateStr, slotTime, rect.left + rect.width / 2, rect.top);
                          }}
                        />
                      );
                    }),
                  )}

                  {/* Events — overlapping ones share the column side by side */}
                  {layoutDayEvents(dayEvents).map(({ ev, col, cols }) => {
                    const startMins = timeToMinutes(ev.startTime);
                    const endMins = timeToMinutes(ev.endTime);
                    const top = (startMins - START_HOUR * 60) * (SLOT_HEIGHT / 60);
                    const height = (endMins - startMins) * (SLOT_HEIGHT / 60);
                    const widthPct = 100 / cols;

                    return (
                      <div
                        key={ev.id}
                        draggable={!ev.grouped}
                        onDragStart={ev.grouped ? undefined : (e) => onDragStart(e, ev)}
                        className={cn(
                          "group absolute rounded-lg p-2 cursor-pointer transition-opacity select-none",
                          cols > 1 && "ring-1 ring-white/70 p-1.5",
                          ev.color,
                          ev.textColor,
                          draggingId === ev.id && "opacity-40",
                        )}
                        style={{
                          top: `${top}px`,
                          height: `${Math.max(height, 24)}px`,
                          left: `calc(${col * widthPct}% + 3px)`,
                          width: `calc(${widthPct}% - 6px)`,
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick(ev.members?.[0] ?? ev);
                        }}
                        title={`${ev.title} — ${formatTimeDisplay(ev.startTime)} to ${formatTimeDisplay(ev.endTime)}`}
                      >
                        <p className="flex items-center gap-1 text-xs font-semibold leading-tight truncate">
                          {ev.recurring && <Repeat size={10} className="shrink-0" aria-hidden="true" />}
                          <span className="truncate">{ev.title}</span>
                        </p>
                        {height > 40 && (
                          <p className="text-xs opacity-80 truncate">{ev.subtitle}</p>
                        )}
                        {height > 56 && (
                          <p className="text-xs opacity-70 mt-0.5">
                            {formatTimeDisplay(ev.startTime)} – {formatTimeDisplay(ev.endTime)}
                          </p>
                        )}
                        {/* Quick delete button — single-task blocks only */}
                        {!ev.grouped && (
                          <button
                            type="button"
                            aria-label={`Delete ${ev.title}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteEvent(ev.id);
                            }}
                            className="absolute right-1 top-1 hidden h-4 w-4 items-center justify-center rounded-full bg-black/25 text-white group-hover:flex focus-visible:flex focus-visible:outline-none"
                          >
                            <X size={10} aria-hidden="true" />
                          </button>
                        )}
                        {/* Resize handle — single-task blocks only */}
                        {!ev.grouped && (
                          <div
                            className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity"
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              onResizeStart(e, ev);
                            }}
                            aria-hidden="true"
                          >
                            <div className="mx-auto mt-0.5 h-1 w-8 rounded-full bg-white/40" />
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Current time indicator */}
                  {isToday && currentTimeTop >= 0 && currentTimeTop <= SLOT_HEIGHT * HOURS.length && (
                    <div
                      className="pointer-events-none absolute left-0 right-0 z-10 flex items-center"
                      style={{ top: `${currentTimeTop}px` }}
                    >
                      <div className="h-2.5 w-2.5 rounded-full bg-red-500 shrink-0" />
                      <div className="h-px flex-1 bg-red-400" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Month View ────────────────────────────────────────────────────────────────

interface MonthViewProps {
  year: number;
  month: number;
  events: CalendarEvent[];
  today: string;
  workingDays: DayOfWeek[] | null;
  holidays: Map<string, string>;
  onDayClick: (date: string, x: number, y: number) => void;
  onTypeClick: (group: DayTypeGroup, date: string) => void;
}

function MonthView({ year, month, events, today, workingDays, holidays, onDayClick, onTypeClick }: MonthViewProps) {
  const weeks = getMonthWeeks(year, month);

  function isWorkingDate(date: string): boolean {
    return workingDays === null || workingDays.includes(dayOfWeekOf(date));
  }

  return (
    <div className="flex flex-col">
      {/* Day-of-week header */}
      <div className="grid grid-cols-7 border-b border-grey-200">
        {DAY_LABELS.map((d) => (
          <div key={d} className="py-2 text-center text-xs font-medium text-grey-500">
            {d}
          </div>
        ))}
      </div>

      {/* Weeks */}
      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7 border-b border-grey-200 last:border-b-0">
          {week.map((dateStr) => {
            const dt = new Date(dateStr + "T00:00:00");
            const isCurrentMonth = dt.getMonth() === month;
            const isToday = dateStr === today;
            const working = isWorkingDate(dateStr);
            const typeGroups = groupDayByType(events.filter((e) => e.date === dateStr));
            const visibleGroups = typeGroups.slice(0, 4);
            const overflow = typeGroups.length - visibleGroups.length;
            const holidayName = holidays.get(dateStr);

            return (
              <div
                key={dateStr}
                title={holidayName}
                className={cn(
                  "min-h-[112px] cursor-pointer border-r border-grey-200 p-1 last:border-r-0 transition-colors hover:bg-grey-100/50",
                  !isCurrentMonth && "bg-grey-100/30",
                  isCurrentMonth && !working && !holidayName && "bg-grey-100/60",
                  holidayName && "bg-rose-50",
                )}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  onDayClick(dateStr, rect.left + rect.width / 2, rect.top);
                }}
              >
                <div className="flex items-center justify-between gap-1">
                  <span
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                      isToday && "bg-primary text-white font-semibold",
                      !isToday && isCurrentMonth && (working ? "text-on-surface" : "text-grey-400"),
                      !isToday && !isCurrentMonth && "text-grey-400",
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

                {/* Work-type rectangles — one per type present that day */}
                <div className="mt-1 flex flex-col gap-1">
                  {visibleGroups.map((g) => (
                    <button
                      key={g.type}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onTypeClick(g, dateStr);
                      }}
                      className="flex w-full items-center justify-between gap-1 rounded px-1.5 py-1 text-left text-[11px] font-semibold text-white transition-opacity hover:opacity-90"
                      style={{ backgroundColor: g.hex }}
                      title={`${WORK_TYPE_LABELS[g.type as WorkType] ?? g.type} — ${g.events.length} task${g.events.length === 1 ? "" : "s"}`}
                    >
                      <span className="truncate">{WORK_TYPE_LABELS[g.type as WorkType] ?? g.type}</span>
                      {g.events.length > 1 && (
                        <span className="shrink-0 rounded-full bg-black/20 px-1 text-[9px] leading-tight">
                          {g.events.length}
                        </span>
                      )}
                    </button>
                  ))}
                  {overflow > 0 && (
                    <span className="pl-1 text-[11px] text-grey-400">+{overflow} more</span>
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

// ── Week View (work-type rectangles on a dynamic time grid) ────────────────────

interface TypeBlock extends DayTypeGroup {
  startMin: number;
  endMin: number; // may exceed 1440 when the block runs past midnight
  overnight: boolean;
  /** 0 = bottom of the stack; higher work types sit on top, offset to reveal the ones below. */
  stackLevel: number;
  z: number;
}

// Stacking order for overlapping rectangles (bottom → top): Other, General, Periodical, Work Order.
const TYPE_STACK_Z: Record<string, number> = {
  OTHER: 0,
  GENERAL_TASK: 1,
  PERIODICAL_TASK: 2,
  WORK_ORDER: 3,
};

/** Layer overlapping time blocks on top of each other (not side by side): within an
 *  overlapping cluster, order by work type and stack them, offsetting each upper block so
 *  the one beneath still shows a thin strip at the top. */
function layoutTimeBlocks(blocks: Omit<TypeBlock, "stackLevel" | "z">[]): TypeBlock[] {
  const sorted = [...blocks].sort((a, b) => a.startMin - b.startMin || b.endMin - a.endMin);
  const result: TypeBlock[] = [];
  let cluster: Omit<TypeBlock, "stackLevel" | "z">[] = [];
  let clusterEnd = -1;
  function flush() {
    if (cluster.length === 0) return;
    const ordered = [...cluster].sort(
      (a, b) => (TYPE_STACK_Z[a.type] ?? 0) - (TYPE_STACK_Z[b.type] ?? 0),
    );
    ordered.forEach((b, i) => result.push({ ...b, stackLevel: i, z: i + 1 }));
    cluster = [];
    clusterEnd = -1;
  }
  for (const b of sorted) {
    if (cluster.length > 0 && b.startMin >= clusterEnd) flush();
    cluster.push(b);
    clusterEnd = Math.max(clusterEnd, b.endMin);
  }
  flush();
  return result;
}

function fmtTimeRange(startMin: number, endMin: number): string {
  const s = minutesToTime(((startMin % 1440) + 1440) % 1440);
  const e = minutesToTime(((endMin % 1440) + 1440) % 1440);
  return `${formatTimeDisplay(s)} – ${formatTimeDisplay(e)}`;
}

interface WeekTypeViewProps {
  weekDates: string[];
  events: CalendarEvent[];
  today: string;
  workingDays: DayOfWeek[] | null;
  holidays: Map<string, string>;
  /** Site general-task window (minutes from midnight) — sizes the General rectangle. */
  generalStartMin: number | null;
  generalEndMin: number | null;
  onSlotClick: (date: string, time: string, x: number, y: number) => void;
  onTypeClick: (group: DayTypeGroup, date: string) => void;
}

function WeekTypeView({
  weekDates,
  events,
  today,
  workingDays,
  holidays,
  generalStartMin,
  generalEndMin,
  onSlotClick,
  onTypeClick,
}: WeekTypeViewProps) {
  function isWorkingDate(date: string): boolean {
    return workingDays === null || workingDays.includes(dayOfWeekOf(date));
  }

  // Build type blocks per day. An overnight window is split into an evening part (this day,
  // until midnight) and a morning part (the next day's column) so each day shows its portion.
  const dateSet = new Set(weekDates);
  const rawByDay = new Map<string, Omit<TypeBlock, "stackLevel" | "z">[]>();
  const pushBlock = (date: string, b: Omit<TypeBlock, "stackLevel" | "z">) => {
    const list = rawByDay.get(date) ?? [];
    list.push(b);
    rawByDay.set(date, list);
  };
  for (const dateStr of weekDates) {
    const groups = groupDayByType(events.filter((e) => e.date === dateStr));
    for (const g of groups) {
      let startMin: number;
      let endMin: number;
      if (g.type === "GENERAL_TASK" && generalStartMin != null && generalEndMin != null) {
        startMin = generalStartMin;
        endMin = generalEndMin;
      } else {
        startMin = Math.min(...g.events.map((e) => timeToMinutes(e.startTime)));
        endMin = Math.max(...g.events.map((e) => timeToMinutes(e.endTime)));
      }
      if (endMin <= startMin) {
        // Overnight: evening part (start → midnight) here; morning part (midnight → end) next day.
        pushBlock(dateStr, { ...g, startMin, endMin: 24 * 60, overnight: true });
        const nextDate = formatDate(new Date(new Date(`${dateStr}T00:00:00`).getTime() + 86400000));
        if (dateSet.has(nextDate)) {
          pushBlock(nextDate, { ...g, startMin: 0, endMin, overnight: true });
        }
      } else {
        pushBlock(dateStr, { ...g, startMin, endMin, overnight: false });
      }
    }
  }

  const blocksByDay = new Map<string, TypeBlock[]>();
  let minStart = 8 * 60;
  let maxEnd = 18 * 60;
  for (const dateStr of weekDates) {
    const laid = layoutTimeBlocks(rawByDay.get(dateStr) ?? []);
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

  function hourLabel(h: number): string {
    return h === 0 ? "12 AM" : h === 12 ? "12 PM" : h > 12 ? `${h - 12} PM` : `${h} AM`;
  }

  return (
    <div className="flex min-w-0 flex-col">
      {/* Day header row (with public-holiday marking) */}
      <div className="flex border-b border-grey-200 bg-surface">
        <div className="w-16 shrink-0 border-r border-grey-200" />
        {weekDates.map((dateStr) => {
          const { day, date } = formatDisplayDate(dateStr);
          const isToday = dateStr === today;
          const working = isWorkingDate(dateStr);
          const holidayName = holidays.get(dateStr);
          return (
            <div
              key={dateStr}
              title={holidayName}
              className={cn(
                "flex flex-1 flex-col items-center py-2 text-center",
                isToday && "bg-primary/5",
                holidayName ? "bg-rose-50" : !working && "bg-grey-100/70",
              )}
            >
              <span className={cn("text-xs font-medium", isToday ? "text-ink" : "text-grey-500")}>{day}</span>
              <span
                className={cn(
                  "mt-1 flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold",
                  isToday ? "bg-primary text-white" : working ? "text-on-surface" : "text-grey-400",
                )}
              >
                {date}
              </span>
              {holidayName ? (
                <span className="mt-1 max-w-full truncate rounded-full bg-rose-100 px-1.5 py-0.5 text-[9px] font-semibold text-rose-600" title={holidayName}>
                  {holidayName}
                </span>
              ) : (
                !working && (
                  <span className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-grey-400">off</span>
                )
              )}
            </div>
          );
        })}
      </div>

      {/* Time grid */}
      <div className="overflow-y-auto" style={{ maxHeight: "560px" }}>
        <div className="relative flex">
          {/* Hour labels */}
          <div className="w-16 shrink-0 border-r border-grey-200">
            {hours.map((h) => (
              <div key={h} className="relative flex items-start justify-end pr-2" style={{ height: `${SLOT_HEIGHT}px` }}>
                <span className="relative -top-2 text-xs text-grey-400">{hourLabel(h)}</span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          <div className="relative flex flex-1">
            {weekDates.map((dateStr) => {
              const isToday = dateStr === today;
              const working = isWorkingDate(dateStr);
              const holidayName = holidays.get(dateStr);
              const blocks = blocksByDay.get(dateStr) ?? [];
              return (
                <div
                  key={dateStr}
                  className={cn(
                    "relative flex-1 border-r border-grey-200 last:border-r-0",
                    isToday && "bg-primary/[0.02]",
                    holidayName ? "bg-rose-50/40" : !working && "bg-grey-100/50",
                  )}
                  style={{ height: `${gridHeight}px` }}
                >
                  {/* Hour lines */}
                  {hours.map((h) => (
                    <div
                      key={h}
                      className="absolute left-0 right-0 border-t border-grey-200/70"
                      style={{ top: `${(h - gridStart) * SLOT_HEIGHT}px` }}
                    />
                  ))}

                  {/* Clickable 30-min slots (quick add) */}
                  {hours.map((h) =>
                    [0, 30].map((m) => {
                      const slotTime = minutesToTime((h * 60 + m) % (24 * 60));
                      return (
                        <div
                          key={`${h}-${m}`}
                          className="absolute left-0 right-0 cursor-pointer transition-colors hover:bg-primary/5"
                          style={{
                            top: `${(h - gridStart) * SLOT_HEIGHT + (m === 30 ? SLOT_HEIGHT / 2 : 0)}px`,
                            height: `${SLOT_HEIGHT / 2}px`,
                          }}
                          onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            onSlotClick(dateStr, slotTime, rect.left + rect.width / 2, rect.top);
                          }}
                        />
                      );
                    }),
                  )}

                  {/* Work-type rectangles — layered on top of each other (not side by side) */}
                  {blocks.map((b) => {
                    const rawTop = (b.startMin - gridStart * 60) * pxPerMin;
                    const rawHeight = (b.endMin - b.startMin) * pxPerMin;
                    // Upper layers are pushed down (bottoms stay aligned) so lower ones peek.
                    const top = rawTop + b.stackLevel * STACK_OFFSET;
                    const height = Math.max(rawHeight - b.stackLevel * STACK_OFFSET, 20);
                    const range = fmtTimeRange(b.startMin, b.endMin);
                    return (
                      <button
                        key={`${b.type}_${b.startMin}`}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onTypeClick(b, dateStr);
                        }}
                        className={cn(
                          "group absolute overflow-hidden rounded-lg p-1.5 text-left text-white shadow-sm transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
                          b.stackLevel > 0 && "ring-1 ring-white/60",
                        )}
                        style={{
                          top: `${top}px`,
                          height: `${height}px`,
                          left: "3px",
                          width: "calc(100% - 6px)",
                          backgroundColor: b.hex,
                          zIndex: b.z,
                        }}
                        title={`${WORK_TYPE_LABELS[b.type as WorkType] ?? b.type} · ${range}${b.overnight ? " (overnight)" : ""}`}
                      >
                        <p className="flex items-center gap-1 truncate text-xs font-semibold leading-tight">
                          {b.overnight && <MoonStar size={11} className="shrink-0" aria-hidden="true" />}
                          <span className="truncate">
                            {WORK_TYPE_LABELS[b.type as WorkType] ?? b.type}
                            {b.events.length > 1 ? ` ×${b.events.length}` : ""}
                          </span>
                        </p>
                        {height > 34 && <p className="truncate text-[11px] opacity-80">{range}</p>}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Quick Add Popover ─────────────────────────────────────────────────────────

interface QuickAddPopoverProps {
  state: QuickAddState;
  onConfirm: (title: string) => void;
  onOpenForm: () => void;
  onClose: () => void;
}

function QuickAddPopover({ state, onConfirm, onOpenForm, onClose }: QuickAddPopoverProps) {
  const [title, setTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    setTitle("");
  }, [state.date, state.time]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "Enter" && title.trim()) {
        onConfirm(title.trim());
        setTitle("");
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [title, onClose, onConfirm]);

  const displayDate = new Date(state.date + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day:   "numeric",
  });

  return (
    <div
      className="fixed z-50 w-64 rounded-2xl bg-surface p-4 shadow-xl ring-1 ring-grey-200"
      style={{ left: state.x, top: state.y + 4 }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-on-surface">Add Event</span>
        <button
          type="button"
          aria-label="Close quick add"
          onClick={onClose}
          className="flex h-6 w-6 items-center justify-center rounded-md text-grey-500 hover:bg-grey-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <X size={14} aria-hidden="true" />
        </button>
      </div>
      <p className="mb-2 text-xs text-grey-500">
        {formatDisplayDate(state.date).day}, {displayDate} · {formatTimeDisplay(state.time)}
      </p>
      <input
        ref={inputRef}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Event title"
        className="mb-3 w-full rounded-xl border border-grey-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onOpenForm}
          className="flex-1 rounded-xl border border-grey-300 py-1.5 text-xs font-medium text-on-surface transition-colors hover:bg-grey-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          Open form
        </button>
        <button
          type="button"
          disabled={!title.trim()}
          onClick={() => {
            if (title.trim()) {
              onConfirm(title.trim());
              setTitle("");
            }
          }}
          className="flex-1 rounded-xl bg-primary py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-variant disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          Add
        </button>
      </div>
    </div>
  );
}

// ── Main WorkforceCalendar Component ──────────────────────────────────────────

export function WorkforceCalendar({ onNewAssignment, siteId, onSiteChange }: WorkforceCalendarProps) {
  const today = formatDate(new Date());
  const siteControlled = siteId !== undefined && onSiteChange !== undefined;
  // Main toggle: the table-like weekly scope view (default) vs the time-grid calendar.
  const [mainView, setMainView] = useState<"calendar" | "scope">("scope");
  const [calendarMode, setCalendarMode] = useState<"week" | "month">("week");
  // Scope view sub-mode: dated week grid vs weekday (Mon–Sun) recurrence grid.
  const [scopeView, setScopeView] = useState<"date" | "day">("date");
  // Scope view task lifecycle filter (soft-deleted tasks are hidden by default).
  const [taskStatusFilter, setTaskStatusFilter] = useState<"ACTIVE" | "INACTIVE" | "DELETED" | "ALL">("ACTIVE");
  const viewMode: "week" | "month" | "schedule" =
    mainView === "scope" ? "schedule" : calendarMode;
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [internalSiteFilter, setInternalSiteFilter] = useState<string>(""); // "" = all sites
  const siteFilter = siteControlled ? siteId! : internalSiteFilter;
  const setSiteFilter = siteControlled ? onSiteChange! : setInternalSiteFilter;
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [quickAdd, setQuickAdd] = useState<QuickAddState>({
    show: false, date: "", time: "", x: 0, y: 0,
  });
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  // Scope-view cell click → brief info popup → full edit of the whole assignment.
  const [infoOccurrence, setInfoOccurrence] = useState<TaskOccurrence | null>(null);
  const [editAssignment, setEditAssignment] = useState<Assignment | null>(null);
  const [editTaskId, setEditTaskId] = useState<string | null>(null);
  const [editOccurrence, setEditOccurrence] = useState<TaskOccurrence | null>(null);
  // Calendar work-type rectangle → details for that type on that day.
  const [typeDetail, setTypeDetail] = useState<{
    type: string;
    hex: string;
    date: string;
    occurrences: TaskOccurrence[];
  } | null>(null);
  const [pendingToggle, setPendingToggle] = useState<{
    taskId: string;
    status: "ACTIVE" | "INACTIVE";
    name: string;
  } | null>(null);
  const [pendingRestore, setPendingRestore] = useState<{ taskId: string; name: string } | null>(null);
  const [scopeDialog, setScopeDialog] = useState<ScopeDialogState | null>(null);

  // Floor/area management (scope view, single site selected).
  const [floorModal, setFloorModal] = useState<{ mode: "add" | "edit"; floor?: Floor } | null>(null);
  const [areaModal, setAreaModal] = useState<{ mode: "add" | "edit"; floor?: Floor; area?: Area } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<
    { kind: "floor"; floor: Floor } | { kind: "area"; area: Area } | null
  >(null);

  const weekStart    = getWeekStart(currentDate);
  const weekDates    = getDayDates(weekStart);
  const currentMonth = currentDate.getMonth();
  const currentYear  = currentDate.getFullYear();

  const monthLabel = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year:  "numeric",
  });

  const sitesQuery = useSites();
  // Exactly one site is always selected (no "all sites"). Auto-pick the first once
  // sites load, or if the current selection is no longer present.
  const sites = sitesQuery.data;
  if (!siteControlled && sites && sites.length > 0 && !sites.some((s) => s.id === siteFilter)) {
    setSiteFilter(sites[0]!.id);
  }
  const selectedSite = useMemo(
    () => (sitesQuery.data ?? []).find((s) => s.id === siteFilter),
    [sitesQuery.data, siteFilter],
  );
  // Only distinguish working days when one site (with configured days) is selected.
  const workingDays: DayOfWeek[] | null =
    selectedSite && (selectedSite.workingDays?.length ?? 0) > 0
      ? selectedSite.workingDays
      : null;

  // ── Scope-view management: full floor/area structure of the selected site ────
  const managing = mainView === "scope" && !!siteFilter;
  const floorsQuery = useFloors(managing ? siteFilter : undefined);
  // One query for all areas the user can see; filtered to the site's floors below.
  const allAreasQuery = useAreas(undefined, { enabled: managing });

  // Optimistic floor order override so drag-reorder feels instant before the refetch lands.
  const [localFloorOrder, setLocalFloorOrder] = useState<string[] | null>(null);
  const reorderFloors = useReorderFloors();
  // Optimistic per-floor area order override, keyed by floorId.
  const [localAreaOrder, setLocalAreaOrder] = useState<Record<string, string[]>>({});
  const reorderAreas = useReorderAreas();
  const reorderTasks = useReorderTasks();
  const role = useMe().data?.role;
  const canReorderFloors = role === "SUPER_ADMIN" || role === "COMPANY_ADMIN";
  const canReorderAreas = canReorderFloors;
  const canReorderTasks = canReorderFloors;

  const floors = useMemo(() => {
    const list = (floorsQuery.data ?? [])
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
    if (localFloorOrder) {
      const rank = new Map(localFloorOrder.map((id, i) => [id, i]));
      list.sort((a, b) => (rank.get(a.id) ?? 999) - (rank.get(b.id) ?? 999));
    }
    return list;
  }, [floorsQuery.data, localFloorOrder]);
  const areasByFloor = useMemo(() => {
    const map = new Map<string, Area[]>();
    for (const floor of floors) map.set(floor.id, []);
    for (const area of allAreasQuery.data ?? []) {
      if (map.has(area.floorId)) map.get(area.floorId)!.push(area);
    }
    for (const [floorId, list] of map) {
      list.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
      const override = localAreaOrder[floorId];
      if (override) {
        const rank = new Map(override.map((id, i) => [id, i]));
        list.sort((a, b) => (rank.get(a.id) ?? 999) - (rank.get(b.id) ?? 999));
      }
    }
    return map;
  }, [floors, allAreasQuery.data, localAreaOrder]);

  const createFloor = useCreateFloor();
  const updateFloor = useUpdateFloor();
  const deleteFloor = useDeleteFloor();
  const createArea = useCreateArea();
  const updateArea = useUpdateArea();
  const deleteArea = useDeleteArea();

  // Visible date range → drives the backend fetch. The schedule grid is weekly too.
  const range = useMemo<OccurrenceQuery>(() => {
    if (viewMode === "week" || viewMode === "schedule") {
      return { from: weekDates[0]!, to: weekDates[6]!, siteId: siteFilter || undefined, taskStatus: taskStatusFilter };
    }
    const weeks = getMonthWeeks(currentYear, currentMonth);
    return {
      from: weeks[0]![0]!,
      to: weeks[weeks.length - 1]![6]!,
      siteId: siteFilter || undefined,
      taskStatus: taskStatusFilter,
    };
  }, [viewMode, weekDates, currentYear, currentMonth, siteFilter, taskStatusFilter]);

  const occurrencesQuery = useOccurrences(range);
  const siteTasksQuery = useSiteTasks(managing ? range : undefined);
  const statusCountsQuery = useSiteTaskStatusCounts(managing ? range : undefined);
  // Australian public holidays across the visible span.
  const holidayYears = useMemo(
    () => Array.from(new Set([Number(range.from.slice(0, 4)), Number(range.to.slice(0, 4))])),
    [range],
  );
  const holidays = usePublicHolidays(holidayYears);
  // Site general-task window (minutes) — sizes the General rectangle in the week view.
  const generalStartMin = selectedSite?.generalTaskStartTime
    ? timeToMinutes(selectedSite.generalTaskStartTime.slice(0, 5))
    : null;
  const generalEndMin = selectedSite?.generalTaskEndTime
    ? timeToMinutes(selectedSite.generalTaskEndTime.slice(0, 5))
    : null;
  const setTaskStatusMutation = useSetTaskStatus();
  const restoreTaskMutation = useRestoreTask();

  // Day view aggregates the recurrence pattern into weekday columns (independent of the
  // selected week), so it fetches a wider lookahead than the visible week.
  const dayScope = managing && scopeView === "day";
  const dayRange = useMemo<OccurrenceQuery | undefined>(() => {
    if (!dayScope) return undefined;
    const end = new Date(`${today}T00:00:00`);
    end.setDate(end.getDate() + 41);
    return { from: today, to: formatDate(end), siteId: siteFilter || undefined, taskStatus: taskStatusFilter };
  }, [dayScope, today, siteFilter, taskStatusFilter]);
  const dayOccurrencesQuery = useOccurrences(dayRange);

  // Persist the task-status filter so a manager who switches to Inactive/All stays there.
  useEffect(() => {
    const saved = window.localStorage.getItem("workforce.taskStatusFilter");
    if (saved === "ACTIVE" || saved === "INACTIVE" || saved === "DELETED" || saved === "ALL") {
      setTaskStatusFilter(saved);
    }
  }, []);
  useEffect(() => {
    window.localStorage.setItem("workforce.taskStatusFilter", taskStatusFilter);
  }, [taskStatusFilter]);

  const statusCounts = statusCountsQuery.data;

  function handleReorderFloors(orderedFloorIds: string[]) {
    if (!siteFilter) return;
    setLocalFloorOrder(orderedFloorIds);
    reorderFloors.mutate({ siteId: siteFilter, floorIds: orderedFloorIds });
  }

  function handleReorderAreas(floorId: string, orderedAreaIds: string[]) {
    setLocalAreaOrder((prev) => ({ ...prev, [floorId]: orderedAreaIds }));
    reorderAreas.mutate({ floorId, areaIds: orderedAreaIds });
  }

  function handleReorderTasks(areaId: string, orderedTaskIds: string[]) {
    reorderTasks.mutate({ areaId, taskIds: orderedTaskIds });
  }
  const editMutation = useEditOccurrence();
  const deleteMutation = useDeleteOccurrence();

  // Mirror server data into local state so drag/resize can update optimistically.
  // Sync during render (React's approved "adjust state on prop change" pattern)
  // rather than in an effect, which avoids a cascading commit.
  const serverOccurrences = occurrencesQuery.data;
  const [syncedFrom, setSyncedFrom] = useState<typeof serverOccurrences>(undefined);
  if (serverOccurrences !== syncedFrom) {
    setSyncedFrom(serverOccurrences);
    setEvents((serverOccurrences ?? []).map(mapOccurrenceToEvent));
  }

  // Upcoming dates a task will lose when deactivated — shown in the confirm dialog so the
  // manager sees the blast radius before hiding a whole recurring task.
  function upcomingDatesForTask(taskId: string, limit = 3): string[] {
    return Array.from(
      new Set(
        (serverOccurrences ?? [])
          .filter((o) => o.taskId === taskId && o.date >= today)
          .map((o) => o.date),
      ),
    )
      .sort()
      .slice(0, limit);
  }

  const toggleUpcoming =
    pendingToggle?.status === "INACTIVE" ? upcomingDatesForTask(pendingToggle.taskId) : [];

  // Keep the latest events available to the resize mouseup handler.
  const eventsRef = useRef(events);
  eventsRef.current = events;

  function revertToServer() {
    setEvents((serverOccurrences ?? []).map(mapOccurrenceToEvent));
  }

  function navigatePrev() {
    const d = new Date(currentDate);
    if (viewMode === "month") d.setMonth(d.getMonth() - 1);
    else d.setDate(d.getDate() - 7);
    setCurrentDate(d);
  }

  function navigateNext() {
    const d = new Date(currentDate);
    if (viewMode === "month") d.setMonth(d.getMonth() + 1);
    else d.setDate(d.getDate() + 7);
    setCurrentDate(d);
  }

  function goToToday() {
    setCurrentDate(new Date());
  }

  // ── Persisting occurrence changes ─────────────────────────────────────────

  function persistEdit(event: CalendarEvent, payload: Omit<EditOccurrenceInput, "scope">,
                       scope: OccurrenceScope, onDone?: () => void) {
    editMutation.mutate(
      { taskId: event.taskId, occurrenceDate: event.occurrenceDate, input: { ...payload, scope } },
      {
        onSuccess: () => onDone?.(),
        onError: () => {
          revertToServer();
          onDone?.();
        },
      },
    );
  }

  function persistDelete(event: CalendarEvent, scope: OccurrenceScope, onDone?: () => void) {
    setEvents((prev) => prev.filter((e) => e.id !== event.id));
    if (selectedEvent?.id === event.id) setSelectedEvent(null);
    deleteMutation.mutate(
      { taskId: event.taskId, occurrenceDate: event.occurrenceDate, scope },
      {
        onSuccess: () => onDone?.(),
        onError: () => {
          revertToServer();
          onDone?.();
        },
      },
    );
  }

  /** All edits confirm via the dialog — recurring events additionally pick a scope. */
  function requestEdit(event: CalendarEvent, payload: Omit<EditOccurrenceInput, "scope">,
                       message: string, previous: CalendarEvent | null) {
    setScopeDialog({ kind: "edit", event, message, payload, previous });
  }

  function requestDelete(event: CalendarEvent) {
    if (event.recurring) {
      setScopeDialog({
        kind: "delete",
        event,
        message: `“${event.title}” repeats. Which occurrences do you want to delete?`,
        payload: {},
        previous: null,
      });
    } else {
      persistDelete(event, "ALL");
    }
  }

  function handleScopeSelect(scope: OccurrenceScope) {
    if (!scopeDialog) return;
    const { kind, event, payload } = scopeDialog;
    if (kind === "delete") {
      persistDelete(event, scope, () => setScopeDialog(null));
    } else {
      persistEdit(event, payload, scope, () => setScopeDialog(null));
    }
  }

  function handleScopeCancel() {
    if (scopeDialog?.previous) {
      const prev = scopeDialog.previous;
      setEvents((list) => list.map((x) => (x.id === prev.id ? prev : x)));
    } else if (scopeDialog?.kind === "edit") {
      revertToServer();
    }
    setScopeDialog(null);
  }

  // ── Drag handlers ──────────────────────────────────────────────────────────

  function handleEventDragStart(e: React.DragEvent, event: CalendarEvent) {
    e.dataTransfer.setData("eventId", event.id);
    e.dataTransfer.effectAllowed = "move";
    setDraggingId(event.id);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function handleSlotDrop(e: React.DragEvent, date: string, slotTime: string) {
    e.preventDefault();
    const eventId = e.dataTransfer.getData("eventId");
    const ev = events.find((x) => x.id === eventId);
    setDraggingId(null);
    if (!ev) return;
    if (ev.date === date && ev.startTime === slotTime) return;
    const duration = timeDiff(ev.startTime, ev.endTime);
    const newEnd = addMinutes(slotTime, duration);
    setEvents((prev) =>
      prev.map((x) =>
        x.id === eventId ? { ...x, date, startTime: slotTime, endTime: newEnd } : x,
      ),
    );
    requestEdit(
      ev,
      { newDate: date, newStartTime: slotTime, newDurationMinutes: duration },
      `Move “${ev.title}” to ${formatDateLong(date)} at ${formatTimeDisplay(slotTime)}?`,
      ev,
    );
  }

  // ── Resize handlers ────────────────────────────────────────────────────────

  const handleResizeStartRef = useRef<(e: React.MouseEvent, event: CalendarEvent) => void>(() => {});
  handleResizeStartRef.current = (e: React.MouseEvent, event: CalendarEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const onMouseMove = (me: MouseEvent) => {
      const deltaMinutes = Math.round(me.movementY);
      setEvents((prev) =>
        prev.map((ev) => {
          if (ev.id !== event.id) return ev;
          const newEndMins = Math.max(
            timeToMinutes(ev.startTime) + 30,
            timeToMinutes(ev.endTime) + deltaMinutes,
          );
          return { ...ev, endTime: minutesToTime(newEndMins) };
        }),
      );
    };

    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      const current = eventsRef.current.find((x) => x.id === event.id);
      if (!current) return;
      const duration = timeDiff(current.startTime, current.endTime);
      if (duration === timeDiff(event.startTime, event.endTime)) return;
      requestEdit(
        current,
        { newStartTime: current.startTime, newDurationMinutes: duration },
        `Update “${current.title}” to ${formatTimeDisplay(current.startTime)} – ${formatTimeDisplay(current.endTime)}?`,
        event,
      );
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };
  const handleResizeStart = useCallback(
    (e: React.MouseEvent, event: CalendarEvent) => handleResizeStartRef.current(e, event),
    [],
  );

  // ── Event modal / quick-add ────────────────────────────────────────────────

  function handleDeleteEvent(id: string) {
    const ev = events.find((x) => x.id === id);
    if (!ev) return;
    setSelectedEvent(null);
    requestDelete(ev);
  }

  function handleEventClick(event: CalendarEvent) {
    setQuickAdd((s) => ({ ...s, show: false }));
    setSelectedEvent(event);
  }

  function handleEventUpdate(updated: CalendarEvent) {
    const original = events.find((e) => e.id === updated.id);
    setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    setSelectedEvent(null);
    requestEdit(
      updated,
      {
        ...(original && updated.date !== original.date ? { newDate: updated.date } : {}),
        newStartTime: normalizeTime(updated.startTime),
        newDurationMinutes: timeDiff(updated.startTime, updated.endTime),
        name: updated.title,
        description: updated.description,
        colorHex: hexFromColorClass(updated.color),
      },
      `Apply your changes to “${updated.title}”?`,
      original ?? null,
    );
  }

  function handleSlotClick(date: string, time: string, x: number, y: number) {
    setSelectedEvent(null);
    setQuickAdd({ show: true, date, time, x, y });
  }

  // Inline quick-add can't satisfy the required fields (site/tasks/cleaners),
  // so it hands off to the full assignment modal, prefilled with the chosen slot.
  function handleQuickAddConfirm() {
    handleQuickAddOpenForm();
  }

  function handleQuickAddOpenForm() {
    setQuickAdd((s) => ({ ...s, show: false }));
    const dateObj = new Date(quickAdd.date + "T00:00:00");
    onNewAssignment?.({ date: dateObj, time: quickAdd.time });
  }

  // ── Scope view: add assignment prefilled with floor/area/date ──────────────
  function handleScopeAddAssignment(target: AddAssignmentTarget) {
    const dateObj = new Date(target.date + "T00:00:00");
    // JS getDay(): 0=Sun..6=Sat → Monday-first enum index.
    const weekday = DAY_OF_WEEK_VALUES[(dateObj.getDay() + 6) % 7];
    onNewAssignment?.({
      date: dateObj,
      time: "09:00",
      siteId: siteFilter,
      floorId: target.floorId,
      areaId: target.areaId,
      taskName: target.taskName,
      mode: target.mode,
      weekday: target.mode === "DAY_WEEKLY" ? weekday : undefined,
      sourceTask:
        target.sourceAssignmentId && target.sourceTaskId
          ? { assignmentId: target.sourceAssignmentId, taskId: target.sourceTaskId }
          : undefined,
    });
  }

  // ── Scope view: floor/area create / rename / delete ────────────────────────
  function handleFloorSubmit(name: string) {
    if (!floorModal) return;
    if (floorModal.mode === "add") {
      createFloor.mutate(
        { siteId: siteFilter, input: { name } },
        { onSuccess: () => setFloorModal(null) },
      );
    } else if (floorModal.floor) {
      updateFloor.mutate(
        { id: floorModal.floor.id, input: { name } },
        { onSuccess: () => setFloorModal(null) },
      );
    }
  }

  function handleAreaSubmit(name: string) {
    if (!areaModal) return;
    if (areaModal.mode === "add" && areaModal.floor) {
      createArea.mutate(
        { floorId: areaModal.floor.id, input: { name } },
        { onSuccess: () => setAreaModal(null) },
      );
    } else if (areaModal.area) {
      updateArea.mutate(
        { id: areaModal.area.id, input: { name } },
        { onSuccess: () => setAreaModal(null) },
      );
    }
  }

  function handleConfirmDelete() {
    if (!deleteTarget) return;
    if (deleteTarget.kind === "floor") {
      deleteFloor.mutate(deleteTarget.floor.id, { onSuccess: () => setDeleteTarget(null) });
    } else {
      deleteArea.mutate(deleteTarget.area.id, { onSuccess: () => setDeleteTarget(null) });
    }
  }

  const floorMutation = floorModal?.mode === "edit" ? updateFloor : createFloor;
  const areaMutation = areaModal?.mode === "edit" ? updateArea : createArea;
  const deleteMut = deleteTarget?.kind === "floor" ? deleteFloor : deleteArea;
  // Monday of the visible week (weekDates is Monday-first).
  const mondayDate = weekDates[0];

  // Close quick-add on outside click
  useEffect(() => {
    function onDocClick() {
      setQuickAdd((s) => ({ ...s, show: false }));
    }
    if (quickAdd.show) {
      document.addEventListener("click", onDocClick);
    }
    return () => document.removeEventListener("click", onDocClick);
  }, [quickAdd.show]);

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl bg-surface shadow-sm">
      {/* Calendar toolbar */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-grey-200 px-4 py-3">
        {/* Month label — or the week's start–end dates in weekly views */}
        <h3 className="text-base font-bold text-on-surface min-w-[140px]">
          {viewMode === "month" ? monthLabel : formatWeekRangeLabel(weekDates[0]!, weekDates[6]!)}
        </h3>

        {/* Navigation */}
        <div className="flex items-center rounded-xl border border-grey-200 bg-surface p-1">
          <button
            type="button"
            aria-label="Previous"
            onClick={navigatePrev}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-grey-500 transition-colors hover:bg-grey-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <ChevronLeft size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={goToToday}
            className="rounded-lg px-3 py-1 text-xs font-semibold text-on-surface transition-colors hover:bg-grey-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Today
          </button>
          <button
            type="button"
            aria-label="Next"
            onClick={navigateNext}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-grey-500 transition-colors hover:bg-grey-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </div>

        {/* Jump to a date (the containing week/month is shown) */}
        <input
          type="date"
          aria-label="Jump to date"
          value={formatDate(currentDate)}
          onChange={(e) => {
            if (e.target.value) setCurrentDate(new Date(e.target.value + "T00:00:00"));
          }}
          className={cn(TOOLBAR_CONTROL, "hover:border-grey-300")}
        />

        {/* Site selector — hidden when the Operations header supplies its own. */}
        {!siteControlled && (
          <SiteFilterSelect
            sites={sitesQuery.data ?? []}
            value={siteFilter}
            onChange={setSiteFilter}
            loading={sitesQuery.isLoading}
          />
        )}

        {/* Working-day legend (when a site with working days is selected) */}
        {workingDays && (
          <span className="flex items-center gap-1.5 text-xs text-grey-500">
            <span className="inline-block h-3 w-3 rounded-sm bg-grey-100 ring-1 ring-grey-300" aria-hidden="true" />
            non-working day
          </span>
        )}

        {/* View toggles: Week/Month sub-toggle (calendar only) + Calendar/Scope */}
        <div className="ml-auto flex items-center gap-2">
          {mainView === "scope" && (
            <select
              value={taskStatusFilter}
              onChange={(e) => setTaskStatusFilter(e.target.value as typeof taskStatusFilter)}
              aria-label="Task status filter"
              className={TOOLBAR_CONTROL}
            >
              <option value="ACTIVE">Active tasks{statusCounts ? ` (${statusCounts.ACTIVE})` : ""}</option>
              <option value="INACTIVE">Inactive{statusCounts ? ` (${statusCounts.INACTIVE})` : ""}</option>
              <option value="DELETED">Deleted{statusCounts ? ` (${statusCounts.DELETED})` : ""}</option>
              <option value="ALL">All statuses</option>
            </select>
          )}
          {mainView === "scope" && statusCounts && (statusCounts.INACTIVE > 0 || statusCounts.DELETED > 0) && taskStatusFilter === "ACTIVE" && (
            <span className="text-xs text-grey-500" title="Hidden by the Active filter">
              {statusCounts.INACTIVE > 0 && `${statusCounts.INACTIVE} inactive`}
              {statusCounts.INACTIVE > 0 && statusCounts.DELETED > 0 && " · "}
              {statusCounts.DELETED > 0 && `${statusCounts.DELETED} deleted`}
              {" hidden"}
            </span>
          )}
          {mainView === "scope" && (
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
          {mainView === "calendar" && (
            <div className="flex overflow-hidden rounded-xl border border-grey-200">
              <button
                type="button"
                onClick={() => setCalendarMode("week")}
                className={cn(
                  SEGMENT_BTN,
                  calendarMode === "week"
                    ? "bg-primary text-white"
                    : "text-on-surface hover:bg-grey-100",
                )}
              >
                Week
              </button>
              <button
                type="button"
                onClick={() => setCalendarMode("month")}
                className={cn(
                  SEGMENT_BTN,
                  calendarMode === "month"
                    ? "bg-primary text-white"
                    : "text-on-surface hover:bg-grey-100",
                )}
              >
                Month
              </button>
            </div>
          )}
          <div className="flex overflow-hidden rounded-xl border border-grey-200">
            <button
              type="button"
              onClick={() => setMainView("calendar")}
              className={cn(
                SEGMENT_BTN,
                mainView === "calendar"
                  ? "bg-primary text-white"
                  : "text-on-surface hover:bg-grey-100",
              )}
            >
              Calendar
            </button>
            <button
              type="button"
              onClick={() => setMainView("scope")}
              className={cn(
                SEGMENT_BTN,
                mainView === "scope"
                  ? "bg-primary text-white"
                  : "text-on-surface hover:bg-grey-100",
              )}
            >
              Scope View
            </button>
          </div>
        </div>
      </div>

      {/* Calendar body */}
      {viewMode === "schedule" ? (
        <WeekScheduleGrid
          weekDates={weekDates}
          occurrences={dayScope ? dayOccurrencesQuery.data ?? [] : serverOccurrences ?? []}
          today={today}
          workingDays={workingDays}
          dayView={scopeView === "day"}
          holidays={holidays}
          isLoading={
            siteTasksQuery.isLoading ||
            (dayScope ? dayOccurrencesQuery.isLoading : occurrencesQuery.isLoading)
          }
          onOccurrenceClick={(occurrence) => setInfoOccurrence(occurrence)}
          siteId={managing ? siteFilter : undefined}
          floors={managing ? floors : undefined}
          siteTasks={managing ? siteTasksQuery.data ?? [] : undefined}
          areasByFloor={managing ? areasByFloor : undefined}
          mondayDate={mondayDate}
          structureLoading={managing && (floorsQuery.isLoading || allAreasQuery.isLoading)}
          canReorderFloors={canReorderFloors}
          onReorderFloors={handleReorderFloors}
          canReorderAreas={canReorderAreas}
          onReorderAreas={handleReorderAreas}
          canReorderTasks={canReorderTasks}
          onReorderTasks={handleReorderTasks}
          onAddAssignment={handleScopeAddAssignment}
          onToggleTaskStatus={(taskId, status) =>
            setPendingToggle({
              taskId,
              status,
              name: siteTasksQuery.data?.find((t) => t.taskId === taskId)?.name ?? "this task",
            })
          }
          onRestoreTask={(taskId) =>
            setPendingRestore({
              taskId,
              name: siteTasksQuery.data?.find((t) => t.taskId === taskId)?.name ?? "this task",
            })
          }
          onAddFloor={() => setFloorModal({ mode: "add" })}
          onEditFloor={(floor) => setFloorModal({ mode: "edit", floor })}
          onDeleteFloor={(floor) => setDeleteTarget({ kind: "floor", floor })}
          onAddArea={(floor) => setAreaModal({ mode: "add", floor })}
          onEditArea={(area) => setAreaModal({ mode: "edit", area })}
          onDeleteArea={(area) => setDeleteTarget({ kind: "area", area })}
        />
      ) : viewMode === "week" ? (
        <WeekTypeView
          weekDates={weekDates}
          events={events}
          today={today}
          workingDays={workingDays}
          holidays={holidays}
          generalStartMin={generalStartMin}
          generalEndMin={generalEndMin}
          onSlotClick={handleSlotClick}
          onTypeClick={(group, date) =>
            setTypeDetail({
              type: group.type,
              hex: group.hex,
              date,
              occurrences: group.events.map((e) => e.raw).filter(Boolean) as TaskOccurrence[],
            })
          }
        />
      ) : (
        <MonthView
          year={currentYear}
          month={currentMonth}
          events={events}
          today={today}
          workingDays={workingDays}
          holidays={holidays}
          onDayClick={(date, x, y) => handleSlotClick(date, "09:00", x, y)}
          onTypeClick={(group, date) =>
            setTypeDetail({
              type: group.type,
              hex: group.hex,
              date,
              occurrences: group.events.map((e) => e.raw).filter(Boolean) as TaskOccurrence[],
            })
          }
        />
      )}

      {/* Work-type day details (from a calendar rectangle) */}
      {typeDetail && (
        <TypeDetailsModal
          type={typeDetail.type}
          date={typeDetail.date}
          hex={typeDetail.hex}
          occurrences={typeDetail.occurrences}
          onClose={() => setTypeDetail(null)}
        />
      )}

      {/* Quick add popover */}
      {quickAdd.show && (
        <QuickAddPopover
          state={quickAdd}
          onConfirm={handleQuickAddConfirm}
          onOpenForm={handleQuickAddOpenForm}
          onClose={() => setQuickAdd((s) => ({ ...s, show: false }))}
        />
      )}

      {/* Event detail / edit modal */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onSave={handleEventUpdate}
          onDelete={handleDeleteEvent}
          onEditDetails={(occurrence) => {
            setSelectedEvent(null);
            setEditOccurrence(occurrence);
          }}
        />
      )}

      {/* Full prefilled task editor (profiles / supervisors / items) with scope */}
      {editOccurrence && (
        <EditOccurrenceModal occurrence={editOccurrence} onClose={() => setEditOccurrence(null)} />
      )}

      {/* Scope-view: brief task info with an entry into the full editor */}
      {infoOccurrence && (
        <TaskInfoModal
          occurrence={infoOccurrence}
          onClose={() => setInfoOccurrence(null)}
          onEditTask={(assignment) => {
            setEditTaskId(infoOccurrence?.taskId ?? null);
            setInfoOccurrence(null);
            setEditAssignment(assignment);
          }}
        />
      )}

      {/* Full New Assignment window, prefilled, updating the assignment in place */}
      {editAssignment && (
        <NewAssignmentModal
          open
          editAssignmentId={editAssignment.id}
          editData={assignmentToFormInput(editAssignment)}
          editTaskId={editTaskId ?? undefined}
          onClose={() => {
            setEditAssignment(null);
            setEditTaskId(null);
          }}
          onCreated={() => {
            setEditAssignment(null);
            setEditTaskId(null);
          }}
        />
      )}

      {/* Scope dialog (recurring events) */}
      {scopeDialog && (
        <OccurrenceScopeDialog
          state={scopeDialog}
          isPending={editMutation.isPending || deleteMutation.isPending}
          onSelect={handleScopeSelect}
          onCancel={handleScopeCancel}
        />
      )}

      {/* Floor add / rename */}
      <NameFormModal
        open={!!floorModal}
        title={floorModal?.mode === "edit" ? "Rename floor" : "Add floor"}
        description={
          floorModal?.mode === "edit"
            ? undefined
            : selectedSite
              ? `New floor for ${selectedSite.name}.`
              : undefined
        }
        label="Floor name"
        initialValue={floorModal?.mode === "edit" ? floorModal.floor?.name : ""}
        submitLabel={floorModal?.mode === "edit" ? "Save changes" : "Add floor"}
        isPending={floorMutation.isPending}
        error={floorMutation.isError ? getErrorMessage(floorMutation.error) : undefined}
        onSubmit={handleFloorSubmit}
        onClose={() => {
          setFloorModal(null);
          createFloor.reset();
          updateFloor.reset();
        }}
      />

      {/* Area add / rename */}
      <NameFormModal
        open={!!areaModal}
        title={areaModal?.mode === "edit" ? "Rename area" : "Add area"}
        description={
          areaModal?.mode === "add" && areaModal.floor
            ? `New area on ${areaModal.floor.name}.`
            : undefined
        }
        label="Area name"
        initialValue={areaModal?.mode === "edit" ? areaModal.area?.name : ""}
        submitLabel={areaModal?.mode === "edit" ? "Save changes" : "Add area"}
        isPending={areaMutation.isPending}
        error={areaMutation.isError ? getErrorMessage(areaMutation.error) : undefined}
        onSubmit={handleAreaSubmit}
        onClose={() => {
          setAreaModal(null);
          createArea.reset();
          updateArea.reset();
        }}
      />

      {/* Floor / area delete */}
      <ConfirmDialog
        open={!!deleteTarget}
        title={deleteTarget?.kind === "floor" ? "Delete floor" : "Delete area"}
        description={
          deleteTarget?.kind === "floor"
            ? `Delete “${deleteTarget.floor.name}”? Its areas and assignments must be removed first.`
            : deleteTarget?.kind === "area"
              ? `Delete “${deleteTarget.area.name}”? Its assignments must be removed first.`
              : ""
        }
        isPending={deleteMut.isPending}
        error={deleteMut.isError ? getErrorMessage(deleteMut.error) : undefined}
        onConfirm={handleConfirmDelete}
        onClose={() => {
          setDeleteTarget(null);
          deleteFloor.reset();
          deleteArea.reset();
        }}
      />

      {/* Task activate / deactivate */}
      <ConfirmDialog
        open={!!pendingToggle}
        title={pendingToggle?.status === "ACTIVE" ? "Activate task" : "Deactivate task (all future dates)"}
        description={
          pendingToggle?.status === "ACTIVE"
            ? `Activate “${pendingToggle.name}”? It will appear again in upcoming schedules for cleaners and supervisors.`
            : pendingToggle?.status === "INACTIVE"
              ? `Deactivate “${pendingToggle.name}” for all future dates? It will be hidden from upcoming schedules for cleaners and supervisors; existing history is kept. To cancel a single day instead, use the occurrence’s skip/move action.${
                  toggleUpcoming.length
                    ? ` Upcoming dates that will be removed: ${toggleUpcoming
                        .map((d) => new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" }))
                        .join(", ")}${toggleUpcoming.length >= 3 ? "…" : ""}.`
                    : ""
                }`
              : ""
        }
        confirmLabel={pendingToggle?.status === "ACTIVE" ? "Activate" : "Deactivate"}
        isPending={setTaskStatusMutation.isPending}
        error={setTaskStatusMutation.isError ? getErrorMessage(setTaskStatusMutation.error) : undefined}
        onConfirm={() => {
          if (!pendingToggle) return;
          setTaskStatusMutation.mutate(
            { taskId: pendingToggle.taskId, status: pendingToggle.status },
            { onSuccess: () => setPendingToggle(null) },
          );
        }}
        onClose={() => {
          setPendingToggle(null);
          setTaskStatusMutation.reset();
        }}
      />

      {/* Task restore (from deleted) */}
      <ConfirmDialog
        open={!!pendingRestore}
        title="Restore task"
        description={
          pendingRestore
            ? `Restore “${pendingRestore.name}”? It will become active again and reappear in upcoming schedules for cleaners and supervisors.`
            : ""
        }
        confirmLabel="Restore"
        isPending={restoreTaskMutation.isPending}
        error={restoreTaskMutation.isError ? getErrorMessage(restoreTaskMutation.error) : undefined}
        onConfirm={() => {
          if (!pendingRestore) return;
          restoreTaskMutation.mutate(pendingRestore.taskId, {
            onSuccess: () => setPendingRestore(null),
          });
        }}
        onClose={() => {
          setPendingRestore(null);
          restoreTaskMutation.reset();
        }}
      />
    </div>
  );
}

function hexFromColorClass(colorClass: string): string | undefined {
  return EVENT_COLORS.find((c) => c.color === colorClass)?.hex;
}
