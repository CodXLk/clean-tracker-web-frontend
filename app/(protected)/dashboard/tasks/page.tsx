"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BottomNavBar } from "@/components/layout/BottomNavBar";
import { PageHeader } from "@/components/shared/PageHeader";
import { CalendarModal } from "@/components/modals/CalendarModal";
import { FilterTabs } from "@/components/shared/FilterTabs";
import { TaskSummaryCard } from "@/components/shared/TaskSummaryCard";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { SiteSelector } from "@/components/shared/SiteSelector";
import { getTaskCategoryIcon } from "@/lib/utils/taskCategoryIcon";
import { useMyTasks } from "@/features/tasks/hooks/useTasks";
import { useActiveSite } from "@/features/attendance/hooks/useActiveSite";
import {
  assignmentTypeLabel,
  formatTaskTime,
  toLocalDateString,
  toSummaryStatus,
} from "@/features/tasks/lib/task-utils";
import type { TaskOccurrence } from "@/features/tasks/schemas/task.schema";
import { cn } from "@/lib/utils/cn";

interface AreaCount {
  areaId: string;
  area: string;
  count: number;
}

export default function TasksPage() {
  const today = useMemo(() => toLocalDateString(new Date()), []);
  const { data: allOccurrences = [], isLoading } = useMyTasks(today);
  const { sites, selectedSiteId, setSelectedSiteId, checkedInSiteId } = useActiveSite(today);

  // Only show tasks for the active (checked-in or selected) site.
  const occurrences = useMemo(
    () => (selectedSiteId ? allOccurrences.filter((o) => o.siteId === selectedSiteId) : allOccurrences),
    [allOccurrences, selectedSiteId],
  );

  const [calendarOpen, setCalendarOpen] = useState(false);
  const [activeFloor, setActiveFloor] = useState<string | null>(null);

  // Distinct floors present in today's tasks (preserve first-seen order).
  const floors = useMemo(() => {
    const seen = new Map<string, string>();
    for (const o of occurrences) {
      if (o.floorId && o.floorName && !seen.has(o.floorId)) {
        seen.set(o.floorId, o.floorName);
      }
    }
    return Array.from(seen, ([id, name]) => ({ id, name }));
  }, [occurrences]);

  const selectedFloor = activeFloor ?? floors[0]?.name ?? null;

  const areas = useMemo<AreaCount[]>(() => {
    if (!selectedFloor) return [];
    const byArea = new Map<string, AreaCount>();
    for (const o of occurrences) {
      if (o.floorName !== selectedFloor || !o.areaId || !o.areaName) continue;
      const existing = byArea.get(o.areaId);
      if (existing) {
        existing.count += 1;
      } else {
        byArea.set(o.areaId, { areaId: o.areaId, area: o.areaName, count: 1 });
      }
    }
    return Array.from(byArea.values());
  }, [occurrences, selectedFloor]);

  const periodicalTasks = useMemo(
    () => occurrences.filter((o) => o.assignmentType === "PERIODICAL_TASK"),
    [occurrences],
  );

  const kpis = useMemo(() => {
    let pending = 0;
    let inProgress = 0;
    let completed = 0;
    for (const o of occurrences) {
      if (o.status === "COMPLETED") completed += 1;
      else if (o.status === "IN_PROGRESS") inProgress += 1;
      else pending += 1;
    }
    return { total: occurrences.length, pending, inProgress, completed };
  }, [occurrences]);

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "radial-gradient(ellipse at top left, rgba(71,114,115,0.18) 0%, transparent 60%), #F5F5F5",
      }}
    >
      <PageHeader title="Tasks" showCalendar onCalendarClick={() => setCalendarOpen(true)} />

      <main className="mx-auto max-w-2xl px-5 pb-28 lg:max-w-5xl -mt-5">
        {sites.length > 1 && (
          <div className="pt-5">
            <SiteSelector
              sites={sites}
              selectedSiteId={selectedSiteId}
              onChange={setSelectedSiteId}
              checkedInSiteId={checkedInSiteId}
            />
          </div>
        )}
        {/* KPI row */}
        <div className="mb-6 grid grid-cols-2 gap-3 pt-5 sm:grid-cols-4">
          <KpiCard label="Total" value={kpis.total} color="grey" />
          <KpiCard label="Pending" value={kpis.pending} color="orange" />
          <KpiCard label="In Progress" value={kpis.inProgress} color="blue" />
          <KpiCard label="Completed" value={kpis.completed} color="green" />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner />
          </div>
        ) : occurrences.length === 0 ? (
          <p className="py-16 text-center text-sm text-grey-500">
            No tasks scheduled for you today.
          </p>
        ) : (
          <div className="flex flex-col gap-8 lg:grid lg:grid-cols-2 lg:gap-8">
            {/* Left column — Periodical Task list */}
            <section aria-labelledby="periodical-heading" className="flex flex-col gap-3">
              <h2 id="periodical-heading" className="text-base font-medium text-primary">
                Periodical Task
              </h2>
              {periodicalTasks.length === 0 ? (
                <p className="rounded-2xl bg-white/60 p-4 text-sm text-grey-500">
                  No periodical tasks today.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {periodicalTasks.map((task) => (
                    <PeriodicalCard key={`${task.taskId}-${task.occurrenceDate}`} task={task} />
                  ))}
                </div>
              )}
            </section>

            {/* Right column — Floor tabs + Area grid */}
            <section aria-labelledby="floors-heading" className="flex flex-col gap-4">
              <h2 id="floors-heading" className="sr-only">
                Floors
              </h2>
              {floors.length === 0 ? (
                <p className="rounded-2xl bg-white/60 p-4 text-sm text-grey-500">
                  No floor-based tasks today.
                </p>
              ) : (
                <>
                  <div className="border-b border-grey-300 pb-3">
                    <FilterTabs
                      options={floors.map((f) => f.name)}
                      value={selectedFloor ?? floors[0].name}
                      onChange={setActiveFloor}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    {areas.map((item) => (
                      <Link
                        key={item.areaId}
                        href={`/dashboard/tasks/${encodeURIComponent(item.area)}?areaId=${item.areaId}&date=${today}`}
                        className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-white/30 bg-white p-3 text-center shadow-sm transition-shadow hover:shadow-md"
                      >
                        <span className="text-2xl font-semibold text-on-surface">
                          {String(item.count).padStart(2, "0")}
                        </span>
                        <span className="text-xs text-on-surface">{item.area}</span>
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </section>
          </div>
        )}
      </main>

      <CalendarModal open={calendarOpen} onClose={() => setCalendarOpen(false)} />

      <BottomNavBar />
    </div>
  );
}

function PeriodicalCard({ task }: { task: TaskOccurrence }) {
  const due = formatTaskTime(task.startTime);
  const card = (
    <TaskSummaryCard
      title={task.name}
      category={assignmentTypeLabel(task.assignmentType ?? "OTHER")}
      priority="medium"
      status={toSummaryStatus(task.status)}
      dueLabel={due ? `Due: ${due}` : task.siteName}
      icon={getTaskCategoryIcon("periodical")}
    />
  );
  if (task.areaId) {
    return (
      <Link
        href={`/dashboard/tasks/${encodeURIComponent(task.areaName ?? "Area")}?areaId=${task.areaId}&date=${task.occurrenceDate}`}
        className="block"
      >
        {card}
      </Link>
    );
  }
  return card;
}

interface KpiCardProps {
  label: string;
  value: number;
  color: "orange" | "green" | "grey" | "blue";
}

function KpiCard({ label, value, color }: KpiCardProps) {
  const colorMap: Record<KpiCardProps["color"], string> = {
    orange: "text-[#ED5F25] bg-[#ED5F25]/10",
    green:  "text-success bg-success/10",
    grey:   "text-grey-700 bg-grey-100",
    blue:   "text-primary bg-primary/10",
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
