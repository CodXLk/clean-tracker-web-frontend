"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock, Star, Users2 } from "lucide-react";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { EmptyState } from "@/components/shared/EmptyState";
import { useInspections } from "@/features/inspections/hooks/useInspections";
import { useStartTask } from "@/features/inspections/hooks/useStartTask";
import { useCompleteMyTask } from "@/features/inspections/hooks/useCompleteMyTask";
import { useCompleteAreaInspection } from "@/features/inspections/hooks/useCompleteAreaInspection";
import { AreaInspectionCard } from "@/features/inspections/components/AreaInspectionCard";
import { MyTaskCard } from "@/features/inspections/components/MyTaskCard";
import { SitePerformanceCard } from "@/features/inspections/components/SitePerformanceCard";
import { CleanerRankingTable } from "@/features/inspections/components/CleanerRankingTable";
import { CompleteTaskModal, type CompleteTaskTarget } from "@/features/inspections/components/CompleteTaskModal";
import { InspectingTaskModal } from "@/features/inspections/components/InspectingTaskModal";
import type { AreaInspection, MyTask } from "@/features/inspections/types";

export default function InspectionsPage() {
  const router = useRouter();
  const { data, isLoading, isError } = useInspections();
  const startTaskMutation      = useStartTask();
  const completeTaskMutation   = useCompleteMyTask();
  const completeAreaMutation   = useCompleteAreaInspection();

  const [areaFilter, setAreaFilter]         = useState<string>("all");
  const [selectedArea, setSelectedArea]     = useState<AreaInspection | null>(null);
  const [completeTarget, setCompleteTarget] = useState<CompleteTaskTarget | null>(null);
  const [completeSource, setCompleteSource] = useState<"task" | "area" | null>(null);

  const areas = useMemo(() => data?.areas ?? [], [data]);
  const sites = useMemo(() => Array.from(new Set(areas.map((a) => a.site))), [areas]);
  const filteredAreas = areaFilter === "all" ? areas : areas.filter((a) => a.site === areaFilter);

  const pendingCount    = (data?.myTasks ?? []).filter((t) => t.status === "pending").length;
  const inProgressCount = (data?.myTasks ?? []).filter((t) => t.status === "in_progress").length;

  function handleFinishTask(task: MyTask) {
    setCompleteSource("task");
    setCompleteTarget({ id: task.id, title: `${task.site} - ${task.area}`, subtitle: task.description });
  }

  function handleCompleteArea(area: AreaInspection, data_: { notes: string; qualityRating: number }) {
    completeAreaMutation.mutate({ id: area.id, data: data_ });
  }

  function handleAddComplaint() {
    router.push("/admin/complaints");
  }

  function handleCompleteSubmit(id: string, formData: { notes: string; qualityRating: number }) {
    if (completeSource === "task") {
      completeTaskMutation.mutate({ id, data: formData });
    }
    setCompleteSource(null);
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner size={32} />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <ErrorMessage message="Failed to load inspections." />
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
            value={`${data.kpis.taskCompletionRate}%`}
            label="Task Completion Rate"
          />
          <AdminStatCard
            icon={Clock}
            iconBg="bg-[#ED5F25]/10"
            iconColor="text-[#ED5F25]"
            value={`${data.kpis.avgTaskDurationHours}h`}
            label="Avg. Task Duration"
          />
          <AdminStatCard
            icon={Star}
            iconBg="bg-success/10"
            iconColor="text-success"
            value={data.kpis.customerSatisfaction}
            label="Customer Satisfaction"
            badge="+0.3"
            badgeColor="text-success"
          />
          <AdminStatCard
            icon={Users2}
            iconBg="bg-purple-100"
            iconColor="text-purple-600"
            value={data.kpis.activeCleaners}
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
              {sites.map((site) => (
                <option key={site} value={site}>{site}</option>
              ))}
            </select>
          </div>
          {filteredAreas.length === 0 ? (
            <EmptyState title="No areas need inspection" description="You're all caught up." />
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {filteredAreas.map((area) => (
                <AreaInspectionCard key={area.id} area={area} onClick={() => setSelectedArea(area)} />
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
          {data.myTasks.length === 0 ? (
            <EmptyState title="No tasks assigned" description="New tasks will appear here." />
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {data.myTasks.map((task) => (
                <MyTaskCard
                  key={task.id}
                  task={task}
                  onStart={(id) => startTaskMutation.mutate(id)}
                  onFinish={handleFinishTask}
                />
              ))}
            </div>
          )}
        </div>

        {/* Site Performance */}
        <div className="mb-6">
          <h2 className="mb-3 text-base font-semibold text-on-surface">Site Performance</h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {data.sitePerformance.map((site) => (
              <SitePerformanceCard key={site.site} site={site} />
            ))}
          </div>
        </div>

        {/* Cleaner Performance Rankings */}
        <div className="rounded-2xl bg-surface p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-on-surface">Cleaner Performance Rankings</h2>
          <CleanerRankingTable rankings={data.cleanerRankings} />
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

      {/* Complete Task modal (reused by My Tasks "Finish") */}
      <CompleteTaskModal
        key={completeTarget?.id ?? "complete-task-closed"}
        open={completeTarget !== null}
        onClose={() => {
          setCompleteTarget(null);
          setCompleteSource(null);
        }}
        target={completeTarget}
        onSubmit={handleCompleteSubmit}
      />
    </div>
  );
}
