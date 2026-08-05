"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, X, Pencil, Trash2, Clock, Calendar, Repeat } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  useOccurrences,
  useEditOccurrence,
  useDeleteOccurrence,
  type OccurrenceQuery,
  type EditOccurrenceInput,
} from "@/features/workforce/hooks/useAssignments";
import { useSites } from "@/features/user-management/hooks/useSites";
import { useFloors, useCreateFloor, useUpdateFloor, useDeleteFloor } from "@/features/user-management/hooks/useFloors";
import { useAreas, useCreateArea, useUpdateArea, useDeleteArea } from "@/features/user-management/hooks/useAreas";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import { WeekScheduleGrid, type AddAssignmentTarget } from "@/components/admin/WeekScheduleGrid";
import { NameFormModal } from "@/components/admin/NameFormModal";
import { SiteFilterSelect } from "@/components/admin/SiteFilterSelect";
import { ConfirmDialog } from "@/features/user-management/components/ConfirmDialog";
import type { TaskOccurrence, OccurrenceScope } from "@/features/workforce/schemas/assignment.schema";
import { WORK_TYPE_LABELS, type WorkType } from "@/features/workforce/schemas/assignment.schema";
import type { DayOfWeek } from "@/features/user-management/schemas/site.schema";
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
}

/** Prefill for the New Assignment modal, opened from a calendar slot or a scope cell. */
export interface AssignmentPrefill {
  date?: Date;
  time?: string;
  siteId?: string;
  floorId?: string;
  areaId?: string;
}

interface WorkforceCalendarProps {
  onNewAssignment?: (prefill: AssignmentPrefill) => void;
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
  d.setDate(d.getDate() - day);
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
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => i + START_HOUR);
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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
  GENERAL_TASK: "#0B585A",
  PERIODICAL_TASK: "#A855F7",
  WORK_ORDER: "#F97316",
  OTHER: "#3B82F6",
};

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
          <Repeat size={16} className="shrink-0 text-primary" aria-hidden="true" />
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
}

function EventDetailModal({ event, onClose, onSave, onDelete }: EventDetailModalProps) {
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
                onClick={() => setEditing(true)}
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
                onClick={() => setEditing(true)}
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
              <span className={cn("text-xs font-medium", isToday ? "text-primary" : "text-grey-500")}>
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
  onDayClick: (date: string, x: number, y: number) => void;
  onEventClick: (event: CalendarEvent) => void;
}

