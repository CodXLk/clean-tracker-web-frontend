"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight, X, Pencil, Trash2, Clock, Calendar } from "lucide-react";
import { cn } from "@/lib/utils/cn";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CalendarEvent {
  id: string;
  title: string;
  subtitle: string;
  startTime: string;
  endTime: string;
  date: string;
  color: string;
  textColor: string;
}

interface WorkforceCalendarProps {
  onNewAssignment?: (date: Date, time: string) => void;
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

function buildInitialEvents(): CalendarEvent[] {
  const today = new Date();
  const weekStart = getWeekStart(today);

  const sun = formatDate(new Date(weekStart));
  const mon = formatDate(new Date(weekStart.getTime() + 86400000));
  const tue = formatDate(new Date(weekStart.getTime() + 86400000 * 2));

  return [
    { id: "1", title: "Jane Doe",     subtitle: "Floor 3",    startTime: "08:00", endTime: "10:00", date: sun, color: "bg-[#0B585A]",  textColor: "text-white" },
    { id: "2", title: "Maria Garcia", subtitle: "Conference", startTime: "09:00", endTime: "10:30", date: tue, color: "bg-pink-500",   textColor: "text-white" },
    { id: "3", title: "John Smith",   subtitle: "Lobby",      startTime: "10:00", endTime: "13:00", date: mon, color: "bg-purple-500", textColor: "text-white" },
  ];
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
  const [subtitle, setSubtitle] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [colorIdx, setColorIdx] = useState(0);

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setSubtitle(event.subtitle);
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
      title:     title.trim() || event.title,
      subtitle,
      date,
      startTime,
      endTime,
      color:     chosen.color,
      textColor: chosen.textColor,
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

          {/* Subtitle / Notes */}
          {editing ? (
            <div className="mt-2">
              <label className="mb-1 block text-xs font-medium text-grey-500">Notes</label>
              <textarea
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                rows={2}
                placeholder="Add notes…"
                className="w-full resize-none rounded-lg border border-grey-300 px-3 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
          ) : (
            event.subtitle && (
              <p className="mt-1 text-sm text-grey-500">{event.subtitle}</p>
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

interface WeekViewProps {
  weekDates: string[];
  events: CalendarEvent[];
  today: string;
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
    return events.filter((e) => e.date === date);
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
          return (
            <div
              key={dateStr}
              className={cn(
                "flex flex-1 flex-col items-center py-3 text-center",
                isToday && "bg-primary/5",
              )}
            >
              <span className={cn("text-xs font-medium", isToday ? "text-primary" : "text-grey-500")}>
                {day}
              </span>
              <span
                className={cn(
                  "mt-1 flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold",
                  isToday ? "bg-primary text-white" : "text-on-surface",
                )}
              >
                {date}
              </span>
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
              const dayEvents = getEventsForDay(dateStr);
              return (
                <div
                  key={dateStr}
                  className={cn(
                    "relative flex-1 border-r border-grey-200 last:border-r-0",
                    isToday && "bg-primary/[0.02]",
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

                  {/* Events */}
                  {dayEvents.map((ev) => {
                    const startMins = timeToMinutes(ev.startTime);
                    const endMins = timeToMinutes(ev.endTime);
                    const top = (startMins - START_HOUR * 60) * (SLOT_HEIGHT / 60);
                    const height = (endMins - startMins) * (SLOT_HEIGHT / 60);

                    return (
                      <div
                        key={ev.id}
                        draggable
                        onDragStart={(e) => onDragStart(e, ev)}
                        className={cn(
                          "group absolute rounded-lg p-2 cursor-pointer transition-opacity select-none",
                          ev.color,
                          ev.textColor,
                          draggingId === ev.id && "opacity-40",
                        )}
                        style={{
                          top: `${top}px`,
                          height: `${Math.max(height, 24)}px`,
                          left: "3px",
                          right: "3px",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick(ev);
                        }}
                        title={`${ev.title} — ${formatTimeDisplay(ev.startTime)} to ${formatTimeDisplay(ev.endTime)}`}
                      >
                        <p className="text-xs font-semibold leading-tight truncate">{ev.title}</p>
                        {height > 40 && (
                          <p className="text-xs opacity-80 truncate">{ev.subtitle}</p>
                        )}
                        {height > 56 && (
                          <p className="text-xs opacity-70 mt-0.5">
                            {formatTimeDisplay(ev.startTime)} – {formatTimeDisplay(ev.endTime)}
                          </p>
                        )}
                        {/* Quick delete button */}
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
                        {/* Resize handle */}
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
  onDayClick: (date: string, x: number, y: number) => void;
  onEventClick: (event: CalendarEvent) => void;
}

function MonthView({ year, month, events, today, onDayClick, onEventClick }: MonthViewProps) {
  const weeks = getMonthWeeks(year, month);

  function getEventsForDay(date: string): CalendarEvent[] {
    return events.filter((e) => e.date === date);
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
            const dayEvents = getEventsForDay(dateStr);
            const visibleEvents = dayEvents.slice(0, 3);
            const overflowCount = dayEvents.length - 3;

            return (
              <div
                key={dateStr}
                className={cn(
                  "min-h-[100px] cursor-pointer border-r border-grey-200 p-1 last:border-r-0 transition-colors hover:bg-grey-100/50",
                  !isCurrentMonth && "bg-grey-100/30",
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
                      !isToday && isCurrentMonth && "text-on-surface",
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
                        onEventClick(ev);
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
  const [viewMode, setViewMode] = useState<"week" | "month">("week");
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>(buildInitialEvents);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [quickAdd, setQuickAdd] = useState<QuickAddState>({
    show: false, date: "", time: "", x: 0, y: 0,
  });
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const nextEventColorRef = useRef(0);

  const weekStart    = getWeekStart(currentDate);
  const weekDates    = getDayDates(weekStart);
  const currentMonth = currentDate.getMonth();
  const currentYear  = currentDate.getFullYear();

  const monthLabel = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year:  "numeric",
  });

  function navigatePrev() {
    const d = new Date(currentDate);
    if (viewMode === "week") d.setDate(d.getDate() - 7);
    else d.setMonth(d.getMonth() - 1);
    setCurrentDate(d);
  }

  function navigateNext() {
    const d = new Date(currentDate);
    if (viewMode === "week") d.setDate(d.getDate() + 7);
    else d.setMonth(d.getMonth() + 1);
    setCurrentDate(d);
  }

  function goToToday() {
    setCurrentDate(new Date());
  }

  // Drag handlers
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
    if (!ev) { setDraggingId(null); return; }
    const duration = timeDiff(ev.startTime, ev.endTime);
    const newEnd = addMinutes(slotTime, duration);
    setEvents((prev) =>
      prev.map((x) =>
        x.id === eventId ? { ...x, date, startTime: slotTime, endTime: newEnd } : x,
      ),
    );
    setDraggingId(null);
  }

  // Resize handlers
  const handleResizeStart = useCallback(
    (e: React.MouseEvent, event: CalendarEvent) => {
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
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [],
  );

  function handleDeleteEvent(id: string) {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    if (selectedEvent?.id === id) setSelectedEvent(null);
  }

  function handleEventClick(event: CalendarEvent) {
    setQuickAdd((s) => ({ ...s, show: false }));
    setSelectedEvent(event);
  }

  function handleEventUpdate(updated: CalendarEvent) {
    setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    setSelectedEvent(null);
  }

  function handleSlotClick(date: string, time: string, x: number, y: number) {
    setSelectedEvent(null);
    setQuickAdd({ show: true, date, time, x, y });
  }

  function handleQuickAddConfirm(title: string) {
    const colorEntry = EVENT_COLORS[nextEventColorRef.current % EVENT_COLORS.length]!;
    nextEventColorRef.current++;
    const newEvent: CalendarEvent = {
      id:        `event-${Date.now()}`,
      title,
      subtitle:  "",
      startTime: quickAdd.time,
      endTime:   addMinutes(quickAdd.time, 60),
      date:      quickAdd.date,
      color:     colorEntry.color,
      textColor: colorEntry.textColor,
    };
    setEvents((prev) => [...prev, newEvent]);
    setQuickAdd((s) => ({ ...s, show: false }));
  }

  function handleQuickAddOpenForm() {
    setQuickAdd((s) => ({ ...s, show: false }));
    const dateObj = new Date(quickAdd.date + "T00:00:00");
    onNewAssignment?.(dateObj, quickAdd.time);
  }

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
      {/* Calendar toolbar — matches Figma layout */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-grey-200 px-4 py-3">
        {/* Month / Year label */}
        <h3 className="text-base font-bold text-on-surface min-w-[140px]">
          {monthLabel}
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

        {/* View toggle */}
        <div className="ml-auto flex overflow-hidden rounded-xl border border-grey-200">
          <button
            type="button"
            onClick={() => setViewMode("week")}
            className={cn(
              "px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              viewMode === "week"
                ? "bg-primary text-white"
                : "text-on-surface hover:bg-grey-100",
            )}
          >
            Week
          </button>
          <button
            type="button"
            onClick={() => setViewMode("month")}
            className={cn(
              "px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              viewMode === "month"
                ? "bg-primary text-white"
                : "text-on-surface hover:bg-grey-100",
            )}
          >
            Month
          </button>
        </div>
      </div>

      {/* Calendar body */}
      {viewMode === "week" ? (
        <WeekView
          weekDates={weekDates}
          events={events}
          today={today}
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
    </div>
  );
}
