"use client";

import { useMemo, useState } from "react";
import { CalendarDays, MapPin, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useMyTasks } from "@/features/tasks/hooks/useTasks";
import { useMySites } from "@/features/attendance/hooks/useAttendance";
import {
  toLocalDateString,
  formatTaskTime,
  assignmentTypeColor,
  assignmentTypeLabel,
} from "@/features/tasks/lib/task-utils";
import type { TaskOccurrence, TaskStatus } from "@/features/tasks/schemas/task.schema";

interface CalendarModalProps {
  open: boolean;
  onClose: () => void;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const STATUS_LABEL: Record<TaskStatus, string> = {
  SCHEDULED: "Scheduled",
  ACTIVE: "Active",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const STATUS_CHIP: Record<TaskStatus, string> = {
  SCHEDULED: "bg-[#ED5F25]/15 text-[#ED5F25]",
  ACTIVE: "bg-[#ED5F25]/15 text-[#ED5F25]",
  IN_PROGRESS: "bg-primary/15 text-primary",
  COMPLETED: "bg-success/15 text-success",
  CANCELLED: "bg-grey-200 text-grey-600",
};

/** Sunday-based start of the week containing the given date. */
function startOfWeek(iso: string): Date {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

interface AreaGroup {
  areaName: string;
  tasks: TaskOccurrence[];
}
interface FloorGroup {
  floorName: string;
  areas: AreaGroup[];
}

function groupByFloorArea(tasks: TaskOccurrence[]): FloorGroup[] {
  const floors = new Map<string, Map<string, TaskOccurrence[]>>();
  for (const t of tasks) {
    const floorName = t.floorName ?? "General";
    const areaName = t.areaName ?? "—";
    if (!floors.has(floorName)) floors.set(floorName, new Map());
    const areas = floors.get(floorName)!;
    if (!areas.has(areaName)) areas.set(areaName, []);
    areas.get(areaName)!.push(t);
  }
  return Array.from(floors, ([floorName, areas]) => ({
    floorName,
    areas: Array.from(areas, ([areaName, list]) => ({ areaName, tasks: list })),
  }));
}

export function CalendarModal({ open, onClose }: CalendarModalProps) {
  if (!open) return null;
  return <CalendarContent onClose={onClose} />;
}

function CalendarContent({ onClose }: { onClose: () => void }) {
  const today = useMemo(() => toLocalDateString(new Date()), []);
  const [selectedDate, setSelectedDate] = useState(today);
  const [activeSiteId, setActiveSiteId] = useState<string>("");

  const { data: sites = [] } = useMySites();

  // The Sunday→Saturday week that contains the selected date.
  const weekStart = useMemo(() => startOfWeek(selectedDate), [selectedDate]);
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return {
        iso: toLocalDateString(d),
        dayName: DAY_NAMES[d.getDay()],
        date: d.getDate(),
        month: MONTH_NAMES[d.getMonth()],
      };
    });
  }, [weekStart]);
  const weekFrom = weekDays[0].iso;
  const weekTo = weekDays[6].iso;

  const { data: occurrences = [], isLoading } = useMyTasks(
    weekFrom,
    weekTo,
    activeSiteId || undefined,
  );

  // Dates in this week that have at least one task (for the day-pill dot).
  const daysWithTasks = useMemo(() => {
    const set = new Set<string>();
    for (const o of occurrences) set.add(o.date);
    return set;
  }, [occurrences]);

  const floorGroups = useMemo(
    () => groupByFloorArea(occurrences.filter((o) => o.date === selectedDate)),
    [occurrences, selectedDate],
  );

  const selectedLabel = useMemo(() => {
    const d = new Date(`${selectedDate}T00:00:00`);
    return `${DAY_NAMES[d.getDay()]}, ${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`;
  }, [selectedDate]);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} aria-hidden="true" />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Calendar"
        className={cn(
          "fixed z-50 bg-white p-6",
          "inset-x-0 bottom-0 rounded-t-3xl max-h-[88vh] overflow-y-auto",
          "lg:inset-0 lg:bottom-auto lg:left-1/2 lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:w-full lg:max-w-2xl lg:rounded-3xl lg:shadow-2xl",
        )}
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-on-surface">Calendar</h2>
            <CalendarDays size={20} className="text-primary" />
          </div>
          <button
            onClick={onClose}
            aria-label="Close calendar"
            className="rounded-full p-0.5 text-danger transition-colors hover:bg-danger/10"
          >
            <X size={20} strokeWidth={2} />
          </button>
        </div>

        {/* Filters: date + site */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <label className="flex flex-1 items-center gap-2 rounded-xl border border-grey-300 px-3 py-2 text-sm">
            <CalendarDays size={16} className="text-grey-500" aria-hidden="true" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value || today)}
              className="w-full bg-transparent text-on-surface outline-none"
              aria-label="Pick a date"
            />
          </label>
          <label className="flex flex-1 items-center gap-2 rounded-xl border border-grey-300 px-3 py-2 text-sm">
            <MapPin size={16} className="text-grey-500" aria-hidden="true" />
            <select
              value={activeSiteId}
              onChange={(e) => setActiveSiteId(e.target.value)}
              className="w-full bg-transparent text-on-surface outline-none"
              aria-label="Filter by site"
            >
              <option value="">All sites</option>
              {sites.map((s) => (
                <option key={s.siteId} value={s.siteId}>
                  {s.siteName}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Week strip */}
        <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
          {weekDays.map((day) => {
            const isSelected = day.iso === selectedDate;
            const isToday = day.iso === today;
            const hasTasks = daysWithTasks.has(day.iso);
            return (
              <button
                key={day.iso}
                onClick={() => setSelectedDate(day.iso)}
                aria-pressed={isSelected}
                className={cn(
                  "relative flex shrink-0 flex-col items-center gap-0.5 rounded-[20px] px-3 py-2 text-xs transition-colors",
                  isSelected
                    ? "bg-primary text-white"
                    : "border border-primary/40 text-on-surface hover:bg-primary/10",
                )}
              >
                <span className="font-medium">{isToday ? "Today" : day.dayName}</span>
                <span className="text-sm font-bold">{day.date}</span>
                <span className="text-[10px] opacity-80">{day.month}</span>
                {hasTasks && (
                  <span
                    className={cn(
                      "absolute right-2 top-1.5 h-1.5 w-1.5 rounded-full",
                      isSelected ? "bg-white" : "bg-[#ED5F25]",
                    )}
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </div>

        <p className="mb-3 text-sm font-medium text-grey-700">{selectedLabel}</p>

        {/* Floors → areas → tasks */}
        {isLoading ? (
          <div className="flex justify-center py-10">
            <LoadingSpinner />
          </div>
        ) : floorGroups.length === 0 ? (
          <p className="py-8 text-center text-sm text-grey-500">No tasks scheduled for this day.</p>
        ) : (
          <div className="flex flex-col gap-5">
            {floorGroups.map((floor) => (
              <section key={floor.floorName} className="flex flex-col gap-3">
                <h3 className="text-sm font-semibold text-on-surface">{floor.floorName}</h3>
                {floor.areas.map((area) => (
                  <div key={area.areaName} className="rounded-2xl bg-grey-50 p-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-grey-500">
                      {area.areaName}
                    </p>
                    <div className="flex flex-col gap-2">
                      {area.tasks.map((task) => (
                        <CalendarTaskRow
                          key={task.redoId ?? `${task.taskId}-${task.occurrenceDate}`}
                          task={task}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </section>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function CalendarTaskRow({ task }: { task: TaskOccurrence }) {
  const accent = assignmentTypeColor(task.assignmentType);
  const time = formatTaskTime(task.startTime);
  const endTime = formatTaskTime(task.endTime);
  const timeLabel = time && endTime ? `${time} – ${endTime}` : time ?? "All day";

  return (
    <div
      className="flex items-start gap-3 rounded-xl border-l-4 bg-white p-3 shadow-sm"
      style={{ borderLeftColor: accent }}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-on-surface">{task.name}</span>
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
            style={{ color: accent, backgroundColor: `${accent}1A` }}
          >
            {assignmentTypeLabel(task.assignmentType ?? "OTHER")}
          </span>
        </div>
        <span className="text-xs text-grey-500">{timeLabel}</span>
        {task.description && <span className="text-xs text-grey-600">{task.description}</span>}
      </div>
      <span
        className={cn(
          "shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium",
          STATUS_CHIP[task.status],
        )}
      >
        {STATUS_LABEL[task.status]}
      </span>
    </div>
  );
}
