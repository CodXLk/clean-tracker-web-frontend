"use client";

import { useMemo, useState } from "react";
import { AlertCircle, Clock, CheckCircle2, MessageSquare } from "lucide-react";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { FilterTabs } from "@/components/shared/FilterTabs";
import { SearchInput } from "@/components/shared/SearchInput";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { EmptyState } from "@/components/shared/EmptyState";
import { useComplaints } from "@/features/complaints/hooks/useComplaints";
import { useResolveComplaint } from "@/features/complaints/hooks/useResolveComplaint";
import { ComplaintRow } from "@/features/complaints/components/ComplaintRow";
import { AdminComplaintDetailModal } from "@/features/complaints/components/AdminComplaintDetailModal";
import type { Complaint } from "@/features/complaints/types";

type FilterOption = "All" | "Open" | "In progress" | "Resolved";

const FILTER_STATUS_MAP: Record<Exclude<FilterOption, "All">, Complaint["status"]> = {
  Open:          "open",
  "In progress": "in_progress",
  Resolved:      "resolved",
};

export default function ComplaintsPage() {
  const { data, isLoading, isError } = useComplaints();
  const resolveComplaintMutation = useResolveComplaint();

  const [filter, setFilter]     = useState<FilterOption>("All");
  const [search, setSearch]     = useState("");
  const [selected, setSelected] = useState<Complaint | null>(null);

  const filtered = useMemo(() => {
    const complaints = data?.complaints ?? [];
    return complaints.filter((c) => {
      const matchesFilter = filter === "All" || c.status === FILTER_STATUS_MAP[filter];
      const matchesSearch =
        search.trim() === "" ||
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.code.toLowerCase().includes(search.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [data, filter, search]);

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
    <div className="p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm text-grey-500">View and manage complaints</p>
          </div>
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
          <FilterTabs<FilterOption>
            options={["All", "Open", "In progress", "Resolved"]}
            value={filter}
            onChange={setFilter}
          />
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
              <ComplaintRow
                key={complaint.id}
                complaint={complaint}
                onClick={() => setSelected(complaint)}
              />
            ))}
          </div>
        )}
      </div>

      <AdminComplaintDetailModal
        open={selected !== null}
        onClose={() => setSelected(null)}
        complaint={selected}
        onResolve={(id) => resolveComplaintMutation.mutate(id)}
      />
    </div>
  );
}
