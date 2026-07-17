"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock, Star, Users2 } from "lucide-react";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { useInspections } from "@/features/inspections/hooks/useInspections";
import { useCompleteAreaInspection } from "@/features/inspections/hooks/useCompleteAreaInspection";
import { AreaInspectionCard } from "@/features/inspections/components/AreaInspectionCard";
import { MyTaskCard } from "@/features/inspections/components/MyTaskCard";
import { SitePerformanceCard } from "@/features/inspections/components/SitePerformanceCard";
import { CleanerRankingTable } from "@/features/inspections/components/CleanerRankingTable";
import { InspectingTaskModal } from "@/features/inspections/components/InspectingTaskModal";
import type { AreaInspection, MyTask, SitePerformance } from "@/features/inspections/types";
import { useSites } from "@/features/user-management/hooks/useSites";
import { useAreas } from "@/features/user-management/hooks/useAreas";
import {
  useOccurrences,
  useEditOccurrence,
} from "@/features/workforce/hooks/useAssignments";
import { WORK_TYPE_LABELS, type TaskStatus } from "@/features/workforce/schemas/assignment.schema";
import { todayISODate } from "@/lib/utils/format";

// ── Static KPI placeholders ──────────────────────────────────────────────────────
// No real backing data exists yet for these (completion rate, avg duration, satisfaction,
// active-cleaner count as a "rating" concept) — left as static placeholders rather than
// fabricating a derivation. Matches the same treatment as Workforce's "Avg. Rating" card.
const KPIS = {
  taskCompletionRate: 96.5,
  avgTaskDurationHours: 2.3,
  customerSatisfaction: 9.1,
  activeCleaners: 45,
};

// Placeholder metrics repeated across every real, role-scoped site — no real
// per-site completion/time/rating data exists yet.
const SITE_PERFORMANCE_PLACEHOLDER = { completion: 90, avgTime: "2.1h", rating: 8.5 };

