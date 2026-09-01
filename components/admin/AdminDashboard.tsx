"use client";

import {
  Users2,
  UserCog,
  Building2,
  ClipboardList,
  CheckCircle2,
  ClipboardCheck,
  Search,
  AlertTriangle,
  Activity,
  Loader2,
} from "lucide-react";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { DonutChart, type DonutSegment } from "@/components/charts/DonutChart";
import { TrendBarChart, type TrendBar } from "@/components/charts/TrendBarChart";
import { useAdminDashboard } from "@/features/workforce/hooks/useAdminDashboard";
import type { AdminDashboard } from "@/features/workforce/schemas/dashboard.schema";

const STATUS_COLORS: Record<string, string> = {
  Completed: "#00A63E",
  "In progress": "#F59E0B",
  Scheduled: "#3B82F6",
  Cancelled: "#EF4444",
};

const COMPLAINT_COLORS = { open: "#EF4444", inProgress: "#F59E0B", resolved: "#00A63E" };

function weekdayLabel(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString(undefined, { weekday: "short" });
}

function timeAgo(iso?: string | null): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const mins = Math.round((Date.now() - then) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

function Panel({ title, icon: Icon, children, action }: {
  title: string;
  icon: typeof Activity;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col rounded-2xl bg-surface p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-on-surface">
          <Icon className="h-4 w-4 text-grey-400" aria-hidden="true" /> {title}
        </h3>
        {action}
      </div>
      {children}
    </div>
  );
}

function SiteStatTile({ icon: Icon, value, label, color }: {
  icon: typeof Activity;
  value: number;
  label: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-grey-100 p-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: `${color}1A` }}>
        <Icon className="h-4.5 w-4.5" style={{ color }} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-lg font-bold leading-tight text-on-surface">{value}</p>
        <p className="truncate text-xs text-grey-500">{label}</p>
      </div>
    </div>
  );
}

