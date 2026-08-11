"use client";

import { useMemo, useState } from "react";
import { AlertCircle, CheckCircle, CheckCircle2, Clock, MessageSquare } from "lucide-react";
import { useIsDrawerNav } from "@/components/layout/AppNav";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { FilterTabs } from "@/components/shared/FilterTabs";
import { SearchInput } from "@/components/shared/SearchInput";
import { PriorityBadge } from "@/components/shared/PriorityBadge";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { EmptyState } from "@/components/shared/EmptyState";
import { SiteSelector } from "@/components/shared/SiteSelector";
import { ComplaintRow } from "@/features/complaints/components/ComplaintRow";
import { AdminComplaintDetailModal } from "@/features/complaints/components/AdminComplaintDetailModal";
import { useComplaints } from "@/features/complaints/hooks/useComplaints";
import { useResolveComplaint } from "@/features/complaints/hooks/useResolveComplaint";
import { useActiveSite } from "@/features/attendance/hooks/useActiveSite";
import type { Complaint } from "@/features/complaints/types";
import { cn } from "@/lib/utils/cn";

type FilterOption = "All" | "Open" | "In progress" | "Resolved";

const FILTER_OPTIONS: FilterOption[] = ["All", "Open", "In progress", "Resolved"];

const FILTER_STATUS_MAP: Record<Exclude<FilterOption, "All">, Complaint["status"]> = {
  Open: "open",
  "In progress": "in_progress",
  Resolved: "resolved",
};

const STATUS_LABEL_MAP: Record<Complaint["status"], string> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
};

const STATUS_COLOR_MAP: Record<Complaint["status"], string> = {
  open: "bg-[#ED5F25]/20 text-[#ED5F25]",
  in_progress: "bg-primary/20 text-primary",
  resolved: "bg-success/20 text-success",
  closed: "bg-grey-300 text-grey-700",
};

function getStatusIcon(status: Complaint["status"]) {
  if (status === "resolved") return <CheckCircle size={18} className="text-success" />;
  if (status === "in_progress") return <Clock size={18} className="text-primary" />;
  return <AlertCircle size={18} className="text-[#ED5F25]" />;
}