export default function InspectionsPage() {
  const router = useRouter();
  const today = todayISODate();

  // Cleaner Performance Rankings has no real per-site visibility mapping yet
  // (out of scope — see plan) — kept on the mock feed for that section only.
  const { data: mockData } = useInspections();
  const completeAreaMutation = useCompleteAreaInspection();

  const sitesQuery = useSites();
  const areasQuery = useAreas(undefined, { enabled: true });
  const tasksQuery = useOccurrences({ from: today, to: today });
  const editOccurrence = useEditOccurrence();

  const [areaFilter, setAreaFilter] = useState<string>("all");
  const [selectedArea, setSelectedArea] = useState<AreaInspection | null>(null);

  const isLoading = sitesQuery.isLoading || areasQuery.isLoading || tasksQuery.isLoading;
  const isError = sitesQuery.isError || areasQuery.isError || tasksQuery.isError;

  const sites = useMemo(() => sitesQuery.data ?? [], [sitesQuery.data]);
  const areas = useMemo(() => areasQuery.data ?? [], [areasQuery.data]);
  const tasks = useMemo(() => tasksQuery.data ?? [], [tasksQuery.data]);

  const filteredAreas = areaFilter === "all" ? areas : areas.filter((a) => a.siteId === areaFilter);

  const areaInspections: AreaInspection[] = useMemo(
    () =>
      filteredAreas.map((a) => ({
        id: a.id,
        site: a.siteName,
        area: `${a.floorName} - ${a.name}`,
        reportedAgo: "—",
        priority: "medium" as const,
      })),
    [filteredAreas],
  );

  const myTasks: MyTask[] = useMemo(
    () =>
      tasks
        .filter((t) => t.status === "SCHEDULED" || t.status === "ACTIVE" || t.status === "IN_PROGRESS")
        .map((t) => ({
          // Occurrences are computed, not stored — the composite id carries what
          // the status mutation needs (taskId + original series date).
          id: `${t.taskId}|${t.occurrenceDate}`,
          site: t.siteName,
          area: `${t.floorName} - ${t.areaName}`,
          taskType: WORK_TYPE_LABELS[t.assignmentType],
          description: t.description ?? "",
          status: t.status === "SCHEDULED" ? "pending" : "in_progress",
          dueTime: t.startTime.slice(0, 5),
        })),
    [tasks],
  );

  const sitePerformance: SitePerformance[] = useMemo(
    () => sites.map((s) => ({ site: s.name, ...SITE_PERFORMANCE_PLACEHOLDER })),
    [sites],
  );

  const pendingCount = myTasks.filter((t) => t.status === "pending").length;
  const inProgressCount = myTasks.filter((t) => t.status === "in_progress").length;

  function handleAreaClick(area: AreaInspection) {
    setSelectedArea(area);
  }

  function handleCompleteArea(area: AreaInspection, data: { notes: string; qualityRating: number }) {
    completeAreaMutation.mutate({ id: area.id, data });
  }

  function handleAddComplaint() {
    router.push("/admin/complaints");
  }

  function mutateStatus(compositeId: string, status: TaskStatus) {
    const [taskId, occurrenceDate] = compositeId.split("|");
    if (!taskId || !occurrenceDate) return;
    // Status changes apply to this day's occurrence only, never the whole series.
    editOccurrence.mutate({ taskId, occurrenceDate, input: { scope: "THIS", status } });
  }

  function handleStartTask(id: string) {
    mutateStatus(id, "IN_PROGRESS");
  }

  function handleFinishTask(task: MyTask) {
    mutateStatus(task.id, "COMPLETED");
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner size={32} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <EmptyState title="Failed to load inspections" description="Please try refreshing the page." />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-on-surface">Inspections</h1>
          <p className="mt-1 text-sm text-grey-500">
            Track cleaner tasks and areas needing supervisor review.
          </p>
        </div>

        {/* KPIs */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <AdminStatCard
            icon={CheckCircle2}
            iconBg="bg-primary/10"
            iconColor="text-primary"
            value={`${KPIS.taskCompletionRate}%`}
            label="Task Completion Rate"
          />
          <AdminStatCard
            icon={Clock}
            iconBg="bg-[#ED5F25]/10"
            iconColor="text-[#ED5F25]"
            value={`${KPIS.avgTaskDurationHours}h`}
            label="Avg. Task Duration"
          />
          <AdminStatCard
            icon={Star}
            iconBg="bg-success/10"
            iconColor="text-success"
            value={KPIS.customerSatisfaction}
            label="Customer Satisfaction"
            badge="+0.3"
            badgeColor="text-success"
          />
          <AdminStatCard
            icon={Users2}
            iconBg="bg-purple-100"
            iconColor="text-purple-600"
            value={KPIS.activeCleaners}
            label="Active Cleaners"
            badge="+2"
            badgeColor="text-purple-600"
          />
        </div>

        {/* Areas Needing Inspection */}
        <div className="mb-6 rounded-2xl bg-surface p-6 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-base font-semibold text-primary">Areas Needing Inspection</h2>
            <select
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
              aria-label="Filter by site"
              className="rounded-xl border border-grey-300 px-3 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            >
              <option value="all">All Sites</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          {areaInspections.length === 0 ? (
            <EmptyState title="No areas need inspection" description="You're all caught up." />
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {areaInspections.map((area) => (
                <AreaInspectionCard key={area.id} area={area} onClick={() => handleAreaClick(area)} />
              ))}
            </div>
          )}
        </div>

        {/* My Tasks */}
        <div className="mb-6">
          <div className="mb-3 flex items-center gap-3">
            <h2 className="text-base font-semibold text-on-surface">My Tasks</h2>
            <span className="rounded-full bg-grey-100 px-2.5 py-0.5 text-xs text-grey-700">
              {pendingCount} Pending
            </span>
            <span className="rounded-full bg-[#ED5F25]/10 px-2.5 py-0.5 text-xs text-[#ED5F25]">
              {inProgressCount} In Progress
            </span>
          </div>
          {myTasks.length === 0 ? (
            <EmptyState title="No tasks assigned" description="New tasks will appear here." />
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {myTasks.map((task) => (
                <MyTaskCard
                  key={task.id}
                  task={task}
                  onStart={handleStartTask}
                  onFinish={handleFinishTask}
                />
              ))}
            </div>
          )}
        </div>

        {/* Site Performance */}
        <div className="mb-6">
          <h2 className="mb-3 text-base font-semibold text-on-surface">Site Performance</h2>
          {sitePerformance.length === 0 ? (
            <EmptyState title="No sites yet" />
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {sitePerformance.map((site) => (
                <SitePerformanceCard key={site.site} site={site} />
              ))}
            </div>
          )}
        </div>

        {/* Cleaner Performance Rankings */}
        <div className="rounded-2xl bg-surface p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-on-surface">Cleaner Performance Rankings</h2>
          <CleanerRankingTable rankings={mockData?.cleanerRankings ?? []} />
        </div>
      </div>

      {/* Inspecting Task modal */}
      <InspectingTaskModal
        key={selectedArea?.id ?? "inspecting-task-closed"}
        open={selectedArea !== null}
        onClose={() => setSelectedArea(null)}
        area={selectedArea}
        onComplete={(area, formData) => {
          handleCompleteArea(area, formData);
          setSelectedArea(null);
        }}
        onAddComplaint={handleAddComplaint}
      />
    </div>
  );
}
