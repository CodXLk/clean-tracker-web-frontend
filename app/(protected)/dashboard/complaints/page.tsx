"use client";

import { useMemo, useState } from "react";
import { AlertCircle, CheckCircle, Clock } from "lucide-react";
import { BottomNavBar } from "@/components/layout/BottomNavBar";
import { PageHeader } from "@/components/shared/PageHeader";
import { FilterTabs } from "@/components/shared/FilterTabs";
import { PriorityBadge } from "@/components/shared/PriorityBadge";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { SiteSelector } from "@/components/shared/SiteSelector";
import { ComplaintDetailModal } from "@/components/modals/ComplaintDetailModal";
import { useComplaints } from "@/features/complaints/hooks/useComplaints";
import { useActiveSite } from "@/features/attendance/hooks/useActiveSite";
import type { Complaint } from "@/features/complaints/types";
import { cn } from "@/lib/utils/cn";

type FilterOption = "All" | "Open" | "In progress" | "Resolved";

const FILTER_OPTIONS: FilterOption[] = ["All", "Open", "In progress", "Resolved"];

const STATUS_LABEL_MAP: Record<Complaint["status"], string> = {
  open:        "Open",
  in_progress: "In Progress",
  resolved:    "Resolved",
  closed:      "Closed",
};

const STATUS_COLOR_MAP: Record<Complaint["status"], string> = {
  open:        "bg-[#ED5F25]/20 text-[#ED5F25]",
  in_progress: "bg-primary/20 text-primary",
  resolved:    "bg-success/20 text-success",
  closed:      "bg-grey-300 text-grey-700",
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
  const { data, isLoading, isError } = useComplaints();
  const { sites, selectedSiteId, setSelectedSiteId, checkedInSiteId } = useActiveSite();
  const [activeFilter, setActiveFilter] = useState<FilterOption>("All");
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  const allComplaints = useMemo(() => data?.complaints ?? [], [data]);

  // Only show complaints for the active (checked-in or selected) site.
  const complaints = useMemo(
    () => (selectedSiteId ? allComplaints.filter((c) => c.siteId === selectedSiteId) : allComplaints),
    [allComplaints, selectedSiteId],
  );

  const filtered = useMemo(
    () =>
      complaints.filter((c) => {
        if (activeFilter === "All") return true;
        if (activeFilter === "Open") return c.status === "open";
        if (activeFilter === "In progress") return c.status === "in_progress";
        if (activeFilter === "Resolved") return c.status === "resolved";
        return true;
      }),
    [complaints, activeFilter],
  );

  const kpis = useMemo(() => {
    let open = 0;
    let inProgress = 0;
    let resolved = 0;
    for (const c of complaints) {
      if (c.status === "open") open += 1;
      else if (c.status === "in_progress") inProgress += 1;
      else if (c.status === "resolved") resolved += 1;
    }
    return { open, inProgress, resolved, total: complaints.length };
  }, [complaints]);

  const kpiCards = [
    { label: "Total", value: pad(kpis.total), color: "grey" as const },
    { label: "Pending", value: pad(kpis.open + kpis.inProgress), color: "orange" as const },
    { label: "Resolved", value: pad(kpis.resolved), color: "green" as const },
  ];

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "radial-gradient(ellipse at top left, rgba(71,114,115,0.18) 0%, transparent 60%), #F5F5F5",
      }}
    >
      <PageHeader title="Complaints" />

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
        <div className="mb-5 grid grid-cols-3 gap-3 pt-5">
          {kpiCards.map((kpi) => (
            <KpiCard key={kpi.label} {...kpi} />
          ))}
        </div>

        {/* Filter tabs */}
        <div className="mb-4">
          <FilterTabs
            options={FILTER_OPTIONS}
            value={activeFilter}
            onChange={setActiveFilter}
          />
        </div>

        {/* States */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner size={32} />
          </div>
        ) : isError ? (
          <div className="py-16">
            <ErrorMessage message="Failed to load complaints." />
          </div>
        ) : (
          <div className="flex flex-col gap-3 lg:grid lg:grid-cols-2">
            {filtered.length === 0 ? (
              <p className="col-span-2 py-8 text-center text-sm text-grey-500">
                No complaints found.
              </p>
            ) : (
              filtered.map((complaint) => {
                const location = [complaint.floor, complaint.area].filter(Boolean).join(" · ");
                const date = complaint.reportedAt?.slice(0, 10) ?? "";
                return (
                  <button
                    key={complaint.id}
                    onClick={() => setSelectedComplaint(complaint)}
                    className="flex w-full rounded-2xl bg-white p-4 shadow-sm text-left gap-3 transition-shadow hover:shadow-md"
                  >
                    {/* Status icon circle */}
                    <div
                      className={cn(
                        "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                        getIconBg(complaint.status),
                      )}
                    >
                      {getStatusIcon(complaint.status)}
                    </div>

                    {/* Content */}
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
        )}
      </main>

      {/* Complaint Detail Modal */}
      <ComplaintDetailModal
        open={selectedComplaint !== null}
        onClose={() => setSelectedComplaint(null)}
        complaint={selectedComplaint}
      />

      <BottomNavBar />
    </div>
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
    green:  "text-success bg-success/10",
    grey:   "text-grey-700 bg-grey-100",
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