function getIconBg(status: Complaint["status"]): string {
  if (status === "resolved") return "bg-success/10";
  if (status === "in_progress") return "bg-primary/10";
  return "bg-[#ED5F25]/10";
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

export default function ComplaintsPage() {
  const useDrawerNav = useIsDrawerNav();
  const { data, isLoading, isError } = useComplaints();
  const resolveComplaintMutation = useResolveComplaint();
  const { sites, selectedSiteId, setSelectedSiteId, checkedInSiteId } = useActiveSite();

  const [filter, setFilter] = useState<FilterOption>("All");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Complaint | null>(null);

  const allComplaints = useMemo(() => data?.complaints ?? [], [data]);

  // Only show complaints for the active (checked-in or selected) site.
  const siteScoped = useMemo(
    () => (selectedSiteId ? allComplaints.filter((c) => c.siteId === selectedSiteId) : allComplaints),
    [allComplaints, selectedSiteId],
  );

  const filtered = useMemo(
    () =>
      siteScoped.filter((c) => {
        const matchesFilter = filter === "All" || c.status === FILTER_STATUS_MAP[filter];
        const matchesSearch =
          search.trim() === "" ||
          c.title.toLowerCase().includes(search.toLowerCase()) ||
          c.code.toLowerCase().includes(search.toLowerCase());
        return matchesFilter && matchesSearch;
      }),
    [siteScoped, filter, search],
  );

  const kpis = useMemo(() => {
    let open = 0;
    let inProgress = 0;
    let resolved = 0;
    for (const c of siteScoped) {
      if (c.status === "open") open += 1;
      else if (c.status === "in_progress") inProgress += 1;
      else if (c.status === "resolved") resolved += 1;
    }
    return { open, inProgress, resolved, total: siteScoped.length };
  }, [siteScoped]);

  const mobileKpiCards = [
    { label: "Total", value: pad(kpis.total), color: "grey" as const },
    { label: "Pending", value: pad(kpis.open + kpis.inProgress), color: "orange" as const },
    { label: "Resolved", value: pad(kpis.resolved), color: "green" as const },
  ];

  function handleResolve(id: string) {
    resolveComplaintMutation.mutate(id);
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
        <ErrorMessage message="Failed to load complaints." />
      </div>
    );
  }

  return (
    <>
      {/* ---------- Desktop (admin-style row list) ---------- */}
      <div className={cn("p-6 lg:p-8", useDrawerNav ? "block" : "hidden lg:block")}>
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm text-grey-500">View and manage complaints</p>
            </div>
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
            <AdminStatCard
              icon={MessageSquare}
              iconBg="bg-[#ED5F25]/10"
              iconColor="text-[#ED5F25]"
              value={kpis.open}
              label="Open Complaints"
            />
            <AdminStatCard
              icon={Clock}
              iconBg="bg-primary/10"
              iconColor="text-primary"
              value={kpis.inProgress}
              label="In Progress"
              badge="Active"
              badgeColor="text-primary"
            />
            <AdminStatCard
              icon={CheckCircle2}
              iconBg="bg-success/10"
              iconColor="text-success"
              value={kpis.resolved}
              label="Resolved"
            />
            <AdminStatCard
              icon={AlertCircle}
              iconBg="bg-purple-100"
              iconColor="text-purple-600"
              value={kpis.total}
              label="Total Complaints"
            />
          </div>

          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <FilterTabs<FilterOption> options={FILTER_OPTIONS} value={filter} onChange={setFilter} />
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search complaints..."
              className="sm:w-72"
            />
          </div>

          {filtered.length === 0 ? (
            <EmptyState title="No complaints found" description="Try a different filter or search." />
          ) : (
            <div className="flex flex-wrap gap-4">
              {filtered.map((complaint) => (
                <ComplaintRow key={complaint.id} complaint={complaint} onClick={() => setSelected(complaint)} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ---------- Mobile (cleaner-style card list) ---------- */}
      <div
        className={cn("min-h-screen", useDrawerNav ? "hidden" : "lg:hidden")}
        style={{
          background:
            "radial-gradient(ellipse at top left, rgba(71,114,115,0.18) 0%, transparent 60%), #F5F5F5",
        }}
      >
        {!useDrawerNav && <PageHeader title="Complaints" />}

        <main
          className={cn(
            "mx-auto max-w-2xl px-5 pb-10",
            !useDrawerNav ? "-mt-5" : "pt-5",
          )}
        >
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

          <div className="mb-5 grid grid-cols-3 gap-3 pt-5">
            {mobileKpiCards.map((kpi) => (
              <KpiCard key={kpi.label} {...kpi} />
            ))}
          </div>

          <div className="mb-4">
            <FilterTabs options={FILTER_OPTIONS} value={filter} onChange={setFilter} />
          </div>

          <div className="flex flex-col gap-3">
            {filtered.length === 0 ? (
              <p className="py-8 text-center text-sm text-grey-500">No complaints found.</p>
            ) : (
              filtered.map((complaint) => {
                const location = [complaint.floor, complaint.area].filter(Boolean).join(" · ");
                const date = complaint.reportedAt?.slice(0, 10) ?? "";
                return (
                  <button
                    key={complaint.id}
                    onClick={() => setSelected(complaint)}
                    className="flex w-full rounded-2xl bg-white p-4 shadow-sm text-left gap-3 transition-shadow hover:shadow-md"
                  >
                    <div
                      className={cn(
                        "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                        getIconBg(complaint.status),
                      )}
                    >
                      {getStatusIcon(complaint.status)}
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-medium text-on-surface leading-snug">
                          {complaint.title}
                        </span>
                        <PriorityBadge priority={complaint.priority} />
                      </div>
                      <span className="text-xs text-grey-500">{location || complaint.site}</span>
                      <span className="text-xs text-grey-500">{complaint.code}</span>
                      <div className="mt-1 flex items-center justify-between gap-2">
                        <span
                          className={cn(
                            "rounded-xl px-2.5 py-0.5 text-xs font-medium",
                            STATUS_COLOR_MAP[complaint.status],
                          )}
                        >
                          {STATUS_LABEL_MAP[complaint.status]}
                        </span>
                        <span className="text-xs text-grey-500">{date}</span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </main>
      </div>

      <AdminComplaintDetailModal
        open={selected !== null}
        onClose={() => setSelected(null)}
        complaint={selected}
        onResolve={handleResolve}
      />
    </>
  );
}

interface KpiCardProps {
  label: string;
  value: string;
  color: "orange" | "green" | "grey";
}

function KpiCard({ label, value, color }: KpiCardProps) {
  const colorMap = {
    orange: "text-[#ED5F25] bg-[#ED5F25]/10",
    green: "text-success bg-success/10",
    grey: "text-grey-700 bg-grey-100",
  };

  return (
    <div className={cn("flex flex-col items-center justify-center gap-1 rounded-2xl py-4", colorMap[color])}>
      <span className="text-2xl font-bold leading-none">{value}</span>
      <span className="text-[11px] font-medium opacity-80 text-center leading-tight">{label}</span>
    </div>
  );
}
