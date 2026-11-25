"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, Building2, CalendarCheck2, ClipboardList, Clock, Loader2, Plus, RefreshCw, Sparkles } from "lucide-react";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { DonutChart, type DonutSegment } from "@/components/charts/DonutChart";
import {
  COMPLAINT_STATUS,
  ComplaintTile,
  ComplaintsTable,
  EmptyRows,
  Panel,
  PanelLink,
  TD,
  TH,
  useNow,
} from "@/components/admin/AdminDashboard";
import { useComplaints } from "@/features/complaints/hooks/useComplaints";
import { useClientOverview } from "@/features/live-dashboard/hooks/useClientDashboard";
import { LiveDot } from "@/features/live-dashboard/components/SiteDayDetails";
import { CLIENT_STATUS_META } from "@/features/live-dashboard/lib/siteDayStatus";
import type { ClientDayStatus, ClientSiteDay } from "@/features/live-dashboard/schemas/clientDashboard.schema";
import { formatDayHeading, todayISODate } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

const DASH = "/admin/dashboard";
const ORDER: Record<ClientDayStatus, number> = { CLEANING_IN_PROGRESS: 0, SCHEDULED: 1, CLEANING_COMPLETED: 2 };

function ClientStatusBadge({ status }: { status: ClientDayStatus }) {
  const meta = CLIENT_STATUS_META[status];
  return (
    <span
      title={meta.description}
      className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium", meta.cls)}
    >
      {meta.live && <LiveDot />}
      {meta.label}
    </span>
  );
}

/**
 * Client portal overview: their sites today with a simple cleaning status (Scheduled / In progress /
 * Completed) and the complaints they raised. No staff, times or inspection details.
 */
