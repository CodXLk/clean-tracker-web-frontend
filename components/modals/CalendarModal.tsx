"use client";

import { useState } from "react";
import { CalendarDays, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { FilterTabs } from "@/components/shared/FilterTabs";
import { TaskSummaryCard } from "@/components/shared/TaskSummaryCard";
import type { Priority } from "@/components/shared/PriorityBadge";
import { getTaskCategoryIcon } from "@/lib/utils/taskCategoryIcon";

interface CalendarModalProps {
  open:     boolean;
  onClose:  () => void;
}

interface DayPill {
  dayName:  string;
  date:     number;
  month:    string;
  isoDate:  string;
}

type SiteTab = "Site A" | "Site B" | "Site C" | "Site D";

const SITE_TABS: SiteTab[] = ["Site A", "Site B", "Site C", "Site D"];

interface CalendarTask {
  id:       string;
  location: string;
  priority: Priority;
  category: string;
  status:   string;
  dueTime:  string;
}

const SITE_TASKS: Record<SiteTab, CalendarTask[]> = {
  "Site A": [
    { id: "1", location: "Floor 2 - Offices", priority: "high",   category: "General Cleaning", status: "Pending",   dueTime: "Due: 11:30 AM" },
    { id: "2", location: "Floor 1 - Lobby",   priority: "medium", category: "Floor Polishing",  status: "Completed", dueTime: "Completed: 09:15 AM" },
  ],
  "Site B": [
    { id: "3", location: "Floor 3 - Restrooms", priority: "high", category: "Deep Cleaning", status: "Pending", dueTime: "Due: 02:00 PM" },
  ],
  "Site C": [],
  "Site D": [],
};

function buildWeekDays(): DayPill[] {
  const days: DayPill[] = [];
  const dayNames  = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const today = new Date();

  for (let i = 0; i < 6; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push({
      dayName:  i === 0 ? "Today" : dayNames[d.getDay()],
      date:     d.getDate(),
      month:    monthNames[d.getMonth()],
      isoDate:  d.toISOString().split("T")[0],
    });
  }
  return days;
}

export function CalendarModal({ open, onClose }: CalendarModalProps) {
  const [selectedDay, setSelectedDay] = useState(0);
  const [activeSite, setActiveSite]   = useState<SiteTab>("Site A");

  const weekDays = buildWeekDays();
  const today    = weekDays[0];
  const tasks    = SITE_TASKS[activeSite] ?? [];

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Calendar"
        className={cn(
          "fixed z-50 bg-white p-6",
          "inset-x-0 bottom-0 rounded-t-3xl max-h-[85vh] overflow-y-auto",
          "lg:inset-0 lg:bottom-auto lg:left-1/2 lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:w-full lg:max-w-xl lg:rounded-3xl lg:shadow-2xl",
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

        {/* Sub-header */}
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm font-medium text-grey-700">Today</span>
          <span className="text-sm text-grey-500">
            {today.month} {today.date}
          </span>
        </div>

        {/* Week strip */}
        <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
          {weekDays.map((day, idx) => {
            const isSelected = idx === selectedDay;
            return (
              <button
                key={day.isoDate}
                onClick={() => setSelectedDay(idx)}
                aria-pressed={isSelected}
                className={cn(
                  "flex shrink-0 flex-col items-center gap-0.5 rounded-[20px] px-3 py-2 text-xs transition-colors",
                  isSelected
                    ? "bg-primary text-white"
                    : "border border-primary text-on-surface hover:bg-primary/10",
                )}
              >
                <span className="font-medium">{day.dayName}</span>
                <span className="font-bold text-sm">{day.date}</span>
                <span className="text-[10px] opacity-80">{day.month}</span>
              </button>
            );
          })}
        </div>

        {/* Site tabs */}
        <div className="mb-5 border-b border-grey-300 pb-3">
          <FilterTabs options={SITE_TABS} value={activeSite} onChange={setActiveSite} />
        </div>

        {/* Task list */}
        {tasks.length === 0 ? (
          <p className="py-8 text-center text-sm text-grey-500">No tasks for this site.</p>
        ) : (
          <div className="flex flex-col gap-3 lg:grid lg:grid-cols-2 lg:gap-3">
            {tasks.map((task) => (
              <CalendarTaskRow key={task.id} task={task} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

interface CalendarTaskRowProps {
  task: CalendarTask;
}

function CalendarTaskRow({ task }: CalendarTaskRowProps) {
  const status = task.status.toLowerCase() === "completed" ? "completed" : "pending";

  return (
    <TaskSummaryCard
      title={task.location}
      category={task.category}
      priority={task.priority}
      status={status}
      dueLabel={task.dueTime}
      icon={getTaskCategoryIcon(task.category)}
    />
  );
}
