"use client";

import { useState } from "react";
import Link from "next/link";
import { BottomNavBar } from "@/components/layout/BottomNavBar";
import { PageHeader } from "@/components/shared/PageHeader";
import { CalendarModal } from "@/components/modals/CalendarModal";
import { FilterTabs } from "@/components/shared/FilterTabs";
import { TaskSummaryCard } from "@/components/shared/TaskSummaryCard";
import type { TaskSummaryStatus } from "@/components/shared/TaskSummaryCard";
import { TaskDetailModal } from "@/components/modals/TaskDetailModal";
import type { TaskDetailState } from "@/components/modals/TaskDetailModal";
import { getTaskCategoryIcon } from "@/lib/utils/taskCategoryIcon";
import type { Priority } from "@/components/shared/PriorityBadge";
import { cn } from "@/lib/utils/cn";

type Floor = "Floor 1" | "Floor 2" | "Floor 3" | "Floor 4";

const FLOORS: Floor[] = ["Floor 1", "Floor 2", "Floor 3", "Floor 4"];

interface AreaCount {
  area:  string;
  count: number;
}

const AREAS_BY_FLOOR: Record<Floor, AreaCount[]> = {
  "Floor 1": [
    { area: "Lobby",       count: 3 },
    { area: "Office Room", count: 4 },
    { area: "Restroom",    count: 1 },
  ],
  "Floor 2": [
    { area: "Lobby",       count: 2 },
    { area: "Office Room", count: 3 },
    { area: "Restroom",    count: 2 },
  ],
  "Floor 3": [
    { area: "Conference Room", count: 2 },
    { area: "Office Room",     count: 5 },
    { area: "Restroom",        count: 1 },
  ],
  "Floor 4": [
    { area: "Break Room",  count: 1 },
    { area: "Office Room", count: 2 },
    { area: "Restroom",    count: 2 },
  ],
};

interface PeriodicalTask {
  id:       string;
  title:    string;
  category: string;
  priority: Priority;
  status:   TaskSummaryStatus;
  dueLabel: string;
}

const PERIODICAL_TASKS: PeriodicalTask[] = [
  { id: "1", title: "Restrooms - All Floors",         category: "Periodical", priority: "high",   status: "pending",     dueLabel: "Due: 02:00 PM" },
  { id: "2", title: "Lobby - Floor 2",                 category: "Periodical", priority: "medium", status: "in_progress", dueLabel: "Due: 03:30 PM" },
  { id: "3", title: "Conference Room A - Floor 1",      category: "Periodical", priority: "low",    status: "scheduled",   dueLabel: "Due: 04:00 PM" },
];

interface KpiCardData {
  label: string;
  value: number;
  color: "grey" | "orange" | "green" | "red";
}

const KPI_CARDS: KpiCardData[] = [
  { label: "Total",      value: 11, color: "grey"   },
  { label: "Pending",    value: 8,  color: "orange" },
  { label: "Completed",  value: 3,  color: "green"  },
  { label: "Complaints", value: 2,  color: "red"    },
];

export default function TasksPage() {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [activeFloor, setActiveFloor]   = useState<Floor>("Floor 1");

  const [selectedTask, setSelectedTask] = useState<PeriodicalTask | null>(null);
  const [taskStates,   setTaskStates]   = useState<Record<string, TaskDetailState>>({});

  function getModalState(task: PeriodicalTask): TaskDetailState {
    const override = taskStates[task.id];
    if (override) return override;
    return task.status === "in_progress" ? "in_progress" : "start";
  }

  function handleStart(taskId: string) {
    setTaskStates((prev) => ({ ...prev, [taskId]: "in_progress" }));
    setSelectedTask(null);
  }

  function handleComplete(taskId: string) {
    setTaskStates((prev) => ({ ...prev, [taskId]: "completed" }));
    setSelectedTask(null);
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "radial-gradient(ellipse at top left, rgba(71,114,115,0.18) 0%, transparent 60%), #F5F5F5",
      }}
    >
      <PageHeader
        title="Tasks"
        showCalendar
        onCalendarClick={() => setCalendarOpen(true)}
      />

      <main className="mx-auto max-w-2xl px-5 pb-28 lg:max-w-5xl -mt-5">
        {/* KPI row */}
        <div className="mb-6 grid grid-cols-2 gap-3 pt-5 sm:grid-cols-4">
          {KPI_CARDS.map((kpi) => (
            <KpiCard key={kpi.label} {...kpi} />
          ))}
        </div>

        <div className="flex flex-col gap-8 lg:grid lg:grid-cols-2 lg:gap-8">
          {/* Left column — Periodical Task list */}
          <section aria-labelledby="periodical-heading" className="flex flex-col gap-3">
            <h2 id="periodical-heading" className="text-base font-medium text-primary">
              Periodical Task
            </h2>
            <div className="flex flex-col gap-3">
              {PERIODICAL_TASKS.map((task) => (
                <TaskSummaryCard
                  key={task.id}
                  title={task.title}
                  category={task.category}
                  priority={task.priority}
                  status={taskStates[task.id] === "completed" ? "completed" : task.status}
                  dueLabel={task.dueLabel}
                  icon={getTaskCategoryIcon(task.category)}
                  onClick={() => setSelectedTask(task)}
                />
              ))}
            </div>
          </section>

          {/* Right column — Floor tabs + Area grid */}
          <section aria-labelledby="floors-heading" className="flex flex-col gap-4">
            <h2 id="floors-heading" className="sr-only">
              Floors
            </h2>
            <div className="border-b border-grey-300 pb-3">
              <FilterTabs options={FLOORS} value={activeFloor} onChange={setActiveFloor} />
            </div>

            <div className="grid grid-cols-3 gap-4">
              {AREAS_BY_FLOOR[activeFloor].map((item) => (
                <Link
                  key={item.area}
                  href={`/dashboard/tasks/${encodeURIComponent(item.area)}`}
                  className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-white/30 bg-white p-3 text-center shadow-sm transition-shadow hover:shadow-md"
                >
                  <span className="text-2xl font-semibold text-on-surface">
                    {String(item.count).padStart(2, "0")}
                  </span>
                  <span className="text-xs text-on-surface">{item.area}</span>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Periodical Task detail modal */}
      {selectedTask && (
        <TaskDetailModal
          open={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          description={selectedTask.title}
          state={getModalState(selectedTask)}
          onStart={() => handleStart(selectedTask.id)}
          onComplete={() => handleComplete(selectedTask.id)}
          onUploadPhoto={() => {}}
          onAddNote={() => {}}
        />
      )}

      <CalendarModal open={calendarOpen} onClose={() => setCalendarOpen(false)} />

      <BottomNavBar />
    </div>
  );
}

interface KpiCardProps {
  label: string;
  value: number;
  color: "orange" | "green" | "grey" | "red";
}

function KpiCard({ label, value, color }: KpiCardProps) {
  const colorMap = {
    orange: "text-[#ED5F25] bg-[#ED5F25]/10",
    green:  "text-success bg-success/10",
    grey:   "text-grey-700 bg-grey-100",
    red:    "text-danger bg-danger/10",
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-1 rounded-2xl py-4",
        colorMap[color],
      )}
    >
      <span className="text-2xl font-bold leading-none">{value}</span>
      <span className="text-[11px] font-medium opacity-80 text-center leading-tight">{label}</span>
    </div>
  );
}