function MonthView({ year, month, events, today, workingDays, onDayClick, onEventClick }: MonthViewProps) {
  const weeks = getMonthWeeks(year, month);

  function getEventsForDay(date: string): CalendarEvent[] {
    return groupDayEvents(events.filter((e) => e.date === date));
  }

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
            const dayEvents = getEventsForDay(dateStr);
            const visibleEvents = dayEvents.slice(0, 3);
            const overflowCount = dayEvents.length - 3;

            return (
              <div
                key={dateStr}
                className={cn(
                  "min-h-[100px] cursor-pointer border-r border-grey-200 p-1 last:border-r-0 transition-colors hover:bg-grey-100/50",
                  !isCurrentMonth && "bg-grey-100/30",
                  isCurrentMonth && !working && "bg-grey-100/60",
                )}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  onDayClick(dateStr, rect.left + rect.width / 2, rect.top);
                }}
              >
                <div className="flex justify-center">
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
                </div>

                {/* Event pills */}
                <div className="mt-1 flex flex-col gap-0.5">
                  {visibleEvents.map((ev) => (
                    <button
                      key={ev.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(ev.members?.[0] ?? ev);
                      }}
                      className={cn(
                        "w-full truncate rounded px-1.5 py-0.5 text-left text-xs font-medium transition-opacity hover:opacity-80",
                        ev.color,
                        ev.textColor,
                      )}
                      title={ev.title}
                    >
                      {ev.title}
                    </button>
                  ))}
                  {overflowCount > 0 && (
                    <span className="text-xs text-grey-400 pl-1">+{overflowCount} more</span>
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

export function WorkforceCalendar({ onNewAssignment }: WorkforceCalendarProps) {
  const today = formatDate(new Date());
  // Main toggle: the table-like weekly scope view (default) vs the time-grid calendar.
  const [mainView, setMainView] = useState<"calendar" | "scope">("scope");
  const [calendarMode, setCalendarMode] = useState<"week" | "month">("week");
  const viewMode: "week" | "month" | "schedule" =
    mainView === "scope" ? "schedule" : calendarMode;
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [siteFilter, setSiteFilter] = useState<string>(""); // "" = all sites
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [quickAdd, setQuickAdd] = useState<QuickAddState>({
    show: false, date: "", time: "", x: 0, y: 0,
  });
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
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
  if (sites && sites.length > 0 && !sites.some((s) => s.id === siteFilter)) {
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

  const floors = useMemo(
    () => (floorsQuery.data ?? []).slice().sort((a, b) => a.name.localeCompare(b.name)),
    [floorsQuery.data],
  );
  const areasByFloor = useMemo(() => {
    const map = new Map<string, Area[]>();
    for (const floor of floors) map.set(floor.id, []);
    for (const area of allAreasQuery.data ?? []) {
      if (map.has(area.floorId)) map.get(area.floorId)!.push(area);
    }
    for (const list of map.values()) list.sort((a, b) => a.name.localeCompare(b.name));
    return map;
  }, [floors, allAreasQuery.data]);

  const createFloor = useCreateFloor();
  const updateFloor = useUpdateFloor();
  const deleteFloor = useDeleteFloor();
  const createArea = useCreateArea();
  const updateArea = useUpdateArea();
  const deleteArea = useDeleteArea();

  // Visible date range → drives the backend fetch. The schedule grid is weekly too.
  const range = useMemo<OccurrenceQuery>(() => {
    if (viewMode === "week" || viewMode === "schedule") {
      return { from: weekDates[0]!, to: weekDates[6]!, siteId: siteFilter || undefined };
    }
    const weeks = getMonthWeeks(currentYear, currentMonth);
    return {
      from: weeks[0]![0]!,
      to: weeks[weeks.length - 1]![6]!,
      siteId: siteFilter || undefined,
    };
  }, [viewMode, weekDates, currentYear, currentMonth, siteFilter]);

  const occurrencesQuery = useOccurrences(range);
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
    onNewAssignment?.({
      date: new Date(target.date + "T00:00:00"),
      time: "09:00",
      siteId: siteFilter,
      floorId: target.floorId,
      areaId: target.areaId,
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
  // Monday of the visible week (weekDates is Sunday-first).
  const mondayDate = weekDates[1];

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
        <div className="flex items-center gap-1">
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
            className="rounded-lg border border-grey-200 px-3 py-1 text-xs font-medium text-on-surface transition-colors hover:bg-grey-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
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
          className="rounded-lg border border-grey-200 bg-surface px-2.5 py-1 text-xs font-medium text-on-surface outline-none transition-colors hover:bg-grey-100 focus-visible:ring-2 focus-visible:ring-primary"
        />

        {/* Site selector — exactly one site is always in view */}
        <SiteFilterSelect
          sites={sitesQuery.data ?? []}
          value={siteFilter}
          onChange={setSiteFilter}
          loading={sitesQuery.isLoading}
        />

        {/* Working-day legend (when a site with working days is selected) */}
        {workingDays && (
          <span className="flex items-center gap-1.5 text-xs text-grey-500">
            <span className="inline-block h-3 w-3 rounded-sm bg-grey-100 ring-1 ring-grey-300" aria-hidden="true" />
            non-working day
          </span>
        )}

        {/* View toggles: Week/Month sub-toggle (calendar only) + Calendar/Scope */}
        <div className="ml-auto flex items-center gap-2">
          {mainView === "calendar" && (
            <div className="flex overflow-hidden rounded-xl border border-grey-200">
              <button
                type="button"
                onClick={() => setCalendarMode("week")}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
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
                  "px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
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
                "px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
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
                "px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
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
          occurrences={serverOccurrences ?? []}
          today={today}
          workingDays={workingDays}
          isLoading={occurrencesQuery.isLoading}
          onOccurrenceClick={(occurrence) => handleEventClick(mapOccurrenceToEvent(occurrence))}
          siteId={managing ? siteFilter : undefined}
          floors={managing ? floors : undefined}
          areasByFloor={managing ? areasByFloor : undefined}
          mondayDate={mondayDate}
          structureLoading={managing && (floorsQuery.isLoading || allAreasQuery.isLoading)}
          onAddAssignment={handleScopeAddAssignment}
          onAddFloor={() => setFloorModal({ mode: "add" })}
          onEditFloor={(floor) => setFloorModal({ mode: "edit", floor })}
          onDeleteFloor={(floor) => setDeleteTarget({ kind: "floor", floor })}
          onAddArea={(floor) => setAreaModal({ mode: "add", floor })}
          onEditArea={(area) => setAreaModal({ mode: "edit", area })}
          onDeleteArea={(area) => setDeleteTarget({ kind: "area", area })}
        />
      ) : viewMode === "week" ? (
        <WeekView
          weekDates={weekDates}
          events={events}
          today={today}
          workingDays={workingDays}
          onSlotClick={handleSlotClick}
          onEventClick={handleEventClick}
          onDeleteEvent={handleDeleteEvent}
          onDragStart={handleEventDragStart}
          onDrop={handleSlotDrop}
          onDragOver={handleDragOver}
          onResizeStart={handleResizeStart}
          draggingId={draggingId}
        />
      ) : (
        <MonthView
          year={currentYear}
          month={currentMonth}
          events={events}
          today={today}
          workingDays={workingDays}
          onDayClick={(date, x, y) => handleSlotClick(date, "09:00", x, y)}
          onEventClick={handleEventClick}
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
    </div>
  );
}

function hexFromColorClass(colorClass: string): string | undefined {
  return EVENT_COLORS.find((c) => c.color === colorClass)?.hex;
}