export function ClientDashboard() {
  const router = useRouter();
  const now = useNow(60 * 1000);
  const overview = useClientOverview();
  const complaintsQuery = useComplaints();

  const sites = useMemo(
    () =>
      [...(overview.data?.today ?? [])].sort(
        (a, b) => ORDER[a.status] - ORDER[b.status] || a.siteName.localeCompare(b.siteName),
      ),
    [overview.data],
  );
  const counts = useMemo(() => {
    const c: Record<ClientDayStatus, number> = { SCHEDULED: 0, CLEANING_IN_PROGRESS: 0, CLEANING_COMPLETED: 0 };
    for (const s of sites) c[s.status] += 1;
    return c;
  }, [sites]);

  const complaints = useMemo(() => complaintsQuery.data?.complaints ?? [], [complaintsQuery.data]);
  const complaintCounts = useMemo(() => {
    const c = { open: 0, review: 0, resolved: 0 };
    for (const x of complaints) {
      if (x.status === "resolved") c.resolved += 1;
      else if (x.status === "closed") c.review += 1;
      else c.open += 1;
    }
    return c;
  }, [complaints]);
  const complaintRows = useMemo(() => {
    const rank = (s: keyof typeof COMPLAINT_STATUS) => (s === "open" || s === "in_progress" ? 0 : s === "closed" ? 1 : 2);
    return [...complaints]
      .sort((a, b) => rank(a.status) - rank(b.status) || b.reportedAt.localeCompare(a.reportedAt))
      .slice(0, 8);
  }, [complaints]);

  if (overview.isLoading) {
    return (
      <div className="flex justify-center py-20 text-grey-400">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }
  if (overview.isError || !overview.data) {
    return (
      <p className="rounded-2xl bg-error/10 px-4 py-3 text-sm font-medium text-error">Failed to load the dashboard.</p>
    );
  }

  const d = overview.data;
  const today = todayISODate();
  const todayLabel = formatDayHeading(today);
  const updatedAt = overview.dataUpdatedAt
    ? new Date(overview.dataUpdatedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : null;
  void now;

  const cleaningSegments: DonutSegment[] = [
    { label: "Pending cleaning", value: counts.SCHEDULED, color: "#94A3B8" },
    { label: "Cleaning in progress", value: counts.CLEANING_IN_PROGRESS, color: "#F59E0B" },
    { label: "Cleaning completed", value: counts.CLEANING_COMPLETED, color: "#00A63E" },
  ];
  const complaintSegments: DonutSegment[] = [
    { label: "Open", value: complaintCounts.open, color: "#ED5F25" },
    { label: "Awaiting review", value: complaintCounts.review, color: "#2B7FFF" },
    { label: "Resolved", value: complaintCounts.resolved, color: "#00A63E" },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="dash-fade-up flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-on-surface sm:text-xl">Today {todayLabel}</h2>
          <p className="text-sm text-grey-500">
            {counts.CLEANING_IN_PROGRESS} site{counts.CLEANING_IN_PROGRESS === 1 ? "" : "s"} being cleaned now
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            void overview.refetch();
            void complaintsQuery.refetch();
          }}
          className="inline-flex items-center gap-2 rounded-full border border-grey-200 bg-surface px-3 py-1.5 text-sm font-medium text-grey-600 shadow-sm transition-colors hover:border-ink hover:text-ink"
          title="Refresh now (auto-refreshes every minute)"
        >
          <span className="text-emerald-600"><LiveDot /></span>
          Live{updatedAt ? ` · ${updatedAt}` : ""}
          <RefreshCw size={14} className={cn(overview.isFetching && "animate-spin")} aria-hidden="true" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Building2, bg: "bg-[#2B7FFF]/10", fg: "text-[#2B7FFF]", value: d.totalSites, label: "Total Sites", badge: undefined },
          {
            icon: CalendarCheck2, bg: "bg-[#ED5F25]/10", fg: "text-[#ED5F25]", value: d.todaySites, label: "Today's Sites",
            badge: counts.CLEANING_IN_PROGRESS > 0 ? `${counts.CLEANING_IN_PROGRESS} live` : undefined,
          },
          {
            icon: ClipboardList, bg: "bg-primary/10", fg: "text-ink", value: d.todayTasks, label: "Today's Tasks",
            badge: d.todayTasks > 0 ? `${d.todayTasksCompleted} done` : undefined,
          },
        ].map((c, i) => (
          <div key={c.label} className="dash-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
            <AdminStatCard icon={c.icon} iconBg={c.bg} iconColor={c.fg} value={c.value} label={c.label} badge={c.badge} badgeColor="text-ink font-semibold" />
          </div>
        ))}
      </div>

      <Panel
        title="Site cleaning status — today"
        icon={Sparkles}
        delay={100}
        action={<PanelLink href={`${DASH}?tab=site-schedule`}>Site schedule</PanelLink>}
      >
        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
          <DonutChart segments={cleaningSegments} centerValue={`${counts.CLEANING_COMPLETED}/${sites.length}`} centerLabel="sites cleaned" />
          {sites.length === 0 ? (
            <EmptyRows text="None of your sites are scheduled for cleaning today." />
          ) : (
            <div className="max-h-[420px] overflow-auto rounded-xl border border-grey-200">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 z-10 border-b border-grey-200 bg-grey-50 text-xs uppercase tracking-wide text-grey-500">
                  <tr>
                    <th className={TH}>Site</th>
                    <th className={TH}>Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-grey-100">
                  {sites.map((s: ClientSiteDay) => (
                    <tr key={`${s.siteId}_${s.date}`} className="transition-colors hover:bg-grey-50">
                      {/* max-w-0 + w-full lets a long site name truncate instead of widening the table. */}
                      <td className={cn(TD, "w-full max-w-0")}>
                        <Link
                          href={`${DASH}?tab=site-schedule&site=${s.siteId}`}
                          className="block truncate font-medium text-on-surface underline-offset-2 hover:underline"
                          title={s.siteName}
                        >
                          {s.siteName}
                        </Link>
                      </td>
                      <td className={cn(TD, "w-px whitespace-nowrap")}><ClientStatusBadge status={s.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Panel>

      <Panel
        title="Your complaints"
        icon={AlertTriangle}
        delay={150}
        action={
          <div className="flex items-center gap-3">
            <Link
              href="/admin/complaints?new=1"
              className="inline-flex items-center gap-1 rounded-full bg-ink px-3 py-1.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              <Plus size={14} aria-hidden="true" /> Complaint
            </Link>
            <PanelLink href="/admin/complaints">All complaints</PanelLink>
          </div>
        }
      >
        <div className="grid grid-cols-1 items-center gap-5 lg:grid-cols-2">
          <DonutChart segments={complaintSegments} centerValue={complaints.length} centerLabel="total" />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-1">
            <ComplaintTile icon={AlertTriangle} value={complaintCounts.open} label="Pending" color="#ED5F25" />
            <ComplaintTile icon={Clock} value={complaintCounts.review} label="Awaiting review" color="#2B7FFF" />
            <ComplaintTile icon={CalendarCheck2} value={complaintCounts.resolved} label="Resolved" color="#00A63E" />
          </div>
        </div>
        <div className="mt-5 border-t border-grey-100 pt-4">
          <div className="min-w-0">
            {complaintsQuery.isLoading ? (
              <div className="flex justify-center py-10 text-grey-400"><Loader2 className="h-5 w-5 animate-spin" /></div>
            ) : complaintRows.length === 0 ? (
              <EmptyRows text="You haven't raised any complaints." />
            ) : (
              <ComplaintsTable rows={complaintRows} now={now} onOpen={(c) => router.push(`/admin/complaints?complaint=${c.id}`)} />
            )}
          </div>
        </div>
      </Panel>
    </div>
  );
}
