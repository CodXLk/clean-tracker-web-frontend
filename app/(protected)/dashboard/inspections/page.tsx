"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, ClipboardList } from "lucide-react";
import { useIsDrawerNav } from "@/components/layout/AppNav";
import { useUIStore } from "@/store/ui.store";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { CalendarModal } from "@/components/modals/CalendarModal";
import { FilterTabs } from "@/components/shared/FilterTabs";
import { TaskSummaryCard } from "@/components/shared/TaskSummaryCard";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { SiteSelector } from "@/components/shared/SiteSelector";
import { getTaskCategoryIcon } from "@/lib/utils/taskCategoryIcon";
import { useMyTasks } from "@/features/tasks/hooks/useTasks";
import { useTaskFiltersStore } from "@/features/tasks/store/taskFilters.store";
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
  completed: number;
  total: number;
}

export default function InspectionsPage() {
  const useDrawerNav = useIsDrawerNav();
  const today = useMemo(() => toLocalDateString(new Date()), []);
  const { data: allOccurrences = [], isLoading } = useMyTasks(today);
  const { sites, selectedSiteId, setSelectedSiteId, checkedInSiteId } = useActiveSite(today);

  // Only show tasks for the active (checked-in or selected) site.
  const occurrences = useMemo(
    () => (selectedSiteId ? allOccurrences.filter((o) => o.siteId === selectedSiteId) : allOccurrences),
    [allOccurrences, selectedSiteId],
  );

  const [calendarOpen, setCalendarOpen] = useState(false);
  const setHeaderAction = useUIStore((s) => s.setHeaderAction);
  const activeFloor = useTaskFiltersStore((s) => s.activeFloor);
  const setActiveFloor = useTaskFiltersStore((s) => s.setActiveFloor);

  // Surface the calendar trigger in the shared header bar instead of the page
  // body — cleared on unmount so it doesn't linger on other pages.
  useEffect(() => {
    setHeaderAction({ icon: CalendarDays, label: "Open calendar", onClick: () => setCalendarOpen(true) });
    return () => setHeaderAction(null);
  }, [setHeaderAction]);

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

  // Keep the persisted pick only while it's still one of the current floors (e.g. after
  // switching sites, the previous floor may no longer apply) — otherwise fall back.
  const selectedFloor =
    activeFloor && floors.some((f) => f.name === activeFloor) ? activeFloor : floors[0]?.name ?? null;

  const areas = useMemo<AreaCount[]>(() => {
    if (!selectedFloor) return [];
    const byArea = new Map<string, AreaCount>();
    for (const o of occurrences) {
      if (o.floorName !== selectedFloor || !o.areaId || !o.areaName) continue;
      const isCompleted = o.status === "COMPLETED";
      const existing = byArea.get(o.areaId);
      if (existing) {
        existing.total += 1;
        if (isCompleted) existing.completed += 1;
      } else {
        byArea.set(o.areaId, {
          areaId: o.areaId,
          area: o.areaName,
          total: 1,
          completed: isCompleted ? 1 : 0,
        });
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
    <>
      {/* ---------- Desktop (admin-style console) ---------- */}
      <div className={cn("p-6 lg:p-8", useDrawerNav ? "block" : "hidden lg:block")}>
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-grey-500">Your tasks for today</p>
            {sites.length > 1 && (
              <SiteSelector
                sites={sites}
                selectedSiteId={selectedSiteId}
                onChange={setSelectedSiteId}
                checkedInSiteId={checkedInSiteId}
              />
            )}
          </div>

          <div className="mb-6 grid grid-cols-4 gap-2 sm:gap-4">
            <AdminStatCard icon={ClipboardList} iconBg="bg-grey-100" iconColor="text-grey-700" value={kpis.total} label="Total Tasks" />
            <AdminStatCard icon={ClipboardList} iconBg="bg-[#ED5F25]/10" iconColor="text-[#ED5F25]" value={kpis.pending} label="Pending" />
            <AdminStatCard icon={ClipboardList} iconBg="bg-primary/10" iconColor="text-primary" value={kpis.inProgress} label="In Progress" />
            <AdminStatCard icon={ClipboardList} iconBg="bg-success/10" iconColor="text-success" value={kpis.completed} label="Completed" />
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <LoadingSpinner />
            </div>
          ) : occurrences.length === 0 ? (
            <p className="py-16 text-center text-sm text-grey-500">No tasks scheduled for you today.</p>
          ) : (
            <div className={cn("grid grid-cols-1 gap-4", periodicalTasks.length > 0 && "lg:grid-cols-2")}>
              {periodicalTasks.length > 0 && (
                <section aria-labelledby="periodical-heading" className="rounded-2xl bg-surface p-5 shadow-sm">
                  <h2 id="periodical-heading" className="mb-4 text-sm font-semibold text-on-surface">
                    Periodical Task
                  </h2>
                  <div className="flex flex-col gap-3">
                    {periodicalTasks.map((task) => (
                      <PeriodicalCard key={`${task.taskId}-${task.occurrenceDate}`} task={task} />
                    ))}
                  </div>
                </section>
              )}

              <section aria-labelledby="floors-heading" className="rounded-2xl bg-surface p-5 shadow-sm">
                <h2 id="floors-heading" className="mb-4 text-sm font-semibold text-on-surface">
                  Floors
                </h2>
                {floors.length === 0 ? (
                  <p className="rounded-xl bg-grey-50 p-4 text-sm text-grey-500">No floor-based tasks today.</p>
                ) : (
                  <>
                    <div className="border-b border-grey-200 pb-3">
                      <FilterTabs
                        options={floors.map((f) => f.name)}
                        value={selectedFloor ?? floors[0].name}
                        onChange={setActiveFloor}
                      />
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                      {areas.map((item) => (
                        <Link
                          key={item.areaId}
                          href={`/dashboard/inspections/${encodeURIComponent(item.area)}?areaId=${item.areaId}&date=${today}`}
                          className="flex flex-col items-center justify-center gap-1 rounded-xl border border-grey-200 bg-grey-50 p-3 text-center transition-shadow hover:shadow-md"
                        >
                          <span className="whitespace-nowrap text-lg font-semibold text-on-surface sm:text-xl">
                            {String(item.completed).padStart(2, "0")}/{String(item.total).padStart(2, "0")}
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
        </div>
      </div>

      {/* ---------- Mobile (cleaner-style layout) ---------- */}
      <div
        className={cn("min-h-screen", useDrawerNav ? "hidden" : "lg:hidden")}
        style={{
          background:
            "radial-gradient(ellipse at top left, rgba(71,114,115,0.18) 0%, transparent 60%), #F5F5F5",
        }}
      >
        {!useDrawerNav && <PageHeader title="Inspections" showCalendar onCalendarClick={() => setCalendarOpen(true)} />}

        <main className={cn("mx-auto max-w-2xl px-5 pb-28", !useDrawerNav ? "-mt-5" : "pt-5")}>
          {sites.length > 1 && (
            <div className="pt-3">
              <SiteSelector
                sites={sites}
                selectedSiteId={selectedSiteId}
                onChange={setSelectedSiteId}
                checkedInSiteId={checkedInSiteId}
              />
            </div>
          )}
          {/* KPI row */}
          <div className="mb-6 grid grid-cols-3 gap-3 pt-5 sm:grid-cols-4">
            <KpiCard label="Total" value={kpis.total} color="grey" />
            <KpiCard label="Pending" value={kpis.pending} color="orange" />
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
            <div className="flex flex-col gap-8">
              {/* Periodical Task list (hidden entirely when the site has none) */}
              {periodicalTasks.length > 0 && (
                <section aria-labelledby="periodical-heading-mobile" className="flex flex-col gap-3">
                  <h2 id="periodical-heading-mobile" className="text-base font-medium text-primary">
                    Periodical Task
                  </h2>
                  <div className="flex flex-col gap-3">
                    {periodicalTasks.map((task) => (
                      <PeriodicalCard key={`${task.taskId}-${task.occurrenceDate}`} task={task} />
                    ))}
                  </div>
                </section>
              )}

              {/* Floor tabs + Area grid */}
              <section aria-labelledby="floors-heading-mobile" className="flex flex-col gap-4">
                <h2 id="floors-heading-mobile" className="sr-only">
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
                          href={`/dashboard/inspections/${encodeURIComponent(item.area)}?areaId=${item.areaId}&date=${today}`}
                          className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-white/30 bg-white p-3 text-center shadow-sm transition-shadow hover:shadow-md"
                        >
                          <span className="whitespace-nowrap text-lg font-semibold text-on-surface sm:text-xl">
                            {String(item.completed).padStart(2, "0")}/{String(item.total).padStart(2, "0")}
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
      </div>

      <CalendarModal open={calendarOpen} onClose={() => setCalendarOpen(false)} />
    </>
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
        href={`/dashboard/inspections/${encodeURIComponent(task.areaName ?? "Area")}?areaId=${task.areaId}&date=${task.occurrenceDate}`}
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
    green: "text-success bg-success/10",
    grey: "text-grey-700 bg-grey-100",
    blue: "text-primary bg-primary/10",
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