export function AdminDashboard() {
  const query = useAdminDashboard();

  if (query.isLoading) {
    return (
      <div className="flex justify-center py-20 text-grey-400">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }
  if (query.isError || !query.data) {
    return (
      <p className="rounded-2xl bg-error/10 px-4 py-3 text-sm font-medium text-error">
        Failed to load the dashboard.
      </p>
    );
  }

  const d: AdminDashboard = query.data;

  const statusSegments: DonutSegment[] = d.statusBreakdown.map((s) => ({
    label: s.label,
    value: s.value,
    color: STATUS_COLORS[s.label] ?? "#94A3B8",
  }));

  const complaintSegments: DonutSegment[] = [
    { label: "Open", value: d.complaints.open, color: COMPLAINT_COLORS.open },
    { label: "In progress", value: d.complaints.inProgress, color: COMPLAINT_COLORS.inProgress },
    { label: "Resolved", value: d.complaints.resolved, color: COMPLAINT_COLORS.resolved },
  ];

  // Partition the sites that have tasks today into mutually-exclusive states.
  const sitesInProgress = Math.max(0, d.sites.withTasks - d.sites.tasksCompleted);
  const siteSegments: DonutSegment[] = [
    { label: "Inspected", value: d.sites.inspected, color: "#7C3AED" },
    { label: "Awaiting inspection", value: d.sites.pendingInspection, color: "#F59E0B" },
    { label: "Tasks in progress", value: sitesInProgress, color: "#2B7FFF" },
  ];

  const trend: TrendBar[] = d.weeklyTrend.map((t) => ({
    label: weekdayLabel(t.date),
    total: t.total,
    completed: t.completed,
  }));

  return (
    <div className="flex flex-col gap-5">
      {/* Headline totals */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <AdminStatCard icon={Users2} iconBg="bg-primary/10" iconColor="text-ink" value={d.totals.cleaners} label="Total Cleaners" />
        <AdminStatCard icon={UserCog} iconBg="bg-purple-100" iconColor="text-purple-600" value={d.totals.supervisors} label="Total Supervisors" />
        <AdminStatCard icon={Building2} iconBg="bg-[#2B7FFF]/10" iconColor="text-[#2B7FFF]" value={d.totals.sites} label="Total Sites" />
        <AdminStatCard icon={ClipboardList} iconBg="bg-[#ED5F25]/10" iconColor="text-[#ED5F25]" value={d.today.total} label="Today's Tasks" />
      </div>

      {/* Sites stats — most meaningful given the high task-per-site volume */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Panel title="Site status — today" icon={Building2}>
          <DonutChart segments={siteSegments} centerValue={d.sites.withTasks} centerLabel="sites today" />
        </Panel>

        <div className="lg:col-span-2">
          <Panel title="Sites — today" icon={Building2}>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <SiteStatTile icon={Building2} value={d.sites.withTasks} label="Sites with tasks" color="#2B7FFF" />
              <SiteStatTile icon={CheckCircle2} value={d.sites.tasksCompleted} label="All tasks completed" color="#00A63E" />
              <SiteStatTile icon={Search} value={d.sites.pendingInspection} label="Awaiting inspection" color="#F59E0B" />
              <SiteStatTile icon={ClipboardCheck} value={d.sites.inspected} label="Inspected" color="#7C3AED" />
            </div>
          </Panel>
        </div>
      </div>

      {/* Task stats */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Panel title="Today's task status" icon={CheckCircle2}>
          <DonutChart
            segments={statusSegments}
            centerValue={`${d.today.completionRate}%`}
            centerLabel="completed"
          />
        </Panel>

        <Panel title="Completion trend (7 days)" icon={Activity}>
          {trend.length > 0 ? (
            <TrendBarChart data={trend} />
          ) : (
            <p className="py-8 text-center text-sm text-grey-500">No scheduled tasks in this period.</p>
          )}
          <p className="mt-3 text-xs text-grey-500">
            <span className="mr-1 inline-block h-2 w-2 rounded-full bg-primary align-middle" /> Completed vs
            <span className="mx-1 inline-block h-2 w-2 rounded-full bg-grey-200 align-middle" /> total per day
          </p>
        </Panel>

        <Panel title="Complaints overview" icon={AlertTriangle}>
          <DonutChart
            segments={complaintSegments}
            centerValue={d.complaints.total}
            centerLabel="total"
          />
        </Panel>
      </div>

      {/* Activity + recent complaints */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Panel title="Ongoing tasks" icon={Activity}>
          {d.ongoing.length === 0 ? (
            <p className="py-6 text-center text-sm text-grey-500">No tasks in progress right now.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-grey-100">
              {d.ongoing.map((o, i) => (
                <li key={`${o.taskId}-${i}`} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-on-surface">{o.taskName ?? "Task"}</p>
                    <p className="truncate text-xs text-grey-500">
                      {[o.siteName, o.cleaner].filter(Boolean).join(" · ") || "—"}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-status-pending/10 px-2.5 py-0.5 text-xs font-medium text-status-pending">
                    {o.startTime ? o.startTime.slice(0, 5) : "In progress"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Recent complaints" icon={AlertTriangle}>
          {d.recentComplaints.length === 0 ? (
            <p className="py-6 text-center text-sm text-grey-500">No complaints raised.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-grey-100">
              {d.recentComplaints.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-on-surface">{c.title}</p>
                    <p className="truncate text-xs text-grey-500">
                      {[c.siteName, timeAgo(c.createdAt)].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <span
                    className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium"
                    style={{
                      backgroundColor:
                        c.status === "RESOLVED" ? "#00A63E1A" : c.status === "IN_PROGRESS" ? "#F59E0B1A" : "#EF44441A",
                      color: c.status === "RESOLVED" ? "#00A63E" : c.status === "IN_PROGRESS" ? "#B45309" : "#DC2626",
                    }}
                  >
                    {c.status === "IN_PROGRESS" ? "In progress" : c.status === "RESOLVED" ? "Resolved" : "Open"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
