"use client";

import { useMemo, useState } from "react";
import { AlertCircle, CheckCircle, CheckCircle2, Clock, MessageSquare } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { SiteFilterSelect } from "@/components/admin/SiteFilterSelect";
import { FilterTabs } from "@/components/shared/FilterTabs";
import { SearchInput } from "@/components/shared/SearchInput";
import { PriorityBadge } from "@/components/shared/PriorityBadge";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { EmptyState } from "@/components/shared/EmptyState";
import { SiteSelector } from "@/components/shared/SiteSelector";
import { useComplaints } from "@/features/complaints/hooks/useComplaints";
import { useResolveComplaint } from "@/features/complaints/hooks/useResolveComplaint";
import { useActiveSite } from "@/features/attendance/hooks/useActiveSite";
import { useSites } from "@/features/user-management/hooks/useSites";
import { ComplaintRow } from "@/features/complaints/components/ComplaintRow";
import { ComplaintDetailModal } from "@/features/complaints/components/ComplaintDetailModal";
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
  const { data, isLoading, isError } = useComplaints();
  const resolveComplaintMutation = useResolveComplaint();
  const [selected, setSelected] = useState<Complaint | null>(null);

  // Desktop toolbar state
  const sitesQuery = useSites();
  const [desktopSiteId, setDesktopSiteId] = useState("");
  const [desktopFilter, setDesktopFilter] = useState<FilterOption>("All");
  const [search, setSearch] = useState("");

  // Mobile toolbar state
  const { sites: mySites, selectedSiteId, setSelectedSiteId, checkedInSiteId } = useActiveSite();
  const [mobileFilter, setMobileFilter] = useState<FilterOption>("All");

  const allComplaints = useMemo(() => data?.complaints ?? [], [data]);

  const desktopFiltered = useMemo(
    () =>
      allComplaints.filter((c) => {
        const matchesSite = !desktopSiteId || c.siteId === desktopSiteId;
        const matchesFilter = desktopFilter === "All" || c.status === FILTER_STATUS_MAP[desktopFilter];
        const matchesSearch =
          search.trim() === "" ||
          c.title.toLowerCase().includes(search.toLowerCase()) ||
          c.code.toLowerCase().includes(search.toLowerCase());
        return matchesSite && matchesFilter && matchesSearch;
      }),
    [allComplaints, desktopSiteId, desktopFilter, search],
  );

  const mobileComplaints = useMemo(
    () => (selectedSiteId ? allComplaints.filter((c) => c.siteId === selectedSiteId) : allComplaints),
    [allComplaints, selectedSiteId],
  );

  const mobileFiltered = useMemo(
    () =>
      mobileComplaints.filter((c) => {
        if (mobileFilter === "All") return true;
        return c.status === FILTER_STATUS_MAP[mobileFilter];
      }),
    [mobileComplaints, mobileFilter],
  );

  const mobileKpis = useMemo(() => {
    let open = 0;
    let inProgress = 0;
    let resolved = 0;
    for (const c of mobileComplaints) {
      if (c.status === "open") open += 1;
      else if (c.status === "in_progress") inProgress += 1;
      else if (c.status === "resolved") resolved += 1;
    }
    return { open, inProgress, resolved, total: mobileComplaints.length };
  }, [mobileComplaints]);

  const mobileKpiCards = [
    { label: "Total", value: pad(mobileKpis.total), color: "grey" as const },
    { label: "Pending", value: pad(mobileKpis.open + mobileKpis.inProgress), color: "orange" as const },
    { label: "Resolved", value: pad(mobileKpis.resolved), color: "green" as const },
  ];

  const siteOptions = [{ id: "", name: "All sites" }, ...(sitesQuery.data ?? [])];

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
      {/* Desktop — admin stat-card layout */}
      <div className="hidden p-6 lg:block lg:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <p className="text-sm text-grey-500">View and manage complaints</p>
            <SiteFilterSelect
              sites={siteOptions}
              value={desktopSiteId}
              onChange={setDesktopSiteId}
              loading={sitesQuery.isLoading}
            />
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <AdminStatCard
              icon={MessageSquare}
              iconBg="bg-[#ED5F25]/10"
              iconColor="text-[#ED5F25]"
              value={data.kpis.open}
              label="Open Complaints"
            />
            <AdminStatCard
              icon={Clock}
              iconBg="bg-primary/10"
              iconColor="text-primary"
              value={data.kpis.inProgress}
              label="In Progress"
              badge="Active"
              badgeColor="text-primary"
            />
            <AdminStatCard
              icon={CheckCircle2}
              iconBg="bg-success/10"
              iconColor="text-success"
              value={data.kpis.resolved}
              label="Resolved"
              badge="+5"
              badgeColor="text-success"
            />
            <AdminStatCard
              icon={AlertCircle}
              iconBg="bg-purple-100"
              iconColor="text-purple-600"
              value={data.kpis.total}
              label="Total Complaints"
            />
          </div>

          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <FilterTabs<FilterOption> options={FILTER_OPTIONS} value={desktopFilter} onChange={setDesktopFilter} />
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search complaints..."
              className="sm:w-72"
            />
          </div>

          {desktopFiltered.length === 0 ? (
            <EmptyState title="No complaints found" description="Try a different filter or search." />
          ) : (
            <div className="flex flex-wrap gap-4">
              {desktopFiltered.map((complaint) => (
                <ComplaintRow key={complaint.id} complaint={complaint} onClick={() => setSelected(complaint)} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile — cleaner list-card layout */}
      <div
        className="min-h-screen lg:hidden"
        style={{
          background:
            "radial-gradient(ellipse at top left, rgba(71,114,115,0.18) 0%, transparent 60%), #F5F5F5",
        }}
      >
        <PageHeader title="Complaints" />

        <main className="mx-auto max-w-2xl px-5 pb-28 -mt-5">
          {mySites.length > 1 && (
            <div className="pt-5">
              <SiteSelector
                sites={mySites}
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
            <FilterTabs options={FILTER_OPTIONS} value={mobileFilter} onChange={setMobileFilter} />
          </div>

          <div className="flex flex-col gap-3">
            {mobileFiltered.length === 0 ? (
              <p className="py-8 text-center text-sm text-grey-500">No complaints found.</p>
            ) : (
              mobileFiltered.map((complaint) => {
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

      <ComplaintDetailModal
        open={selected !== null}
        onClose={() => setSelected(null)}
        complaint={selected}
        onResolve={(id) => resolveComplaintMutation.mutate(id)}
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
