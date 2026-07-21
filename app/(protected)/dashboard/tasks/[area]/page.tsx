"use client";

import { useState } from "react";
import { use } from "react";
import { Square, SquareCheck } from "lucide-react";
import { BottomNavBar } from "@/components/layout/BottomNavBar";
import { PageHeader } from "@/components/shared/PageHeader";
import { TaskDetailModal } from "@/components/modals/TaskDetailModal";
import type { TaskDetailState } from "@/components/modals/TaskDetailModal";
import { CalendarModal } from "@/components/modals/CalendarModal";
import { cn } from "@/lib/utils/cn";

interface AreaTask {
  id:     string;
  title:  string;
  floor:  string;
  status: "pending" | "in_progress" | "completed";
  date:   string;
}

const AREA_TASKS: AreaTask[] = [
  { id: "1", title: "Lobby Restroom Needs Cleaning",         floor: "Floor 1", status: "pending", date: "2026-04-09" },
  { id: "2", title: "Lobby Light Bulb Replacement",          floor: "Floor 1", status: "pending", date: "2026-04-09" },
  { id: "3", title: "Lobby Air Conditioning Maintenance",    floor: "Floor 1", status: "pending", date: "2026-04-09" },
];

const STATUS_LABEL_MAP: Record<AreaTask["status"], string> = {
  pending:     "Pending",
  in_progress: "In Progress",
  completed:   "Completed",
};

const STATUS_COLOR_MAP: Record<AreaTask["status"], string> = {
  pending:     "bg-[#ED5F25]/20 text-[#ED5F25]",
  in_progress: "bg-primary/20 text-primary",
  completed:   "bg-success/20 text-success",
};

interface PageParams {
  area: string;
}

interface AreaTaskPageProps {
  params: Promise<PageParams>;
}

export default function AreaTaskPage({ params }: AreaTaskPageProps) {
  const { area } = use(params);
  const areaName  = decodeURIComponent(area);

  const [selectedTask,     setSelectedTask]     = useState<AreaTask | null>(null);
  const [taskStates,       setTaskStates]       = useState<Record<string, TaskDetailState>>({});
  const [calendarOpen,     setCalendarOpen]     = useState(false);
  const [selectedIds,      setSelectedIds]      = useState<Set<string>>(new Set());

  const allSelected = selectedIds.size > 0 && selectedIds.size === AREA_TASKS.length;

  function getTaskState(taskId: string): TaskDetailState {
    return taskStates[taskId] ?? "start";
  }

  function toggleTaskSelected(taskId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds(allSelected ? new Set() : new Set(AREA_TASKS.map((t) => t.id)));
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
        title={areaName}
        showCalendar
        onCalendarClick={() => setCalendarOpen(true)}
      />

      <main className="mx-auto max-w-2xl px-5 pb-28 lg:max-w-5xl -mt-5">
        <div className="flex items-center justify-end pt-5 pb-3">
          <button
            onClick={toggleSelectAll}
            aria-pressed={allSelected}
            className="flex items-center gap-2 text-sm text-grey-700 transition-colors hover:text-primary"
          >
            {allSelected ? (
              <SquareCheck size={20} className="text-primary" />
            ) : (
              <Square size={20} className="text-grey-500" />
            )}
            Select All
          </button>
        </div>

        <div className="flex flex-col gap-3 lg:grid lg:grid-cols-2 lg:gap-3">
          {AREA_TASKS.map((task) => {
            const state    = getTaskState(task.id);
            const selected = selectedIds.has(task.id);
            return (
              <div
                key={task.id}
                className="flex w-full items-start gap-3 rounded-2xl bg-white p-4 shadow-sm"
              >
                <button
                  onClick={() => toggleTaskSelected(task.id)}
                  aria-pressed={selected}
                  aria-label={`Select ${task.title}`}
                  className="mt-0.5 shrink-0"
                >
                  {selected ? (
                    <SquareCheck size={20} className="text-primary" />
                  ) : (
                    <Square size={20} className="text-grey-500" />
                  )}
                </button>

                <button
                  onClick={() => setSelectedTask(task)}
                  className="flex min-w-0 flex-1 items-start justify-between gap-3 text-left"
                >
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="text-sm font-semibold text-[#1A1A1A] leading-snug">
                      {task.title}
                    </span>
                    <span className="text-xs text-grey-500">{task.floor}</span>
                    <span className="text-xs text-grey-500">{task.date}</span>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-3 py-0.5 text-xs font-medium",
                      STATUS_COLOR_MAP[state === "completed" ? "completed" : task.status],
                    )}
                  >
                    {STATUS_LABEL_MAP[state === "completed" ? "completed" : task.status]}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </main>

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          open={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          description={selectedTask.title}
          state={getTaskState(selectedTask.id)}
          onStart={() => handleStart(selectedTask.id)}
          onComplete={() => handleComplete(selectedTask.id)}
          onUploadPhoto={() => {}}
          onAddNote={() => {}}
        />
      )}

      {/* Calendar Modal */}
      <CalendarModal open={calendarOpen} onClose={() => setCalendarOpen(false)} />

      <BottomNavBar />
    </div>
  );
}
